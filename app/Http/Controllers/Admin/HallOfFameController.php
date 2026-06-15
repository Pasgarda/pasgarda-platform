<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HallOfFame;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HallOfFameController extends Controller
{
    public function store(Request $request, $slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'year' => 'required|integer',
            'event_name' => 'required|string|max:255',
            'champion' => 'required|string|max:255',
            'runner_up' => 'required|string|max:255',
            'best_commander' => 'required|string|max:255',
            'favorite' => 'required|string|max:255',
        ]);

        HallOfFame::create($validated);

        return back()->with('status', 'Hall of Fame berhasil ditambahkan!');
    }

    public function update(Request $request, $slug, $id)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $hof = HallOfFame::findOrFail($id);

        $validated = $request->validate([
            'year' => 'required|integer',
            'event_name' => 'required|string|max:255',
            'champion' => 'required|string|max:255',
            'runner_up' => 'required|string|max:255',
            'best_commander' => 'required|string|max:255',
            'favorite' => 'required|string|max:255',
        ]);

        $hof->update($validated);

        return back()->with('status', 'Hall of Fame berhasil diperbarui!');
    }

    public function destroy($slug, $id)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $hof = HallOfFame::findOrFail($id);
        $hof->delete();

        return back()->with('status', 'Hall of Fame berhasil dihapus!');
    }
}
