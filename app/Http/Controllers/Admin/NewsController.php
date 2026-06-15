<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewsController extends Controller
{
    public function store(Request $request, $slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'summary' => 'required|string',
            'content' => 'nullable|string',
            'date' => 'required|string|max:255',
            'image_file' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('news', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        News::create($validated);

        return back()->with('status', 'Berita berhasil ditambahkan!');
    }

    public function update(Request $request, $slug, $id)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $news = News::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'summary' => 'required|string',
            'content' => 'nullable|string',
            'date' => 'required|string|max:255',
            'image_file' => 'nullable|image|max:2048',
        ]);

        if ($request->input('remove_cover') == 'true' || $request->input('remove_cover') === true) {
            if ($news->image_url && str_starts_with($news->image_url, '/storage/news/')) {
                $oldPath = str_replace('/storage/', '', $news->image_url);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $news->image_url = null;
            $news->save();
        }

        if ($request->hasFile('image_file')) {
            // Delete old file
            if ($news->image_url && str_starts_with($news->image_url, '/storage/news/')) {
                $oldPath = str_replace('/storage/', '', $news->image_url);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image_file')->store('news', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        $news->update($validated);

        return back()->with('status', 'Berita berhasil diperbarui!');
    }

    public function destroy($slug, $id)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $news = News::findOrFail($id);
        $news->delete();

        return back()->with('status', 'Berita berhasil dihapus!');
    }
}
