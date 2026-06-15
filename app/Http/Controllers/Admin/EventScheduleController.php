<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventScheduleController extends Controller
{
    public function store(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'day_type' => 'required|string|max:255',
            'date_string' => 'required|string|max:255',
            'categories' => 'required|array',
            'timeline' => 'required|array',
            'timeline.*.time' => 'required|string|max:255',
            'timeline.*.activity' => 'required|string|max:255',
        ]);

        EventSchedule::create([
            'event_id' => $event->id,
            'day_type' => $validated['day_type'],
            'date_string' => $validated['date_string'],
            'categories' => $validated['categories'],
            'timeline' => $validated['timeline'],
        ]);

        return back()->with('status', 'Jadwal berhasil ditambahkan!');
    }

    public function update(Request $request, $slug, $id)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $schedule = EventSchedule::findOrFail($id);

        $validated = $request->validate([
            'day_type' => 'required|string|max:255',
            'date_string' => 'required|string|max:255',
            'categories' => 'required|array',
            'timeline' => 'required|array',
            'timeline.*.time' => 'required|string|max:255',
            'timeline.*.activity' => 'required|string|max:255',
        ]);

        $schedule->update([
            'day_type' => $validated['day_type'],
            'date_string' => $validated['date_string'],
            'categories' => $validated['categories'],
            'timeline' => $validated['timeline'],
        ]);

        return back()->with('status', 'Jadwal berhasil diperbarui!');
    }

    public function destroy($slug, $id)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $schedule = EventSchedule::findOrFail($id);
        $schedule->delete();

        return back()->with('status', 'Jadwal berhasil dihapus!');
    }
}
