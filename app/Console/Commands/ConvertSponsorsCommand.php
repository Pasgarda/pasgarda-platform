<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Event;
use App\Models\EventContent;
use Illuminate\Support\Facades\Storage;

class ConvertSponsorsCommand extends Command
{
    protected $signature = 'app:convert-sponsors';
    protected $description = 'Convert source JPEG/PNG sponsor logos from sponsor folder to WebP and seed event sponsors';

    public function handle()
    {
        $this->info('Starting sponsor logo conversion and seeding...');

        $sourceDir = base_path('sponsor');
        if (!is_dir($sourceDir)) {
            $this->error("Source directory not found: {$sourceDir}");
            return 1;
        }

        // Get all files (PNG, JPEG, JPG, WEBP)
        $files = glob($sourceDir . '/*.{PNG,png,JPEG,jpeg,JPG,jpg,WEBP,webp}', GLOB_BRACE);
        if (empty($files)) {
            $this->error("No sponsor logo photos found in: {$sourceDir}");
            return 1;
        }

        $this->info("Found " . count($files) . " sponsor logos to process.");

        // Find the event
        $event = Event::where('slug', 'lpbb-vol20')->first();
        if (!$event) {
            $this->error("Event with slug 'lpbb-vol20' not found!");
            return 1;
        }

        $sponsorUrls = [];

        foreach ($files as $idx => $path) {
            $filename = basename($path);
            $this->line("Processing: {$filename}");
            $url = $this->convertAndSave($path, 'sponsors', 'sponsor_' . ($idx + 1));
            if ($url) {
                $sponsorUrls[] = $url;
                $this->line("  Saved: {$url}");
            }
        }

        // Save in database
        if (!empty($sponsorUrls)) {
            EventContent::updateOrCreate(
                ['event_id' => $event->id, 'key' => 'sponsors'],
                ['value' => $sponsorUrls]
            );
            $this->info("Seeded sponsors key in database successfully with " . count($sponsorUrls) . " items.");
        } else {
            $this->warn("No sponsor logo was successfully converted.");
        }

        $this->info('Sponsor conversion and seeding completed successfully!');
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

        // Scale image down if width is greater than 600 to keep it very lightweight for footer logos
        $width = imagesx($image);
        $height = imagesy($image);
        $maxWidth = 600;
        if ($width > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = intval($height * ($maxWidth / $width));
            $image = imagescale($image, $newWidth, $newHeight);
        }

        // Save to public disk
        $filename = $prefix . '_' . uniqid() . '.webp';
        $publicDisk = Storage::disk('public');
        
        $publicDisk->makeDirectory($folder);
        $targetPath = $folder . '/' . $filename;
        $fullPath = $publicDisk->path($targetPath);

        // Compress at 80% quality
        imagewebp($image, $fullPath, 80);
        imagedestroy($image);

        return '/storage/' . $targetPath;
    }
}
