<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessScoreAggregationJob;
use App\Models\Event;
use App\Models\Contingent;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ContingentCrudController extends Controller
{
    public function index($slug)
    {
        if (auth()->user()->role !== 'super_admin') {
            abort(403, 'Unauthorized action.');
        }

        $event = Event::where('slug', $slug)->firstOrFail();
        $contingents = Contingent::where('event_id', $event->id)
            ->orderBy('sort_order')
            ->orderBy('school_name')
            ->get();

        $coachUsers = User::where('role', 'coach')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Contingents', [
            'event' => $event,
            'contingents' => $contingents,
            'coachUsers' => $coachUsers,
        ]);
    }

    public function store(Request $request, $slug)
    {
        if (auth()->user()->role !== 'super_admin') {
            abort(403, 'Unauthorized action.');
        }

        $event = Event::where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'school_name' => 'required|string|max:255',
            'region' => 'required|string|max:255',
            'category_type' => 'required|in:U12,U16,U19,Purna',
            'is_reguler' => 'required|boolean',
            'status' => 'required|in:pending,verified',
            'coach_name' => 'required|string|max:255',
            'coach_phone' => 'required|string|max:20',
            'coach_email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
            'sort_order' => 'nullable|integer|min:0',
            'coach_user_id' => 'nullable|exists:users,id',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = '/storage/' . $request->file('logo')->store('contingents', 'public');
        }

        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => $validated['school_name'],
            'region' => $validated['region'],
            'category_type' => $validated['category_type'],
            'is_reguler' => $validated['is_reguler'],
            'status' => $validated['status'],
            'coach_name' => $validated['coach_name'],
            'coach_phone' => $validated['coach_phone'],
            'coach_email' => $validated['coach_email'] ?? null,
            'description' => $validated['description'] ?? null,
            'logo_path' => $logoPath,
            'sort_order' => $validated['sort_order'] ?? 0,
            'coach_user_id' => $validated['coach_user_id'] ?? null,
        ]);

        ProcessScoreAggregationJob::dispatch($contingent->event_id, $contingent->id);

        return back()->with('status', 'Sekolah Kontingen berhasil ditambahkan!');
    }

    public function update(Request $request, $slug, $id)
    {
        if (auth()->user()->role !== 'super_admin') {
            abort(403, 'Unauthorized action.');
        }

        $contingent = Contingent::findOrFail($id);

        $validated = $request->validate([
            'school_name' => 'required|string|max:255',
            'region' => 'required|string|max:255',
            'category_type' => 'required|in:U12,U16,U19,Purna',
            'is_reguler' => 'required|boolean',
            'status' => 'required|in:pending,verified',
            'coach_name' => 'required|string|max:255',
            'coach_phone' => 'required|string|max:20',
            'coach_email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
            'sort_order' => 'nullable|integer|min:0',
            'coach_user_id' => 'nullable|exists:users,id',
        ]);

        $updateData = [
            'school_name' => $validated['school_name'],
            'region' => $validated['region'],
            'category_type' => $validated['category_type'],
            'is_reguler' => $validated['is_reguler'],
            'status' => $validated['status'],
            'coach_name' => $validated['coach_name'],
            'coach_phone' => $validated['coach_phone'],
            'coach_email' => $validated['coach_email'] ?? null,
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'coach_user_id' => $validated['coach_user_id'] ?? null,
        ];

        if ($request->hasFile('logo')) {
            if ($contingent->logo_path) {
                $oldPath = str_replace('/storage/', '', $contingent->logo_path);
                Storage::disk('public')->delete($oldPath);
            }
            $updateData['logo_path'] = '/storage/' . $request->file('logo')->store('contingents', 'public');
        }

        $contingent->update($updateData);

        ProcessScoreAggregationJob::dispatch($contingent->event_id, $contingent->id);

        return back()->with('status', 'Sekolah Kontingen berhasil diperbarui!');
    }

    public function destroy($slug, $id)
    {
        if (auth()->user()->role !== 'super_admin') {
            abort(403, 'Unauthorized action.');
        }

        $contingent = Contingent::findOrFail($id);

        if ($contingent->logo_path) {
            $oldPath = str_replace('/storage/', '', $contingent->logo_path);
            Storage::disk('public')->delete($oldPath);
        }

        $contingent->delete();

        return back()->with('status', 'Sekolah Kontingen berhasil dihapus!');
    }
}
