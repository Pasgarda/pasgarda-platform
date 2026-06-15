<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Event;
use App\Models\EventContent;
use Illuminate\Support\Facades\Storage;

class ConvertSlidersCommand extends Command
{
    protected $signature = 'app:convert-sliders';
    protected $description = 'Convert source JPEG photos from fotofotopasgarda folder to WebP and seed home and event slider backgrounds';

    public function handle()
    {
        $this->info('Starting slider photos conversion and seeding...');

        $sourceDir = base_path('fotofotopasgarda');
        if (!is_dir($sourceDir)) {
            $this->error("Source directory not found: {$sourceDir}");
            return 1;
        }

        // Get all jpeg/jpg files
        $files = glob($sourceDir . '/*.{JPEG,jpeg,JPG,jpg}', GLOB_BRACE);
        if (empty($files)) {
            $this->error("No JPEG photos found in: {$sourceDir}");
            return 1;
        }

        $this->info("Found " . count($files) . " photos to process.");

        // Find the event
        $event = Event::where('slug', 'lpbb-vol20')->first();
        if (!$event) {
            $this->error("Event with slug 'lpbb-vol20' not found!");
            return 1;
        }

        // Divide files: first 8 for home (beranda), remaining for event
        $homePhotos = array_slice($files, 0, 8);
        $eventPhotos = array_slice($files, 8);

        $homeUrls = [];
        $eventUrls = [];

        // Convert home photos
        $this->info("Processing Home page slider backgrounds...");
        foreach ($homePhotos as $idx => $path) {
            $url = $this->convertAndSave($path, 'slider/home', 'home_' . ($idx + 1));
            if ($url) {
                $homeUrls[] = $url;
                $this->line("  Saved: {$url}");
            }
        }

        // Convert event photos
        $this->info("Processing Event page slider backgrounds...");
        foreach ($eventPhotos as $idx => $path) {
            $url = $this->convertAndSave($path, 'slider/event', 'event_' . ($idx + 1));
            if ($url) {
                $eventUrls[] = $url;
                $this->line("  Saved: {$url}");
            }
        }

        // Save in database
        if (!empty($homeUrls)) {
            EventContent::updateOrCreate(
                ['event_id' => $event->id, 'key' => 'home_slider'],
                ['value' => $homeUrls]
            );
        }

        if (!empty($eventUrls)) {
            EventContent::updateOrCreate(
                ['event_id' => $event->id, 'key' => 'event_slider'],
                ['value' => $eventUrls]
            );
        }

        $this->info('Slider conversion and seeding completed successfully!');
        return 0;
    }

    private function convertAndSave($tempPath, $folder, $prefix)
    {
        $info = getimagesize($tempPath);
        if (!$info) {
            return false;
        }

        $mime = $info['mime'];
        switch ($mime) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($tempPath);
                break;
            case 'image/png':
                $image = imagecreatefrompng($tempPath);
                break;
            case 'image/gif':
                $image = imagecreatefromgif($tempPath);
                break;
            case 'image/webp':
                $image = imagecreatefromwebp($tempPath);
                break;
            default:
                $image = imagecreatefromstring(file_get_contents($tempPath));
                break;
        }

        if (!$image) {
            return false;
        }

        // Scale image down if width is greater than 1920 to keep it lightweight
        $width = imagesx($image);
        $height = imagesy($image);
        $maxWidth = 1920;
        if ($width > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = intval($height * ($maxWidth / $width));
            $image = imagescale($image, $newWidth, $newHeight);
        }

        // Save to public disk
        $filename = $prefix . '_' . uniqid() . '.webp';
        $publicDisk = \Illuminate\Support\Facades\Storage::disk('public');
        
        $publicDisk->makeDirectory($folder);
        $targetPath = $folder . '/' . $filename;
        $fullPath = $publicDisk->path($targetPath);

        // Compress at 80% quality (excellent ratio of quality/size)
        imagewebp($image, $fullPath, 80);
        imagedestroy($image);

        return '/storage/' . $targetPath;
    }
}
