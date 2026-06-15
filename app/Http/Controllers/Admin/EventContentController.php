<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventContent;
use Illuminate\Http\Request;

class EventContentController extends Controller
{
    public function index($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $contents = $event->contents->pluck('value', 'key');
        $schedules = \App\Models\EventSchedule::where('event_id', $event->id)->get();
        $news = \App\Models\News::latest()->get();
        $hallOfFames = \App\Models\HallOfFame::orderBy('year', 'desc')->get();
        
        $testimonials = \App\Models\Testimonial::with('user:id,name,email,avatar')
            ->latest()
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'user_name' => $t->user?->name ?? '[Deleted]',
                'user_email' => $t->user?->email ?? '-',
                'user_avatar' => $t->user?->avatar,
                'rating' => $t->rating,
                'message' => $t->message,
                'status' => $t->status,
                'created_at' => $t->created_at->format('d M Y H:i'),
            ]);

        return inertia('Admin/EventContent', [
            'event' => $event,
            'contents' => $contents,
            'schedules' => $schedules,
            'news' => $news,
            'hallOfFames' => $hallOfFames,
            'testimonials' => $testimonials,
        ]);
    }

    public function update(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'judges' => 'nullable|array',
            'banthal_prize' => 'nullable|array',
            'useful_links' => 'nullable|array',
            'home_slider' => 'nullable|array',
            'event_slider' => 'nullable|array',
            'sponsors' => 'nullable|array',
        ]);

        // Clean up legacy agenda content
        EventContent::where('event_id', $event->id)->where('key', 'agenda')->delete();

        foreach (['judges', 'banthal_prize', 'useful_links', 'home_slider', 'event_slider', 'sponsors'] as $key) {
            if ($request->has($key)) {
                $json = $request->input($key);

                if ($key === 'judges' && is_array($json)) {
                    foreach ($json as $i => $judge) {
                        if ($request->hasFile("judges.{$i}.image_file")) {
                            $path = $request->file("judges.{$i}.image_file")->store('judges', 'public');
                            $json[$i]['image_url'] = '/storage/' . $path;
                        }
                        unset($json[$i]['image_file']);
                    }
                }

                if ($key === 'home_slider' && is_array($json)) {
                    $urls = [];
                    foreach ($json as $i => $item) {
                        if ($request->hasFile("home_slider.{$i}.file")) {
                            $url = $this->convertToWebp($request->file("home_slider.{$i}.file"), 'slider/home');
                            if ($url) {
                                $urls[] = $url;
                            }
                        } elseif (!empty($item['url'])) {
                            $urls[] = $item['url'];
                        }
                    }
                    $json = $urls;
                }

                if ($key === 'event_slider' && is_array($json)) {
                    $urls = [];
                    foreach ($json as $i => $item) {
                        if ($request->hasFile("event_slider.{$i}.file")) {
                            $url = $this->convertToWebp($request->file("event_slider.{$i}.file"), 'slider/event');
                            if ($url) {
                                $urls[] = $url;
                            }
                        } elseif (!empty($item['url'])) {
                            $urls[] = $item['url'];
                        }
                    }
                    $json = $urls;
                }

                if ($key === 'sponsors' && is_array($json)) {
                    $urls = [];
                    foreach ($json as $i => $item) {
                        if ($request->hasFile("sponsors.{$i}.file")) {
                            $url = $this->convertToWebp($request->file("sponsors.{$i}.file"), 'sponsors');
                            if ($url) {
                                $urls[] = $url;
                            }
                        } elseif (!empty($item['url'])) {
                            $urls[] = $item['url'];
                        }
                    }
                    $json = $urls;
                }

                if ($json === null || (is_array($json) && count($json) === 0)) {
                    EventContent::where('event_id', $event->id)->where('key', $key)->delete();
                } else {
                    EventContent::updateOrCreate(
                        ['event_id' => $event->id, 'key' => $key],
                        ['value' => $json]
                    );
                }
            }
        }
        \Illuminate\Support\Facades\Cache::forget('global_sponsors');

        return back()->with('status', 'Konten acara berhasil diperbarui.');
    }

    private function convertToWebp($file, $folder)
    {
        $tempPath = $file->getRealPath();
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

        $width = imagesx($image);
        $height = imagesy($image);
        $maxWidth = 1920;
        if ($width > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = intval($height * ($maxWidth / $width));
            $image = imagescale($image, $newWidth, $newHeight);
        }

        $prefix = str_replace('/', '_', $folder);
        $filename = uniqid($prefix . '_', true) . '.webp';
        $publicDisk = \Illuminate\Support\Facades\Storage::disk('public');
        
        $publicDisk->makeDirectory($folder);
        $targetPath = $folder . '/' . $filename;
        $fullPath = $publicDisk->path($targetPath);

        imagewebp($image, $fullPath, 80);
        imagedestroy($image);

        return '/storage/' . $targetPath;
    }
}
