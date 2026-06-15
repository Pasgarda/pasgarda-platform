<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Contingent;
use App\Models\IssuedTicket;
use App\Models\VoteLog;
use App\Models\Score;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class VoteController extends Controller
{
    public function vote(Request $request, $slug)
    {
        $request->validate([
            'contingent_id' => 'required|exists:contingents,id',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Anda harus login untuk melakukan voting.'], 401);
        }

        // 1. Self-Voting Prevention
        // Check if the user is coach/representative of the target contingent
        $ownContingent = Contingent::where('event_id', $event->id)
            ->where('id', $request->contingent_id)
            ->where(function ($query) use ($user) {
                $query->where('coach_email', $user->email)
                      ->orWhere('coach_name', $user->name);
            })
            ->first();

        if ($ownContingent) {
            return response()->json(['error' => 'Pencegahan Self-Voting: Anda dilarang memberikan suara untuk sekolah/kontingen Anda sendiri.'], 403);
        }

        // 2. Find a ticket owned by the user that still has vote tokens remaining
        $ticket = IssuedTicket::whereHas('order', function ($q) use ($user, $event) {
            $q->where('user_id', $user->id)->where('event_id', $event->id)->where('payment_status', 'paid');
        })
        ->where('vote_tokens_remaining', '>', 0)
        ->first();

        if (!$ticket) {
            return response()->json(['error' => 'Token voting Anda habis. Silakan beli tiket baru untuk mendapatkan token voting.'], 400);
        }

        // 3. Cast the vote
        DB::transaction(function () use ($event, $ticket, $request) {
            // Deduct token
            $ticket->decrement('vote_tokens_remaining');

            // Log vote
            VoteLog::create([
                'event_id' => $event->id,
                'issued_ticket_id' => $ticket->id,
                'contingent_id' => $request->contingent_id,
                'created_at' => now(),
            ]);

            // Dynamically recalculate "Nilai Kontingen Bonus" for all contingents in this event
            // to make sure tournament standings stay synchronized.
            Score::recalculateVotingBonuses($event->id);
        });

        return response()->json([
            'success' => true,
            'message' => 'Suara Anda berhasil dikirim!',
            'vote_tokens_remaining' => $ticket->fresh()->vote_tokens_remaining,
        ]);
    }
}
