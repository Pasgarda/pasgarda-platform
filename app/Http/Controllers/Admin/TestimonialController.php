<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestimonialController extends Controller
{
    public function toggleStatus($slug, $id)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $testimonial = Testimonial::findOrFail($id);

        $newStatus = $testimonial->status === 'enabled' ? 'disabled' : 'enabled';
        $testimonial->update(['status' => $newStatus]);

        return back()->with('status', "Testimoni {$newStatus}.");
    }

    public function destroy($slug, $id)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        if (!\App\Models\RolePermission::canAccess($event->id, auth()->user()->role, 'content')) {
            abort(403, 'Unauthorized action.');
        }

        $testimonial = Testimonial::findOrFail($id);
        $testimonial->delete();

        return back()->with('status', 'Testimoni berhasil dihapus.');
    }
}
