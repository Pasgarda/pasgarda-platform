<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\BulkBroadcastJob;
use App\Models\Event;
use App\Models\IssuedTicket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BroadcasterController extends Controller
{
    public function showBroadcastForm($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        // Get count of unique buyer emails
        $uniqueEmailsCount = IssuedTicket::whereHas('order', function ($q) use ($event) {
            $q->where('event_id', $event->id)->where('payment_status', 'paid');
        })
        ->whereNotNull('buyer_email')
        ->distinct('buyer_email')
        ->count('buyer_email');

        $coachCount = User::where('role', 'coach')->count();
        $allUsersCount = User::whereNotNull('email')->count();

        return Inertia::render('Admin/EmailBroadcast', [
            'event' => $event,
            'visitorCount' => $uniqueEmailsCount,
            'coachCount' => $coachCount,
            'allUsersCount' => $allUsersCount,
        ]);
    }

    public function sendBroadcast(Request $request, $slug)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message_body' => 'required|string',
            'target_type' => 'required|in:all,coach,all_users',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();

        $emails = [];

        if ($request->target_type === 'all') {
            $visitorEmails = IssuedTicket::whereHas('order', function ($q) use ($event) {
                $q->where('event_id', $event->id)->where('payment_status', 'paid');
            })
            ->whereNotNull('buyer_email')
            ->distinct('buyer_email')
            ->pluck('buyer_email')
            ->toArray();
            $emails = array_merge($emails, $visitorEmails);
        }

        if ($request->target_type === 'all_users') {
            $allUserEmails = User::whereNotNull('email')
                ->pluck('email')
                ->toArray();
            $emails = array_merge($emails, $allUserEmails);
        }

        $coachEmails = User::where('role', 'coach')
            ->whereNotNull('email')
            ->pluck('email')
            ->toArray();

        if ($request->target_type === 'coach') {
            $emails = $coachEmails;
        } else {
            $emails = array_merge($emails, $coachEmails);
        }

        $emails = array_values(array_unique(array_filter($emails)));

        if (empty($emails)) {
            return back()->withErrors(['message_body' => 'Tidak ada email penerima terdaftar untuk target broadcast ini.']);
        }

        $subject = $request->subject;
        $body = $request->message_body;

        BulkBroadcastJob::dispatch($emails, $subject, $body);

        Log::info("QUEUED BULK EMAIL BROADCAST for event {$event->name} (Target: {$request->target_type}) to " . count($emails) . " recipients.");

        return back()->with('status', 'Email Broadcast massal berhasil dikirimkan ke ' . count($emails) . ' penerima!');
    }
}
