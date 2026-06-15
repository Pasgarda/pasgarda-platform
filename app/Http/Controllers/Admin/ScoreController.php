<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Contingent;
use App\Models\Score;
use App\Models\ScorePbbDetail;
use App\Models\ScoreFinalRound;
use App\Models\ScoringRubric;
use App\Models\JuryMember;
use App\Models\JuryScore;
use App\Models\VoteLog;
use App\Models\IssuedTicket;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ScoreController extends Controller
{
    public function fillAllDemo(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $contingents = Contingent::where('event_id', $event->id)
            ->where('category_type', $request->category_type)
            ->get();

        if ($contingents->isEmpty()) {
            return back()->with('error', 'Tidak ada kontingen untuk kategori ini.');
        }

        // Find or create a demo issued ticket
        $ticket = IssuedTicket::whereHas('order', function ($q) use ($event) {
            $q->where('event_id', $event->id);
        })->first();

        if (!$ticket) {
            $order = \App\Models\Order::create([
                'event_id' => $event->id,
                'user_id' => 1,
                'buyer_name' => 'Demo',
                'buyer_email' => 'demo@pasgarda.test',
                'order_status' => 'approved',
                'total_amount' => 0,
                'payment_method' => 'manual_transfer',
            ]);
            $package = \App\Models\TicketPackage::where('event_id', $event->id)->first();
            $ticket = IssuedTicket::create([
                'order_id' => $order->id,
                'ticket_package_id' => $package?->id ?? 1,
                'buyer_name' => 'Demo',
                'unique_qr_hash' => 'demo-' . uniqid(),
                'check_in_status' => false,
                'vote_tokens_remaining' => 999,
                'days_remaining' => 2,
                'coupon_tokens_remaining' => 0,
            ]);
        }

        DB::transaction(function () use ($event, $contingents, $ticket) {
            // Delete existing vote logs for these contingents
            VoteLog::where('event_id', $event->id)
                ->whereIn('contingent_id', $contingents->pluck('id'))
                ->delete();

            // Create random vote logs for each contingent
            foreach ($contingents as $contingent) {
                $voteCount = rand(5, 50);
                $logs = [];
                $now = now();
                for ($i = 0; $i < $voteCount; $i++) {
                    $logs[] = [
                        'event_id' => $event->id,
                        'issued_ticket_id' => $ticket->id,
                        'contingent_id' => $contingent->id,
                        'created_at' => (clone $now)->subMinutes(rand(0, 1440)),
                    ];
                }
                VoteLog::insert($logs);
            }

            Score::recalculateVotingBonuses($event->id);

            // Determine top 2 by selection score
            $scored = [];
            foreach ($contingents as $c) {
                $score = Score::where('event_id', $event->id)
                    ->where('contingent_id', $c->id)
                    ->first();
                if (!$score) continue;
                $voteLogsCount = VoteLog::where('event_id', $event->id)
                    ->where('contingent_id', $c->id)
                    ->count();
                $selectionScore = (float) $score->pbb_score + (float) $score->danton_score
                    + (float) $score->vafor_score
                    - (float) $score->penalties_score;
                $scored[] = [
                    'contingent_id' => $c->id,
                    'selectionScore' => $selectionScore,
                    'votes' => $voteLogsCount,
                ];
            }
            usort($scored, fn($a, $b) => $b['selectionScore'] - $a['selectionScore']);

            // Fill final round scores for top 2
            $top2 = array_slice($scored, 0, 2);
            $pbbMovements = $this->getChildRubrics($event->id, 'final', 'pbb') ?: $this->defaultPbbMovements();
            $dantonItems = $this->getChildRubrics($event->id, 'final', 'danton') ?: $this->defaultDantonItems();
            $variasiItems = $this->getChildRubrics($event->id, 'final', 'variasi') ?: $this->defaultVariasiItems();
            $formasiItems = $this->getChildRubrics($event->id, 'final', 'formasi') ?: $this->defaultFormasiItems();
            $dantonVaforItems = $this->getChildRubrics($event->id, 'final', 'danton_vafor') ?: $this->defaultDantonVaforItems();

            foreach ($top2 as $item) {
                $record = ScoreFinalRound::firstOrNew([
                    'event_id' => $event->id,
                    'contingent_id' => $item['contingent_id'],
                ]);

                for ($i = 1; $i <= 3; $i++) {
                    $pbbDet = [];
                    $dantonDet = [];
                    foreach ($pbbMovements as $idx => $m) { $pbbDet[$m . '_' . $idx] = 10; }
                    foreach ($dantonItems as $d) { $dantonDet[$d] = 10; }
                    $record->{"juri_{$i}_pbb_details"} = $pbbDet;
                    $record->{"juri_{$i}_danton_details"} = $dantonDet;
                }

                for ($i = 1; $i <= 2; $i++) {
                    $varDet = [];
                    $forDet = [];
                    $dvDet = [];
                    foreach ($variasiItems as $v) { $varDet[$v] = 10; }
                    foreach ($formasiItems as $f) { $forDet[$f] = 10; }
                    foreach ($dantonVaforItems as $dv) { $dvDet[$dv] = 10; }
                    $record->{"juri_{$i}_variasi_details"} = $varDet;
                    $record->{"juri_{$i}_formasi_details"} = $forDet;
                    $record->{"juri_{$i}_danton_vafor_details"} = $dvDet;
                }

                $pbbSum = 0; $dantonSum = 0;
                for ($i = 1; $i <= 3; $i++) {
                    $pbbSum += array_sum($record->{"juri_{$i}_pbb_details"});
                    $dantonSum += array_sum($record->{"juri_{$i}_danton_details"});
                }
                $vaforSum = 0;
                for ($i = 1; $i <= 2; $i++) {
                    $vaforSum += array_sum($record->{"juri_{$i}_variasi_details"})
                        + array_sum($record->{"juri_{$i}_formasi_details"})
                        + array_sum($record->{"juri_{$i}_danton_vafor_details"});
                }

                $record->pbb_score = (int) round($pbbSum);
                $record->danton_score = (int) round($dantonSum);
                $record->vafor_score = (int) round($vaforSum);
                $record->score_juri_1 = (int) round($pbbSum + $dantonSum);
                $record->score_juri_2 = (int) round($vaforSum);
                if ($record->penalties === null) { $record->penalties = 0; }
                $record->save();
            }

            Score::recalculateVotingBonuses($event->id);
        });

        return back()->with('status', 'Demo berhasil: vote dan nilai final round untuk kategori ' . $request->category_type . ' telah diisi!');
    }

    public function fillDemoFirstRound(Request $request, $slug)
    {
        $request->validate(['category_type' => 'required|string']);

        $event = Event::where('slug', $slug)->firstOrFail();
        $categoryType = $request->category_type;

        $contingents = Contingent::where('event_id', $event->id)
            ->where('category_type', $categoryType)
            ->get();

        if ($contingents->isEmpty()) {
            return back()->with('error', 'Tidak ada kontingen untuk kategori ini.');
        }

        $pbbItems = $this->getChildRubrics($event->id, 'rekap', 'pbb');
        $pbbU12Items = $this->getChildRubrics($event->id, 'rekap', 'pbb_u12');
        $dantonItems = $this->getChildRubrics($event->id, 'rekap', 'danton');
        $variasiItems = $this->getChildRubrics($event->id, 'rekap', 'variasi');
        $formasiItems = $this->getChildRubrics($event->id, 'rekap', 'formasi');
        $dantonVaforItems = $this->getChildRubrics($event->id, 'rekap', 'danton_vafor');
        $kostumItems = $this->getChildRubrics($event->id, 'rekap', 'kostum');
        $makeupItems = $this->getChildRubrics($event->id, 'rekap', 'makeup');

        $juryMembers = $this->getJuryMembersGrouped($event->id, 'rekap');

        $fillRandom = function ($items, $min, $max) {
            $res = [];
            foreach ($items as $item) {
                $res[$item] = 10;
            }
            return $res;
        };

        DB::transaction(function () use ($event, $contingents, $pbbItems, $pbbU12Items, $dantonItems, $variasiItems, $formasiItems, $dantonVaforItems, $kostumItems, $makeupItems, $juryMembers, $fillRandom) {
            foreach ($contingents as $contingent) {
                $pbbMovements = $contingent->category_type === 'U12' ? $pbbU12Items : $pbbItems;

                foreach (['pbb', 'vafor', 'makeup_kostum'] as $juryType) {
                    if (!isset($juryMembers[$juryType])) continue;

                    foreach ($juryMembers[$juryType] as $jury) {
                        $juryNumber = $jury['id'];
                        $pbbDetails = null; $dantonDetails = null;
                        $variasiDetails = null; $formasiDetails = null; $dantonVaforDetails = null;
                        $kostumDetails = null; $makeupDetails = null;
                        $pbbSum = 0; $dantonSum = 0; $variasiSum = 0; $formasiSum = 0; $dantonVaforSum = 0;
                        $kostumSum = 0; $makeupSum = 0;

                        if ($juryType === 'pbb') {
                            $pbbDetails = $fillRandom($pbbMovements, 70, 95);
                            $dantonDetails = $fillRandom($dantonItems, 75, 95);
                            $pbbSum = (int) round(array_sum($pbbDetails));
                            $dantonSum = (int) round(array_sum($dantonDetails));
                        } elseif ($juryType === 'vafor') {
                            $variasiDetails = $fillRandom($variasiItems, 70, 95);
                            $formasiDetails = $fillRandom($formasiItems, 70, 95);
                            $dantonVaforDetails = $fillRandom($dantonVaforItems, 75, 95);
                            $variasiSum = (int) round(array_sum($variasiDetails));
                            $formasiSum = (int) round(array_sum($formasiDetails));
                            $dantonVaforSum = (int) round(array_sum($dantonVaforDetails));
                        } else {
                            $kostumDetails = $fillRandom($kostumItems, 70, 95);
                            $makeupDetails = $fillRandom($makeupItems, 70, 95);
                            $kostumSum = (int) round(array_sum($kostumDetails));
                            $makeupSum = (int) round(array_sum($makeupDetails));
                        }

                        $totalJuryScore = $pbbSum + $dantonSum + $variasiSum + $formasiSum + $dantonVaforSum + $kostumSum + $makeupSum;

                        JuryScore::updateOrCreate(
                            [
                                'event_id' => $event->id,
                                'round' => 'rekap',
                                'contingent_id' => $contingent->id,
                                'jury_type' => $juryType,
                                'jury_number' => $juryNumber,
                            ],
                            [
                                'pbb_score' => $pbbSum,
                                'danton_score' => $dantonSum,
                                'variasi_score' => $variasiSum,
                                'formasi_score' => $formasiSum,
                                'danton_vafor_score' => $dantonVaforSum,
                                'kostum_score' => $kostumSum,
                                'makeup_score' => $makeupSum,
                                'penalties_score' => 0,
                                'total_score' => $totalJuryScore,
                                'pbb_details' => $pbbDetails,
                                'danton_details' => $dantonDetails,
                                'variasi_details' => $variasiDetails,
                                'formasi_details' => $formasiDetails,
                                'danton_vafor_details' => $dantonVaforDetails,
                                'kostum_details' => $kostumDetails,
                                'makeup_details' => $makeupDetails,
                            ]
                        );
                    }
                }

                $this->aggregateScores($event->id, $contingent->id);
            }

            Score::recalculateVotingBonuses($event->id);
        });

        return back()->with('status', "Semua nilai demo untuk kategori {$categoryType} berhasil diisi!");
    }

    public function storeFirstRoundScore(Request $request, $slug)
    {
        $request->validate([
            'contingent_id' => 'required|integer',
            'pbb_scores' => 'nullable|array',
            'danton_scores' => 'nullable|array',
            'variasi_scores' => 'nullable|array',
            'formasi_scores' => 'nullable|array',
            'danton_vafor_scores' => 'nullable|array',
            'kostum_scores' => 'nullable|array',
            'makeup_scores' => 'nullable|array',
            'penalties' => 'nullable|numeric',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $contingentId = $request->contingent_id;

        $pbbSum = $request->pbb_scores ? (int) round(array_sum($request->pbb_scores)) : 0;
        $dantonSum = $request->danton_scores ? (int) round(array_sum($request->danton_scores)) : 0;
        $variasiSum = $request->variasi_scores ? (int) round(array_sum($request->variasi_scores)) : 0;
        $formasiSum = $request->formasi_scores ? (int) round(array_sum($request->formasi_scores)) : 0;
        $dantonVaforSum = $request->danton_vafor_scores ? (int) round(array_sum($request->danton_vafor_scores)) : 0;
        $kostumSum = $request->kostum_scores ? (int) round(array_sum($request->kostum_scores)) : 0;
        $makeupSum = $request->makeup_scores ? (int) round(array_sum($request->makeup_scores)) : 0;
        $penalties = (float) ($request->penalties ?? 0);

        Score::updateOrCreate(
            ['event_id' => $event->id, 'contingent_id' => $contingentId],
            [
                'pbb_score' => $pbbSum,
                'danton_score' => $dantonSum,
                'vafor_score' => $variasiSum + $formasiSum + $dantonVaforSum,
                'variasi_score' => $variasiSum,
                'formasi_score' => $formasiSum,
                'danton_vafor_score' => $dantonVaforSum,
                'kostum_score' => $kostumSum,
                'makeup_score' => $makeupSum,
                'penalties_score' => $penalties,
            ]
        );

        Score::recalculateVotingBonuses($event->id);

        return back()->with('status', 'Nilai babak pertama berhasil disimpan!');
    }

    public function fillDemoVotes(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $categoryType = $request->category_type;

        $contingents = Contingent::where('event_id', $event->id)
            ->where('category_type', $categoryType)
            ->get();

        if ($contingents->isEmpty()) {
            return back()->with('error', 'Tidak ada kontingen untuk kategori ini.');
        }

        $packages = \App\Models\TicketPackage::where('event_id', $event->id)
            ->where('is_active', true)
            ->get();

        if ($packages->isEmpty()) {
            return back()->with('error', 'Tidak ada paket tiket aktif untuk event ini.');
        }

        DB::transaction(function () use ($event, $contingents, $packages) {
            // Reset existing demo data
            VoteLog::where('event_id', $event->id)
                ->whereIn('contingent_id', $contingents->pluck('id'))
                ->delete();

            IssuedTicket::where('unique_qr_hash', 'like', 'DEMO-%')->delete();

            \App\Models\Order::where('midtrans_transaction_id', 'like', 'DEMO-%')->delete();

            \App\Models\User::where('email', 'like', 'demo_voter_%@example.com')->delete();

            // Create 100 demo users
            $users = [];
            for ($i = 1; $i <= 100; $i++) {
                $users[] = \App\Models\User::create([
                    'name' => 'Pendukung ' . $i,
                    'email' => 'demo_voter_' . $i . '@example.com',
                    'password' => bcrypt('demo123'),
                    'role' => 'spectator',
                ]);
            }

            // Create orders + 3 random tickets per user
            $allTickets = [];
            foreach ($users as $user) {
                $totalPrice = 0;
                $ticketEntries = [];

                for ($t = 0; $t < 3; $t++) {
                    $pkg = $packages->random();
                    $totalPrice += $pkg->price;
                    $ticketEntries[] = $pkg;
                }

                $order = \App\Models\Order::create([
                    'user_id' => $user->id,
                    'event_id' => $event->id,
                    'midtrans_transaction_id' => 'DEMO-' . uniqid(),
                    'total_price' => $totalPrice,
                    'payment_status' => 'paid',
                    'payment_method' => 'manual_transfer',
                ]);

                foreach ($ticketEntries as $pkg) {
                    $ticket = IssuedTicket::create([
                        'order_id' => $order->id,
                        'ticket_package_id' => $pkg->id,
                        'unique_qr_hash' => 'DEMO-' . uniqid(),
                        'buyer_name' => $user->name,
                        'buyer_email' => $user->email,
                        'check_in_status' => true,
                        'checked_in_at' => now(),
                        'vote_tokens_remaining' => $pkg->vote_allowance,
                        'days_remaining' => $pkg->validity_days,
                        'coupon_tokens_remaining' => 0,
                        'supporter_tokens_remaining' => 0,
                    ]);
                    $allTickets[] = [
                        'ticket' => $ticket,
                        'allowance' => $pkg->vote_allowance,
                    ];
                }
            }

            // Create vote logs — each ticket votes up to its vote_allowance
            $now = now();
            $logs = [];
            foreach ($allTickets as $item) {
                for ($v = 0; $v < $item['allowance']; $v++) {
                    $logs[] = [
                        'event_id' => $event->id,
                        'issued_ticket_id' => $item['ticket']->id,
                        'contingent_id' => $contingents->random()->id,
                        'created_at' => (clone $now)->subMinutes(rand(0, 43200)),
                    ];
                    if (count($logs) >= 100) {
                        VoteLog::insert($logs);
                        $logs = [];
                    }
                }
            }
            if (!empty($logs)) {
                VoteLog::insert($logs);
            }

            IssuedTicket::where('unique_qr_hash', 'like', 'DEMO-%')
                ->update(['vote_tokens_remaining' => 0]);

            Score::recalculateVotingBonuses($event->id);
        });

        $totalVotes = $contingents->sum(function ($c) {
            return $c->voteLogs()->count();
        });

        return back()->with('status', "Data vote demo untuk kategori {$categoryType} berhasil diisi (100 pendukung, masing-masing 3 tiket, {$contingents->count()} kontingen)! Total ~{$totalVotes} votes.");
    }

    public function resetVotes(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $categoryType = $request->category_type;

        $contingents = Contingent::where('event_id', $event->id)
            ->where('category_type', $categoryType)
            ->get();

        if ($contingents->isEmpty()) {
            return back()->with('error', 'Tidak ada kontingen untuk kategori ini.');
        }

        $contingentIds = $contingents->pluck('id');

        DB::transaction(function () use ($event, $contingentIds) {
            VoteLog::where('event_id', $event->id)
                ->whereIn('contingent_id', $contingentIds)
                ->delete();

            IssuedTicket::where('unique_qr_hash', 'like', 'DEMO-%')->delete();

            \App\Models\Order::where('midtrans_transaction_id', 'like', 'DEMO-%')->delete();

            \App\Models\User::where('email', 'like', 'demo_voter_%@example.com')->delete();

            Score::recalculateVotingBonuses($event->id);
        });

        return back()->with('status', "Semua data vote demo untuk kategori {$categoryType} berhasil dihapus!");
    }

    public function storeJuryScore(Request $request, $slug)
    {
        $request->validate([
            'contingent_id' => 'required|integer',
            'jury_type' => 'required|in:pbb,vafor,makeup_kostum',
            'jury_number' => 'required|integer',
            'pbb_details' => 'nullable|array',
            'danton_details' => 'nullable|array',
            'variasi_details' => 'nullable|array',
            'formasi_details' => 'nullable|array',
            'danton_vafor_details' => 'nullable|array',
            'kostum_details' => 'nullable|array',
            'makeup_details' => 'nullable|array',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $contingentId = $request->contingent_id;
        $juryType = $request->jury_type;
        $juryNumber = $request->jury_number;

        $pbbSum = $request->pbb_details ? array_sum($request->pbb_details) : 0;
        $dantonSum = $request->danton_details ? array_sum($request->danton_details) : 0;
        $variasiSum = $request->variasi_details ? array_sum($request->variasi_details) : 0;
        $formasiSum = $request->formasi_details ? array_sum($request->formasi_details) : 0;
        $dantonVaforSum = $request->danton_vafor_details ? array_sum($request->danton_vafor_details) : 0;
        $kostumSum = $request->kostum_details ? array_sum($request->kostum_details) : 0;
        $makeupSum = $request->makeup_details ? array_sum($request->makeup_details) : 0;

        $totalScore = $pbbSum + $dantonSum + $variasiSum + $formasiSum + $dantonVaforSum + $kostumSum + $makeupSum;

        JuryScore::updateOrCreate(
            [
                'event_id' => $event->id,
                'round' => 'rekap',
                'contingent_id' => $contingentId,
                'jury_type' => $juryType,
                'jury_number' => $juryNumber,
            ],
            [
                'pbb_score' => $pbbSum,
                'danton_score' => $dantonSum,
                'variasi_score' => $variasiSum,
                'formasi_score' => $formasiSum,
                'danton_vafor_score' => $dantonVaforSum,
                'kostum_score' => $kostumSum,
                'makeup_score' => $makeupSum,
                'penalties_score' => 0,
                'total_score' => $totalScore,
                'pbb_details' => $request->pbb_details,
                'danton_details' => $request->danton_details,
                'variasi_details' => $request->variasi_details,
                'formasi_details' => $request->formasi_details,
                'danton_vafor_details' => $request->danton_vafor_details,
                'kostum_details' => $request->kostum_details,
                'makeup_details' => $request->makeup_details,
            ]
        );

        $this->aggregateScores($event->id, $contingentId);
        Score::recalculateVotingBonuses($event->id);
        Score::checkAndSendScoreNotification($contingentId, $event->id);

        return back()->with('status', 'Nilai juri berhasil disimpan!');
    }

    public function storeFinalRoundScore(Request $request, $slug)
    {
        $request->validate([
            'contingent_id' => 'required|integer',
            'jury_type' => 'nullable|in:pbb,vafor,penalty',
            'jury_number' => 'nullable|integer',
            'pbb_details' => 'nullable|array',
            'danton_details' => 'nullable|array',
            'variasi_details' => 'nullable|array',
            'formasi_details' => 'nullable|array',
            'danton_vafor_details' => 'nullable|array',
            'score_juri_1' => 'nullable|numeric',
            'score_juri_2' => 'nullable|numeric',
            'penalties' => 'nullable|numeric',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $contingentId = $request->contingent_id;

        $record = ScoreFinalRound::firstOrNew([
            'event_id' => $event->id,
            'contingent_id' => $contingentId,
        ]);

        if ($request->jury_type && in_array($request->jury_type, ['pbb', 'vafor'])) {
            // Detailed per-jury format (from frontend)
            $juryType = $request->jury_type;
            $juryNumber = $request->jury_number;

            $pbbSum = $request->pbb_details ? array_sum($request->pbb_details) : 0;
            $dantonSum = $request->danton_details ? array_sum($request->danton_details) : 0;
            $variasiSum = $request->variasi_details ? array_sum($request->variasi_details) : 0;
            $formasiSum = $request->formasi_details ? array_sum($request->formasi_details) : 0;
            $dantonVaforSum = $request->danton_vafor_details ? array_sum($request->danton_vafor_details) : 0;

            JuryScore::updateOrCreate(
                [
                    'event_id' => $event->id,
                    'round' => 'final',
                    'contingent_id' => $contingentId,
                    'jury_type' => $juryType,
                    'jury_number' => $juryNumber,
                ],
                [
                    'pbb_score' => $pbbSum,
                    'danton_score' => $dantonSum,
                    'variasi_score' => $variasiSum,
                    'formasi_score' => $formasiSum,
                    'danton_vafor_score' => $dantonVaforSum,
                    'total_score' => $pbbSum + $dantonSum + $variasiSum + $formasiSum + $dantonVaforSum,
                    'pbb_details' => $request->pbb_details,
                    'danton_details' => $request->danton_details,
                    'variasi_details' => $request->variasi_details,
                    'formasi_details' => $request->formasi_details,
                    'danton_vafor_details' => $request->danton_vafor_details,
                ]
            );

            if ($juryType === 'pbb') {
                $record->{"juri_{$juryNumber}_pbb_details"} = $request->pbb_details;
                $record->{"juri_{$juryNumber}_danton_details"} = $request->danton_details;
            } else {
                $record->{"juri_{$juryNumber}_variasi_details"} = $request->variasi_details;
                $record->{"juri_{$juryNumber}_formasi_details"} = $request->formasi_details;
                $record->{"juri_{$juryNumber}_danton_vafor_details"} = $request->danton_vafor_details;
            }

            $pbbTotal = array_sum($record->juri_1_pbb_details ?? [])
                + array_sum($record->juri_2_pbb_details ?? [])
                + array_sum($record->juri_3_pbb_details ?? []);
            $dantonTotal = array_sum($record->juri_1_danton_details ?? [])
                + array_sum($record->juri_2_danton_details ?? [])
                + array_sum($record->juri_3_danton_details ?? []);
            $vaforTotal = array_sum($record->juri_1_variasi_details ?? [])
                + array_sum($record->juri_1_formasi_details ?? [])
                + array_sum($record->juri_1_danton_vafor_details ?? [])
                + array_sum($record->juri_2_variasi_details ?? [])
                + array_sum($record->juri_2_formasi_details ?? [])
                + array_sum($record->juri_2_danton_vafor_details ?? []);

            $record->pbb_score = $pbbTotal;
            $record->danton_score = $dantonTotal;
            $record->vafor_score = $vaforTotal;
            $record->score_juri_1 = $pbbTotal + $dantonTotal;
            $record->score_juri_2 = $vaforTotal;
            if ($request->penalties !== null) {
                $record->penalties = (float) $request->penalties;
            }
            $record->total_score = ($pbbTotal + $dantonTotal + $vaforTotal) - (float) ($record->penalties ?? 0);
        } else {
            // Simple aggregated format or penalty
            if ($request->score_juri_1 !== null) {
                $record->score_juri_1 = (float) $request->score_juri_1;
            }
            if ($request->score_juri_2 !== null) {
                $record->score_juri_2 = (float) $request->score_juri_2;
            }
            if ($request->penalties !== null) {
                $record->penalties = (float) $request->penalties;
            }

            // Sync component totals from jury details if present to keep in sync
            $pbbTotal = array_sum($record->juri_1_pbb_details ?? [])
                + array_sum($record->juri_2_pbb_details ?? [])
                + array_sum($record->juri_3_pbb_details ?? []);
            $dantonTotal = array_sum($record->juri_1_danton_details ?? [])
                + array_sum($record->juri_2_danton_details ?? [])
                + array_sum($record->juri_3_danton_details ?? []);
            $vaforTotal = array_sum($record->juri_1_variasi_details ?? [])
                + array_sum($record->juri_1_formasi_details ?? [])
                + array_sum($record->juri_1_danton_vafor_details ?? [])
                + array_sum($record->juri_2_variasi_details ?? [])
                + array_sum($record->juri_2_formasi_details ?? [])
                + array_sum($record->juri_2_danton_vafor_details ?? []);

            if ($pbbTotal > 0 || $dantonTotal > 0 || $vaforTotal > 0) {
                $record->pbb_score = $pbbTotal;
                $record->danton_score = $dantonTotal;
                $record->vafor_score = $vaforTotal;
                $record->score_juri_1 = $pbbTotal + $dantonTotal;
                $record->score_juri_2 = $vaforTotal;
            }

            $baseScoreSum = (int) $record->pbb_score + (int) $record->danton_score + (int) $record->vafor_score;
            if ($baseScoreSum == 0) {
                $baseScoreSum = (int) $record->score_juri_1 + (int) $record->score_juri_2;
            }
            $record->total_score = $baseScoreSum - (int) ($record->penalties ?? 0);
        }

        $record->save();
        Score::recalculateVotingBonuses($event->id);

        return back()->with('status', 'Nilai final round berhasil disimpan!');
    }

    public function fillDemoFinalRound(Request $request, $slug)
    {
        $request->validate([
            'category_type' => 'nullable|string',
            'contingent_id' => 'nullable|integer',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();

        $contingents = collect();
        if ($request->contingent_id) {
            $c = Contingent::where('event_id', $event->id)
                ->where('id', $request->contingent_id)
                ->first();
            if ($c) $contingents->push($c);
        } elseif ($request->category_type) {
            $contingents = Contingent::where('event_id', $event->id)
                ->where('category_type', $request->category_type)
                ->get();
        }

        if ($contingents->isEmpty()) {
            return back()->with('error', 'Tidak ada kontingen.');
        }

        $pbbMovements = $this->getChildRubrics($event->id, 'final', 'pbb') ?: $this->defaultPbbMovements();
        $dantonItems = $this->getChildRubrics($event->id, 'final', 'danton') ?: $this->defaultDantonItems();
        $variasiItems = $this->getChildRubrics($event->id, 'final', 'variasi') ?: $this->defaultVariasiItems();
        $formasiItems = $this->getChildRubrics($event->id, 'final', 'formasi') ?: $this->defaultFormasiItems();
        $dantonVaforItems = $this->getChildRubrics($event->id, 'final', 'danton_vafor') ?: $this->defaultDantonVaforItems();

        $fillRandom = function ($items, $min, $max) {
            $res = [];
            foreach ($items as $item) {
                $res[$item] = 10;
            }
            return $res;
        };

        DB::transaction(function () use ($event, $contingents, $pbbMovements, $dantonItems, $variasiItems, $formasiItems, $dantonVaforItems, $fillRandom) {
            $targets = $contingents;

            if ($contingents->count() > 2) {
                $scored = [];
                foreach ($contingents as $c) {
                    $score = Score::where('event_id', $event->id)
                        ->where('contingent_id', $c->id)
                        ->first();
                    if (!$score) continue;
                    $selectionScore = (float) $score->pbb_score + (float) $score->danton_score
                        + (float) $score->vafor_score
                        - (float) $score->penalties_score;
                    $scored[] = [
                        'contingent_id' => $c->id,
                        'selectionScore' => $selectionScore,
                    ];
                }
                usort($scored, fn($a, $b) => $b['selectionScore'] - $a['selectionScore']);
                $targets = collect(array_slice($scored, 0, 2))->pluck('contingent_id');
                $targets = Contingent::whereIn('id', $targets)->get();
            }

            foreach ($targets as $c) {
                $record = ScoreFinalRound::firstOrNew([
                    'event_id' => $event->id,
                    'contingent_id' => $c->id,
                ]);

                for ($i = 1; $i <= 3; $i++) {
                    $record->{"juri_{$i}_pbb_details"} = $fillRandom($pbbMovements, 70, 95);
                    $record->{"juri_{$i}_danton_details"} = $fillRandom($dantonItems, 75, 95);

                    JuryScore::updateOrCreate(
                        [
                            'event_id' => $event->id,
                            'round' => 'final',
                            'contingent_id' => $c->id,
                            'jury_type' => 'pbb',
                            'jury_number' => $i,
                        ],
                        [
                            'pbb_score' => (int) round(array_sum($record->{"juri_{$i}_pbb_details"})),
                            'danton_score' => (int) round(array_sum($record->{"juri_{$i}_danton_details"})),
                            'vafor_score' => 0,
                            'total_score' => (int) round(array_sum($record->{"juri_{$i}_pbb_details"}) + array_sum($record->{"juri_{$i}_danton_details"})),
                            'pbb_details' => $record->{"juri_{$i}_pbb_details"},
                            'danton_details' => $record->{"juri_{$i}_danton_details"},
                        ]
                    );
                }

                for ($i = 1; $i <= 2; $i++) {
                    $record->{"juri_{$i}_variasi_details"} = $fillRandom($variasiItems, 70, 95);
                    $record->{"juri_{$i}_formasi_details"} = $fillRandom($formasiItems, 70, 95);
                    $record->{"juri_{$i}_danton_vafor_details"} = $fillRandom($dantonVaforItems, 75, 95);

                    JuryScore::updateOrCreate(
                        [
                            'event_id' => $event->id,
                            'round' => 'final',
                            'contingent_id' => $c->id,
                            'jury_type' => 'vafor',
                            'jury_number' => $i,
                        ],
                        [
                            'vafor_score' => (int) round(
                                array_sum($record->{"juri_{$i}_variasi_details"})
                                + array_sum($record->{"juri_{$i}_formasi_details"})
                                + array_sum($record->{"juri_{$i}_danton_vafor_details"})
                            ),
                            'total_score' => (int) round(
                                array_sum($record->{"juri_{$i}_variasi_details"})
                                + array_sum($record->{"juri_{$i}_formasi_details"})
                                + array_sum($record->{"juri_{$i}_danton_vafor_details"})
                            ),
                            'variasi_details' => $record->{"juri_{$i}_variasi_details"},
                            'formasi_details' => $record->{"juri_{$i}_formasi_details"},
                            'danton_vafor_details' => $record->{"juri_{$i}_danton_vafor_details"},
                        ]
                    );
                }

                $pbbSum = 0; $dantonSum = 0;
                for ($i = 1; $i <= 3; $i++) {
                    $pbbSum += array_sum($record->{"juri_{$i}_pbb_details"});
                    $dantonSum += array_sum($record->{"juri_{$i}_danton_details"});
                }
                $vaforSum = 0;
                for ($i = 1; $i <= 2; $i++) {
                    $vaforSum += array_sum($record->{"juri_{$i}_variasi_details"})
                        + array_sum($record->{"juri_{$i}_formasi_details"})
                        + array_sum($record->{"juri_{$i}_danton_vafor_details"});
                }

                $record->pbb_score = (int) round($pbbSum);
                $record->danton_score = (int) round($dantonSum);
                $record->vafor_score = (int) round($vaforSum);
                $record->score_juri_1 = (int) round($pbbSum + $dantonSum);
                $record->score_juri_2 = (int) round($vaforSum);
                $record->penalties = $record->penalties ?? 0;
                $record->save();
            }

            Score::recalculateVotingBonuses($event->id);
        });

        $desc = $request->contingent_id ? 'kontingen terpilih' : 'kategori ' . $request->category_type;
        return back()->with('status', "Demo final round untuk {$desc} berhasil diisi!");
    }

    public function updateGlobalPenalty(Request $request, $slug)
    {
        $request->validate([
            'contingent_id' => 'required|integer',
            'penalties' => 'required',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $contingentId = $request->contingent_id;

        $penalties = $request->penalties;
        if (is_array($penalties)) {
            $totalPenalty = collect($penalties)->sum('value');
        } else {
            $totalPenalty = (float) $penalties;
            $penalties = [['value' => $totalPenalty]];
        }

        $score = Score::where('event_id', $event->id)
            ->where('contingent_id', $contingentId)
            ->first();

        if ($score) {
            $kostumNet = (float) $score->kostum_score - (float) ($score->kostum_penalty ?? 0);
            $score->update([
                'penalties_score' => $totalPenalty,
                'penalties' => $penalties,
                'grand_total' => (int) round($score->pbb_score + $score->danton_score + $score->variasi_score + $score->formasi_score + $score->danton_vafor_score + $kostumNet + $score->makeup_score - $totalPenalty),
            ]);
        }

        Score::recalculateVotingBonuses($event->id);

        return back()->with('status', 'Penalti berhasil diperbarui!');
    }

    public function updateKostumPenalty(Request $request, $slug)
    {
        $request->validate([
            'contingent_id' => 'required|integer',
            'kostum_penalty' => 'required|numeric|min:0',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $contingentId = $request->contingent_id;

        $score = Score::where('event_id', $event->id)
            ->where('contingent_id', $contingentId)
            ->first();

        if ($score) {
            $score->update(['kostum_penalty' => $request->kostum_penalty]);
        } else {
            Score::create([
                'event_id' => $event->id,
                'contingent_id' => $contingentId,
                'kostum_penalty' => $request->kostum_penalty,
            ]);
        }

        $this->aggregateScores($event->id, $contingentId);
        Score::recalculateVotingBonuses($event->id);

        return back()->with('status', 'Pengurangan nilai kostum berhasil diperbarui!');
    }

    public function resetFinalRoundScores(Request $request, $slug)
    {
        $request->validate(['category_type' => 'required|string']);

        $event = Event::where('slug', $slug)->firstOrFail();
        $categoryType = $request->category_type;

        $contingents = Contingent::where('event_id', $event->id)
            ->where('category_type', $categoryType)
            ->get();

        if ($contingents->isEmpty()) {
            return back()->with('error', 'Tidak ada kontingen untuk kategori ini.');
        }

        $contingentIds = $contingents->pluck('id');

        DB::transaction(function () use ($event, $contingentIds) {
            JuryScore::where('event_id', $event->id)
                ->where('round', 'final')
                ->whereIn('contingent_id', $contingentIds)
                ->delete();

            ScoreFinalRound::where('event_id', $event->id)
                ->whereIn('contingent_id', $contingentIds)
                ->delete();

            Score::recalculateVotingBonuses($event->id);
        });

        return back()->with('status', "Semua nilai Babak Final untuk kategori {$categoryType} berhasil di-reset!");
    }

    public function resetAllScores(Request $request, $slug)
    {
        $request->validate(['category_type' => 'required|string']);

        $event = Event::where('slug', $slug)->firstOrFail();
        $categoryType = $request->category_type;

        $contingents = Contingent::where('event_id', $event->id)
            ->where('category_type', $categoryType)
            ->get();

        if ($contingents->isEmpty()) {
            return back()->with('error', 'Tidak ada kontingen untuk kategori ini.');
        }

        $contingentIds = $contingents->pluck('id');

        DB::transaction(function () use ($event, $contingentIds) {
            JuryScore::where('event_id', $event->id)
                ->where('round', 'rekap')
                ->whereIn('contingent_id', $contingentIds)
                ->delete();

            Score::where('event_id', $event->id)
                ->whereIn('contingent_id', $contingentIds)
                ->delete();

            Score::recalculateVotingBonuses($event->id);
        });

        return back()->with('status', "Semua nilai untuk kategori {$categoryType} berhasil di-reset!");
    }

    public function resetContingentScores(Request $request, $slug)
    {
        $request->validate(['contingent_id' => 'required|integer']);

        $event = Event::where('slug', $slug)->firstOrFail();
        $contingentId = $request->contingent_id;

        DB::transaction(function () use ($event, $contingentId) {
            JuryScore::where('event_id', $event->id)
                ->where('contingent_id', $contingentId)
                ->delete();

            Score::where('event_id', $event->id)
                ->where('contingent_id', $contingentId)
                ->delete();

            ScoreFinalRound::where('event_id', $event->id)
                ->where('contingent_id', $contingentId)
                ->delete();

            Score::recalculateVotingBonuses($event->id);
        });

        return back()->with('status', 'Nilai kontingen berhasil di-reset!');
    }

    public function showRekap($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $contingents = Contingent::where('event_id', $event->id)
            ->withCount('voteLogs')
            ->get()
            ->map(function ($c) {
                $supporterDays = \App\Models\IssuedTicket::where('supporter_contingent_id', $c->id)->count();
                $merchQty = \Illuminate\Support\Facades\DB::table('merchandise_sales')
                    ->where('contingent_id', $c->id)
                    ->sum('qty') ?: 0;
                $score = $c->scores()->first();

                return [
                    'id' => $c->id,
                    'school_name' => $c->school_name,
                    'region' => $c->region,
                    'category_type' => $c->category_type,
                    'logo_path' => $c->logo_path,
                    'votes_count' => $c->vote_logs_count,
                    'supporter_days' => (int) $supporterDays,
                    'merch_qty' => (int) $merchQty,
                    'reels_likes' => $c->socialMediaLike->likes_count_reels ?? 0,
                    'posts_likes' => $c->socialMediaLike->likes_count_posts ?? 0,
                    'is_reguler' => (bool) $c->is_reguler,
                    'coach_name' => $c->coach_name,
                    'score' => $score ? [
                        'pbb_score' => (float) $score->pbb_score,
                        'danton_score' => (float) $score->danton_score,
                        'variasi_score' => (float) ($score->variasi_score ?? 0),
                        'formasi_score' => (float) ($score->formasi_score ?? 0),
                        'danton_vafor_score' => (float) ($score->danton_vafor_score ?? 0),
                        'kostum_score' => (float) $score->kostum_score,
                        'kostum_penalty' => (float) ($score->kostum_penalty ?? 0),
                        'makeup_score' => (float) $score->makeup_score,
                        'penalties_score' => (float) $score->penalties_score,
                        'nilai_kontingen_bonus' => (float) $score->nilai_kontingen_bonus,
                        'grand_total' => (float) $score->grand_total,
                    ] : null,
                ];
            });

        $scores = Score::where('event_id', $event->id)
            ->with('contingent')
            ->get();

        $juryScores = \App\Models\JuryScore::where('event_id', $event->id)->get();

        return Inertia::render('Admin/ScoreRekap', [
            'event' => $event,
            'contingents' => $contingents,
            'scores' => $scores,
            'juryScores' => $juryScores,
            'pbbItems' => $this->getChildRubrics($event->id, 'rekap', 'pbb'),
            'pbbU12Items' => $this->getChildRubrics($event->id, 'rekap', 'pbb_u12'),
            'dantonItems' => $this->getChildRubrics($event->id, 'rekap', 'danton'),
            'variasiItems' => $this->getChildRubrics($event->id, 'rekap', 'variasi'),
            'formasiItems' => $this->getChildRubrics($event->id, 'rekap', 'formasi'),
            'dantonVaforItems' => $this->getChildRubrics($event->id, 'rekap', 'danton_vafor'),
            'kostumItems' => $this->getChildRubrics($event->id, 'rekap', 'kostum'),
            'makeupItems' => $this->getChildRubrics($event->id, 'rekap', 'makeup'),
            'juryMembers' => $this->getJuryMembersGrouped($event->id, 'rekap'),
        ]);
    }

    public function showFinal($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $contingents = Contingent::where('event_id', $event->id)
            ->withCount('voteLogs')
            ->get()
            ->map(function ($c) {
                $supporterDays = \App\Models\IssuedTicket::where('supporter_contingent_id', $c->id)->count();
                $merchQty = \Illuminate\Support\Facades\DB::table('merchandise_sales')
                    ->where('contingent_id', $c->id)
                    ->sum('qty') ?: 0;
                $score = $c->scores()->first();

                return [
                    'id' => $c->id,
                    'school_name' => $c->school_name,
                    'region' => $c->region,
                    'category_type' => $c->category_type,
                    'logo_path' => $c->logo_path,
                    'votes_count' => $c->vote_logs_count,
                    'supporter_days' => (int) $supporterDays,
                    'merch_qty' => (int) $merchQty,
                    'reels_likes' => $c->socialMediaLike->likes_count_reels ?? 0,
                    'posts_likes' => $c->socialMediaLike->likes_count_posts ?? 0,
                    'is_reguler' => (bool) $c->is_reguler,
                    'coach_name' => $c->coach_name,
                    'score' => $score ? [
                        'pbb_score' => (float) $score->pbb_score,
                        'danton_score' => (float) $score->danton_score,
                        'vafor_score' => (float) ($score->vafor_score ?? 0),
                        'variasi_score' => (float) ($score->variasi_score ?? 0),
                        'formasi_score' => (float) ($score->formasi_score ?? 0),
                        'danton_vafor_score' => (float) ($score->danton_vafor_score ?? 0),
                        'kostum_score' => (float) $score->kostum_score,
                        'kostum_penalty' => (float) ($score->kostum_penalty ?? 0),
                        'makeup_score' => (float) $score->makeup_score,
                        'penalties_score' => (float) $score->penalties_score,
                        'nilai_kontingen_bonus' => (float) $score->nilai_kontingen_bonus,
                        'grand_total' => (float) $score->grand_total,
                    ] : null,
                ];
            });

        $scores = Score::where('event_id', $event->id)
            ->with('contingent')
            ->get();

        $finalRoundScores = $this->getFinalRoundScores($event->id);

        return Inertia::render('Admin/ScoreFinal', [
            'event' => $event,
            'contingents' => $contingents,
            'scores' => $scores,
            'finalRoundScores' => $finalRoundScores,
            'pbbItems' => $this->getChildRubrics($event->id, 'final', 'pbb'),
            'pbbU12Items' => $this->getChildRubrics($event->id, 'final', 'pbb_u12'),
            'dantonItems' => $this->getChildRubrics($event->id, 'final', 'danton'),
            'variasiItems' => $this->getChildRubrics($event->id, 'final', 'variasi'),
            'formasiItems' => $this->getChildRubrics($event->id, 'final', 'formasi'),
            'dantonVaforItems' => $this->getChildRubrics($event->id, 'final', 'danton_vafor'),
            'kostumItems' => $this->getChildRubrics($event->id, 'final', 'kostum'),
            'makeupItems' => $this->getChildRubrics($event->id, 'final', 'makeup'),
            'juryMembers' => $this->getJuryMembersGrouped($event->id, 'final'),
        ]);
    }

    public function showDaftarNilai($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $scores = Score::where('event_id', $event->id)
            ->with('contingent')
            ->get();

        $finalRoundScores = $this->getFinalRoundScores($event->id);

        return Inertia::render('Admin/ScoreDaftarNilai', [
            'event' => $event,
            'scores' => $scores,
            'finalRoundScores' => $finalRoundScores,
        ]);
    }

    public function showDaftarJuara($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $voteLastTimes = \App\Models\VoteLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, MAX(created_at) as last_at')
            ->groupBy('contingent_id')
            ->pluck('last_at', 'contingent_id');

        $merchLastTimes = \Illuminate\Support\Facades\DB::table('merchandise_sales')
            ->whereIn('contingent_id', function ($q) use ($event) {
                $q->select('id')->from('contingents')->where('event_id', $event->id);
            })
            ->selectRaw('contingent_id, MAX(created_at) as last_at')
            ->groupBy('contingent_id')
            ->pluck('last_at', 'contingent_id');

        $supporterLastTimes = \App\Models\IssuedTicket::whereNotNull('supporter_contingent_id')
            ->whereIn('supporter_contingent_id', function ($q) use ($event) {
                $q->select('id')->from('contingents')->where('event_id', $event->id);
            })
            ->selectRaw('supporter_contingent_id as contingent_id, MAX(created_at) as last_at')
            ->groupBy('supporter_contingent_id')
            ->pluck('last_at', 'contingent_id');

        $contingents = Contingent::where('event_id', $event->id)
            ->withCount('voteLogs')
            ->with('socialMediaLike')
            ->get()
            ->map(function ($c) use ($voteLastTimes, $merchLastTimes, $supporterLastTimes) {
                $score = $c->scores()->first();
                return [
                    'id' => $c->id,
                    'school_name' => $c->school_name,
                    'region' => $c->region,
                    'category_type' => $c->category_type,
                    'votes_count' => $c->vote_logs_count,
                    'vote_last_at' => $voteLastTimes->get($c->id),
                    'merch_last_at' => $merchLastTimes->get($c->id),
                    'supporter_last_at' => $supporterLastTimes->get($c->id),
                    'is_reguler' => (bool) $c->is_reguler,
                    'coach_name' => $c->coach_name,
                    'reels_likes' => $c->socialMediaLike?->likes_count_reels ?? 0,
                    'posts_likes' => $c->socialMediaLike?->likes_count_posts ?? 0,
                    'score' => $score ? [
                        'pbb_score' => (float) $score->pbb_score,
                        'danton_score' => (float) $score->danton_score,
                        'variasi_score' => (float) ($score->variasi_score ?? 0),
                        'formasi_score' => (float) ($score->formasi_score ?? 0),
                        'danton_vafor_score' => (float) ($score->danton_vafor_score ?? 0),
                        'kostum_score' => (float) $score->kostum_score,
                        'kostum_penalty' => (float) ($score->kostum_penalty ?? 0),
                        'makeup_score' => (float) $score->makeup_score,
                        'penalties_score' => (float) $score->penalties_score,
                        'nilai_kontingen_bonus' => (float) $score->nilai_kontingen_bonus,
                        'grand_total' => (float) $score->grand_total,
                    ] : null,
                ];
            });

        $scores = Score::where('event_id', $event->id)
            ->with('contingent')
            ->get();

        $finalRoundScores = $this->getFinalRoundScores($event->id);

        return Inertia::render('Admin/ScoreDaftarJuara', [
            'event' => $event,
            'contingents' => $contingents,
            'scores' => $scores,
            'finalRoundScores' => $finalRoundScores,
        ]);
    }

    public function showContingentPrivatePortal($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $user = auth()->user();

        // Coach role: find contingent by coach_email or coach_name
        $contingent = Contingent::where('event_id', $event->id)
            ->where(function ($query) use ($user) {
                $query->where('coach_email', $user->email)
                      ->orWhere('coach_name', $user->name);
            })
            ->first();

        // Fallback for admin / super_admin only for testing convenience
        if (!$contingent && in_array($user->role, ['super_admin', 'admin'])) {
            $contingent = Contingent::where('event_id', $event->id)->first();
        }

        $score = null;
        $pbbDetails = [];
        $pbbJuryScores = [];
        $juryScoresForFrontend = [];

        if ($contingent) {
            $score = Score::where('event_id', $event->id)
                ->where('contingent_id', $contingent->id)
                ->first();

            if ($score) {
                $pbbDetails = ScorePbbDetail::where('score_id', $score->id)->get();
            }

            // Jury scores (rekap) untuk audit pelatih (harus selalu di-load selama contingent ada)
            $juryScores = \App\Models\JuryScore::where('event_id', $event->id)
                ->where('contingent_id', $contingent->id)
                ->where('round', 'rekap')
                ->orderBy('jury_type')
                ->orderBy('jury_number')
                ->get();

            // Backward compatibility: tetap kirim pbbJuryScores untuk tabel audit PBB
            $pbbJuryScores = $juryScores
                ->where('jury_type', 'pbb')
                ->map(function ($js) {
                    return [
                        'jury_number' => (int) $js->jury_number,
                        'pbb_details' => $js->pbb_details,
                    ];
                })
                ->values();

            $juryScoresGrouped = $juryScores
                ->groupBy('jury_type')
                ->map(function ($typeScores) {
                    return $typeScores->keyBy('jury_number')->map(function ($js) {
                        return [
                            'jury_number' => (int) $js->jury_number,
                            'pbb_details' => $js->pbb_details,
                            'danton_details' => $js->danton_details,
                            'variasi_details' => $js->variasi_details,
                            'formasi_details' => $js->formasi_details,
                            'danton_vafor_details' => $js->danton_vafor_details,
                            'kostum_details' => $js->kostum_details,
                            'makeup_details' => $js->makeup_details,
                            'total_score' => (float) $js->total_score,
                        ];
                    });
                });

            $juryScoresForFrontend = $juryScoresGrouped->toArray();
        }

        // Load PBB movements from DB (with fallback) — dynamic for U12
        $pbbRubricCode = $contingent && $contingent->category_type === 'U12' ? 'pbb_u12' : 'pbb';
        $pbbMovements = $this->getChildRubrics($event->id, 'rekap', $pbbRubricCode);

        // Fetch all contingents for listing when not linked
        $allContingents = [];
        if (!$contingent) {
            $allContingents = Contingent::where('event_id', $event->id)
                ->orderBy('school_name', 'asc')
                ->get()
                ->map(function ($con) {
                    $con->coach_email = $con->coach_email ?: (\App\Models\User::where('name', $con->coach_name)->value('email') ?: null);
                    return $con;
                });
        }

        return Inertia::render('Event/MyScore', [
            'event' => $event,
            'contingent' => $contingent,
            'score' => $score,
            'pbbDetails' => $pbbDetails,
            'pbbMovements' => $pbbMovements,
            'pbbJuryScores' => $pbbJuryScores,
            'juryScores' => $juryScoresForFrontend ?? [],
            'allContingents' => $allContingents,
        ]);
    }

    // ========== DEFAULT FALLBACK ARRAYS (backward compatibility) ==========

    private function aggregateScores($eventId, $contingentId): void
    {
        $allJuriesScores = JuryScore::where('event_id', $eventId)
            ->where('round', 'rekap')
            ->where('contingent_id', $contingentId)
            ->get();

        $aggPbb = 0; $aggDanton = 0; $aggVariasi = 0; $aggFormasi = 0; $aggDantonVafor = 0; $aggKostum = 0; $aggMakeup = 0;

        foreach ($allJuriesScores as $js) {
            if ($js->jury_type === 'pbb') {
                $aggPbb += $js->pbb_score;
                $aggDanton += $js->danton_score;
            } elseif ($js->jury_type === 'vafor') {
                $aggVariasi += $js->variasi_score;
                $aggFormasi += $js->formasi_score;
                $aggDantonVafor += $js->danton_vafor_score;
            } elseif ($js->jury_type === 'makeup_kostum') {
                $aggKostum += $js->kostum_score;
                $aggMakeup += $js->makeup_score;
            }
        }

        $scoreRecord = Score::where('event_id', $eventId)
            ->where('contingent_id', $contingentId)
            ->first();

        $existingPenalties = $scoreRecord ? (float) $scoreRecord->penalties_score : 0.00;
        $existingPenaltiesJson = $scoreRecord ? $scoreRecord->penalties : null;
        $existingKostumPenalty = $scoreRecord ? (float) $scoreRecord->kostum_penalty : 0.00;

        $pbbScore = (float) $aggPbb;
        $dantonScore = (float) $aggDanton;
        $variasiScore = (float) $aggVariasi;
        $formasiScore = (float) $aggFormasi;
        $dantonVaforScore = (float) $aggDantonVafor;
        $kostumScore = (float) $aggKostum;
        $makeupScore = (float) $aggMakeup;

        $grandTotal = round($pbbScore + $dantonScore + $variasiScore + $formasiScore + $dantonVaforScore + $kostumScore + $makeupScore - (float) $existingPenalties - $existingKostumPenalty);

        Score::updateOrCreate(
            ['event_id' => $eventId, 'contingent_id' => $contingentId],
            [
                'pbb_score' => $pbbScore,
                'danton_score' => $dantonScore,
                'vafor_score' => $variasiScore + $formasiScore + $dantonVaforScore,
                'variasi_score' => $variasiScore,
                'formasi_score' => $formasiScore,
                'danton_vafor_score' => $dantonVaforScore,
                'kostum_score' => $kostumScore,
                'kostum_penalty' => $existingKostumPenalty,
                'makeup_score' => $makeupScore,
                'penalties_score' => (float) $existingPenalties,
                'penalties' => $existingPenaltiesJson,
                'grand_total' => $grandTotal,
            ]
        );
    }

    private function defaultPbbMovements(): array
    {
        return [
            'Berhimpun', 'Berkumpul (Bersaf)', 'Istirahat (Di Tempat)', 'Sikap Sempurna', 'Setengah Lengan Lencang Kiri',
            'Hormat', 'Lencang Kiri', 'Hitung', 'Parade Periksa Kerapian', '3 Langkah Ke Belakang',
            'Hadap Kiri Jalan (Di Tempat)', 'Balik Kanan (Henti)', '3 Langkah Ke Depan', '4 Langkah Ke Kanan', 'Lencang Depan',
            'Hadap Kiri', 'Langkah Perlahan Maju', 'Hadap Kiri Maju (Langkah Biasa)', 'Ganti Langkah', 'Melintang Kiri',
            'Balik Kanan (Maju)', 'Hormat Kanan', 'Ganti Langkah', 'Langkah Tegap Ke Langkah Biasa', 'Hadap Kanan Maju',
            'Belok Kanan', 'Lari', '2 Kali Belok Kanan', 'Hadap Kiri Maju', 'Henti', 'Bubar'
        ];
    }

    private function defaultPbbMovementsU12(): array
    {
        return [
            'Berkumpul (Bersaf)', 'Sikap Sempurna', 'Setengah Lengan Lencang Kiri', 'Hormat', 'Lencang Kiri',
            'Hitung', 'Parade Periksa Kerapian', 'Hadap Kiri (Jalan Di Tempat)', 'Balik Kanan Henti', '3 Langkah Ke Belakang',
            '3 Langkah Ke Depan', '3 Langkah Ke Kanan', 'Lencang Depan', 'Langkah Biasa', 'Ganti Langkah',
            'Belok Kanan', 'Hadap Kanan Maju', 'Haluan Kanan Maju', 'Hadap Kiri Maju', '2 Kali Belok Kiri',
            'Hadap Kiri Henti', 'Langkah Perlahan', 'Bubar'
        ];
    }

    private function defaultDantonItems(): array
    {
        return [
            'Sikap', 'Volume', 'Artikulasi', 'Intonasi, Ritme, Tempo',
            'Penguasaan Materi', 'Penguasaan Lapangan', 'Penguasaan Pasukan',
        ];
    }

    private function defaultVariasiItems(): array
    {
        return [
            'Opening & Ending Variasi', 'Pembawaan Tema & Konsep',
            'Kesesuaian Gerakan Dengan Tema & Konsep', 'Kesopanan & Keamanan Gerakan',
            'Tingkat Kesulitan & Detail Gerakan', 'Kerapihan & Kekompakan', 'Unsur PBB',
            'Penjiwaan, Ekspresi, Pengucapan Kalimat', 'Semangat & Kestabilan Penampilan',
            'Penguasaan Ruang & Materi',
        ];
    }

    private function defaultFormasiItems(): array
    {
        return [
            'Kombinasi & Pemilihan Gerakan', 'Pembawaan Tema & Konsep',
            'Ending Celebration (Setelah Tutup Formasi)', 'Kesesuaian Gerakan Dengan Tema & Konsep',
            'Kesopanan & Keamanan Gerakan', 'Tingkat Kesulitan & Detail Gerakan', 'Unsur PBB',
            'Penjiwaan, Ekspresi, Pengucapan Kalimat', 'Semangat & Kestabilan Penampilan',
            'Penguasaan Ruang & Materi',
        ];
    }

    private function defaultDantonVaforItems(): array
    {
        return [
            'Cara Pembawaan',
            'Kombinasi/Kolaborasi Dengan Pasukan',
            'Penguasaan Materi Variasi & Formasi',
        ];
    }

    private function defaultKostumItems(): array
    {
        return [
            'Kesesuaian Gender/Konsep', 'Keselarasan Penutup Kepala & Sepatu Dengan Kostum',
            'Body Fitting/Ukuran Baju dan Kenyamanan', 'Cuttingan', 'Desain Kostum',
            'Kesesuaian Kostum Dengan Konsep Vafor', 'Kharisma Pembawaan Kostum',
            'Kebersihan & Kerapihan', 'Kreativitas Bentuk & Perpaduan Warna Dengan Kostum',
            'Kesesuaian Atribut & Penempatan Dengan Desain Kostum'
        ];
    }

    private function defaultMakeupItems(): array
    {
        return [
            'Kesesuaian Make Up Dengan Desain Kostum', 'Kesesuaian Make Up Dengan Konsep Vafor',
            'Kesesuaian Make Up Dengan Gender', 'Kharisma Pembawaan Make Up', 'Kreativitas',
            'Ketahanan', 'Kenyamanan', 'Kerapihan', 'Kebersihan',
        ];
    }

    private function defaultJuryMembers(): array
    {
        return [
            'pbb' => [
                ['id' => 1, 'name' => 'Haryoto'],
                ['id' => 2, 'name' => 'Muhammad Dhon'],
                ['id' => 3, 'name' => 'Andri Saputra'],
            ],
            'vafor' => [
                ['id' => 1, 'name' => 'Bahari Pradana'],
                ['id' => 2, 'name' => 'Nurrijal Maulia'],
            ],
            'makeup_kostum' => [
                ['id' => 1, 'name' => 'Mutiara Kinanti Alfida'],
                ['id' => 2, 'name' => 'Shafira Yunita Putri'],
            ],
        ];
    }

    private function getChildRubrics($eventId, $round, $code)
    {
        $parent = ScoringRubric::where('event_id', $eventId)
            ->where('round', $round)
            ->whereNull('parent_id')
            ->where('code', $code)
            ->first();
            
        if (!$parent) {
            $fallbackMethod = 'default' . ucfirst(implode('', array_map('ucfirst', explode('_', $code)))) . 'Items';
            if ($code === 'pbb') {
                $fallbackMethod = 'defaultPbbMovements';
            }
            if (method_exists($this, $fallbackMethod)) {
                $items = $this->$fallbackMethod();
            } else {
                $items = [];
            }
        } else {
            $items = ScoringRubric::where('parent_id', $parent->id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->pluck('name')
                ->toArray();
        }

        $prefixMap = [
            'pbb' => 'pbb',
            'pbb_u12' => 'pbb_u12',
            'danton' => 'dn',
            'danton_vafor' => 'dv',
            'variasi' => 'vr',
            'formasi' => 'fm',
            'kostum' => 'ks',
            'makeup' => 'mk',
        ];

        $prefix = $prefixMap[$code] ?? $code;
        $result = [];
        foreach ($items as $idx => $name) {
            $key = $prefix . '_' . str_pad($idx + 1, 2, '0', STR_PAD_LEFT);
            $result[$key] = $name;
        }
        return $result;
    }

    private function getJuryMembersGrouped($eventId, $round)
    {
        $members = JuryMember::where('event_id', $eventId)
            ->where('round', $round)
            ->where('is_active', true)
            ->orderBy('jury_number')
            ->get();

        if ($members->isEmpty()) {
            return $this->defaultJuryMembers();
        }

        return $members->groupBy('jury_type')->map(function ($items) {
            return $items->map(function ($m) {
                return [
                    'id' => $m->jury_number,
                    'name' => $m->name,
                ];
            })->values()->toArray();
        })->toArray();
    }

    private function getFinalRoundScores($eventId)
    {
        return ScoreFinalRound::where('event_id', $eventId)
            ->with('contingent')
            ->get()
            ->map(function ($fs) use ($eventId) {
                $jScores = \App\Models\JuryScore::where('event_id', $eventId)
                    ->where('contingent_id', $fs->contingent_id)
                    ->where('round', 'final')
                    ->get();
                foreach ($jScores as $js) {
                    $i = $js->jury_number;
                    if ($js->jury_type === 'pbb') {
                        $fs->{"juri_{$i}_pbb_details"} = $js->pbb_details;
                        $fs->{"juri_{$i}_danton_details"} = $js->danton_details;
                    } elseif ($js->jury_type === 'vafor') {
                        $fs->{"juri_{$i}_variasi_details"} = $js->variasi_details;
                        $fs->{"juri_{$i}_formasi_details"} = $js->formasi_details;
                        $fs->{"juri_{$i}_danton_vafor_details"} = $js->danton_vafor_details;
                    }
                }
                return $fs;
            });
    }

    public function exportRekapExcel($slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        $contingents = \App\Models\Contingent::where('event_id', $event->id)->get();
        $scores = \App\Models\Score::where('event_id', $event->id)->get()->keyBy('contingent_id');
        
        $writer = new \OpenSpout\Writer\XLSX\Writer();
        $writer->openToBrowser("rekap_nilai_{$event->slug}.xlsx");

        $headerStyle = new \OpenSpout\Common\Entity\Style\Style(
            fontBold: true,
            fontColor: \OpenSpout\Common\Entity\Style\Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: \OpenSpout\Common\Entity\Style\CellAlignment::CENTER,
        );

        $categories = ['U12', 'U16', 'U19', 'Purna'];
        $catLabels = ['U12' => 'SD', 'U16' => 'SMP', 'U19' => 'SMA', 'Purna' => 'Purna'];

        foreach ($categories as $idx => $cat) {
            $sheet = $idx === 0 ? $writer->getCurrentSheet() : $writer->addNewSheetAndMakeItCurrent();
            $sheet->setName($catLabels[$cat]);

            $sheet->setColumnWidthForRange(10, 1, 1);
            $sheet->setColumnWidthForRange(30, 2, 2);
            $sheet->setColumnWidthForRange(10, 3, 12);
            
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle([
                'No', 'Kontingen', 'Kategori',
                'PBB', 'Danton', 'Vafor',
                'Kostum', 'Peng.Kos', 'Makeup', 'Peng.Mak',
                'Penalti', 'Grand Total',
            ], $headerStyle));

            $catContingents = $contingents->where('category_type', $cat)->values()->sortByDesc(function ($c) use ($scores) {
                return (int) ($scores->get($c->id)?->grand_total ?? 0);
            })->values();
            foreach ($catContingents as $i => $c) {
                $s = $scores->get($c->id);
                if (!$s) continue;
                $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                    $i + 1,
                    $c->school_name,
                    $c->category_type,
                    (int) $s->pbb_score,
                    (int) $s->danton_score,
                    (int) $s->vafor_score,
                    (int) $s->kostum_score,
                    (int) $s->kostum_penalty,
                    (int) $s->makeup_score,
                    (int) $s->makeup_penalty,
                    (int) $s->penalties_score,
                    (int) $s->grand_total,
                ]));
            }
        }
        $writer->close();
    }

    public function exportContingentDetail($slug, $id)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        $contingent = \App\Models\Contingent::where('event_id', $event->id)->findOrFail($id);
        
        $writer = new \OpenSpout\Writer\XLSX\Writer();
        $writer->openToBrowser("detail_nilai_{$event->slug}_{$contingent->id}.xlsx");

        $headerStyle = new \OpenSpout\Common\Entity\Style\Style(
            fontBold: true,
            fontColor: \OpenSpout\Common\Entity\Style\Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: \OpenSpout\Common\Entity\Style\CellAlignment::CENTER,
        );

        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Detail Nilai');
        $sheet->setColumnWidthForRange(30, 1, 2);

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['Detail Nilai Kontingen'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Kontingen', $contingent->school_name]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Kategori', $contingent->category_type]));
        
        $score = \App\Models\Score::where('event_id', $event->id)->where('contingent_id', $contingent->id)->first();
        if ($score) {
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['PBB', (int) $score->pbb_score]));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Danton', (int) $score->danton_score]));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Vafor', (int) $score->vafor_score]));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Kostum', (int) $score->kostum_score]));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Pengurangan Kostum', (int) $score->kostum_penalty]));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Makeup', (int) $score->makeup_score]));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Pengurangan Makeup', (int) $score->makeup_penalty]));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Penalti Tambahan', (int) $score->penalties_score]));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Grand Total', (int) $score->grand_total]));
        }

        $writer->close();
    }

    public function exportContingentDetailPdf($slug, $id)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $contingent = Contingent::where('event_id', $event->id)->findOrFail($id);

        $score = Score::where('event_id', $event->id)->where('contingent_id', $contingent->id)->first();

        $juryScoresList = JuryScore::where('event_id', $event->id)
            ->where('contingent_id', $contingent->id)
            ->where('round', 'rekap')
            ->orderBy('jury_type')
            ->orderBy('jury_number')
            ->get();

        $juryScores = $juryScoresList
            ->groupBy('jury_type')
            ->map(function ($typeScores) {
                return $typeScores->keyBy('jury_number')->map(function ($js) {
                    return [
                        'jury_number' => (int) $js->jury_number,
                        'pbb_details' => $js->pbb_details,
                        'danton_details' => $js->danton_details,
                        'variasi_details' => $js->variasi_details,
                        'formasi_details' => $js->formasi_details,
                        'danton_vafor_details' => $js->danton_vafor_details,
                        'kostum_details' => $js->kostum_details,
                        'makeup_details' => $js->makeup_details,
                    ];
                });
            })->toArray();

        $controller = new \App\Http\Controllers\ScoreTokenController;
        $pbbCode = $contingent->category_type === 'U12' ? 'pbb_u12' : 'pbb';
        $pbbItems = $controller->getChildRubrics($event->id, 'rekap', $pbbCode);
        $dantonItems = $controller->getChildRubrics($event->id, 'rekap', 'danton');
        $variasiItems = $controller->getChildRubrics($event->id, 'rekap', 'variasi');
        $formasiItems = $controller->getChildRubrics($event->id, 'rekap', 'formasi');
        $dantonVaforItems = $controller->getChildRubrics($event->id, 'rekap', 'danton_vafor');
        $kostumItems = $controller->getChildRubrics($event->id, 'rekap', 'kostum');
        $makeupItems = $controller->getChildRubrics($event->id, 'rekap', 'makeup');

        $pdf = Pdf::loadView('pdf.rekap-nilai', [
            'event' => ['slug' => $event->slug, 'name' => $event->name],
            'contingent' => [
                'school_name' => $contingent->school_name,
                'category_type' => $contingent->category_type,
                'region' => $contingent->region,
                'is_reguler' => (bool) $contingent->is_reguler,
                'coach_name' => $contingent->coach_name,
            ],
            'score' => $score ? [
                'pbb_score' => (float) $score->pbb_score,
                'danton_score' => (float) $score->danton_score,
                'vafor_score' => (float) ($score->vafor_score ?? 0),
                'kostum_score' => (float) $score->kostum_score,
                'kostum_penalty' => (float) ($score->kostum_penalty ?? 0),
                'makeup_score' => (float) $score->makeup_score,
                'penalties_score' => (float) $score->penalties_score,
                'grand_total' => (float) $score->grand_total,
            ] : null,
            'juryScores' => $juryScores,
            'pbbItems' => $pbbItems,
            'dantonItems' => $dantonItems,
            'variasiItems' => $variasiItems,
            'formasiItems' => $formasiItems,
            'dantonVaforItems' => $dantonVaforItems,
            'kostumItems' => $kostumItems,
            'makeupItems' => $makeupItems,
        ]);

        return $pdf->download("rekap_nilai_{$event->slug}_{$contingent->id}.pdf");
    }

    public function exportFinalExcel($slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        $contingents = \App\Models\Contingent::where('event_id', $event->id)->get();
        $scores = \App\Models\ScoreFinalRound::where('event_id', $event->id)->get()->keyBy('contingent_id');
        
        $writer = new \OpenSpout\Writer\XLSX\Writer();
        $writer->openToBrowser("final_round_{$event->slug}.xlsx");

        $headerStyle = new \OpenSpout\Common\Entity\Style\Style(
            fontBold: true,
            fontColor: \OpenSpout\Common\Entity\Style\Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: \OpenSpout\Common\Entity\Style\CellAlignment::CENTER,
        );

        $categories = ['U16', 'U19'];
        $catLabels = ['U16' => 'SMP', 'U19' => 'SMA'];

        foreach ($categories as $idx => $cat) {
            $sheet = $idx === 0 ? $writer->getCurrentSheet() : $writer->addNewSheetAndMakeItCurrent();
            $sheet->setName($catLabels[$cat]);

            $sheet->setColumnWidthForRange(10, 1, 1);
            $sheet->setColumnWidthForRange(30, 2, 2);
            $sheet->setColumnWidthForRange(10, 3, 10);
            
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle([
                'No', 'Kontingen', 'Kategori',
                'Juri 1', 'Juri 2', 'Juri 3',
                'Penalti', 'Voting Bonus', 'Total Score'
            ], $headerStyle));

            $catContingents = $contingents->where('category_type', $cat)->values();
            foreach ($catContingents as $i => $c) {
                $s = $scores->get($c->id);
                if (!$s) continue;
                $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                    $i + 1,
                    $c->school_name,
                    $c->category_type,
                    (int) $s->juri_1_total,
                    (int) $s->juri_2_total,
                    (int) $s->juri_3_total,
                    (int) $s->penalties,
                    (int) $s->voting_bonus,
                    (int) $s->total_score,
                ]));
            }
        }
        $writer->close();
    }

    public function exportDaftarJuaraExcel($slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        
        $writer = new \OpenSpout\Writer\XLSX\Writer();
        $writer->openToBrowser("daftar_juara_{$event->slug}.xlsx");

        $headerStyle = new \OpenSpout\Common\Entity\Style\Style(
            fontBold: true,
            fontColor: \OpenSpout\Common\Entity\Style\Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: \OpenSpout\Common\Entity\Style\CellAlignment::CENTER,
        );

        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Daftar Juara');
        $sheet->setColumnWidthForRange(20, 1, 1);
        $sheet->setColumnWidthForRange(35, 2, 2);
        $sheet->setColumnWidthForRange(15, 3, 4);

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['Predikat', 'Kontingen', 'Nilai', 'Kategori'], $headerStyle));
        
        $scores = \App\Models\Score::where('event_id', $event->id)
            ->join('contingents', 'scores.contingent_id', '=', 'contingents.id')
            ->orderByDesc('scores.grand_total')
            ->select('scores.*', 'contingents.school_name', 'contingents.category_type')
            ->get();

        foreach ($scores as $i => $s) {
            $predikat = "Peringkat " . ($i + 1);
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                $predikat,
                $s->school_name,
                (int) $s->grand_total,
                $s->category_type,
            ]));
        }

        $writer->close();
    }

    public function resetLiveData($slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();

        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Clear scores & details
        \Illuminate\Support\Facades\DB::table('jury_scores')->where('event_id', $event->id)->delete();
        \Illuminate\Support\Facades\DB::table('scores')->where('event_id', $event->id)->delete();
        \Illuminate\Support\Facades\DB::table('scores_final_round')->where('event_id', $event->id)->delete();
        if (\Illuminate\Support\Facades\Schema::hasTable('score_pbb_details')) {
            \Illuminate\Support\Facades\DB::table('score_pbb_details')->truncate();
        }

        // Clear tickets, orders, votes, supporter logs
        \Illuminate\Support\Facades\DB::table('vote_logs')->where('event_id', $event->id)->delete();
        \Illuminate\Support\Facades\DB::table('supporter_logs')->where('event_id', $event->id)->delete();
        
        $orderIds = \Illuminate\Support\Facades\DB::table('orders')->where('event_id', $event->id)->pluck('id');
        \Illuminate\Support\Facades\DB::table('issued_tickets')->whereIn('order_id', $orderIds)->delete();
        \Illuminate\Support\Facades\DB::table('orders')->where('event_id', $event->id)->delete();

        // Clear merchandise logs
        \Illuminate\Support\Facades\DB::table('merchandise_sales')->where('event_id', $event->id)->delete();
        \Illuminate\Support\Facades\DB::table('merchandise_purchases')->where('event_id', $event->id)->delete();
        if (\Illuminate\Support\Facades\Schema::hasTable('merchandise_orders')) {
            \Illuminate\Support\Facades\DB::table('merchandise_orders')->where('event_id', $event->id)->delete();
        }

        // Clear visitor counts & activity logs
        if (\Illuminate\Support\Facades\Schema::hasTable('visitor_counts')) {
            \Illuminate\Support\Facades\DB::table('visitor_counts')->truncate();
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('activity_logs')) {
            \Illuminate\Support\Facades\DB::table('activity_logs')->truncate();
        }
        
        // Delete testimonials & demo voters
        \Illuminate\Support\Facades\DB::table('testimonials')->delete();
        \App\Models\User::where('email', 'like', 'demo_voter_%')->delete();

        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Clear caches
        \Illuminate\Support\Facades\Cache::flush();

        return back()->with('status', 'Seluruh data transaksi, voting, supporter, dan nilai berhasil di-reset ke 0! Data kontingen, juri, rubrik, qris, dan kontak tetap dipertahankan.');
    }

    public function backupDatabase($slug)
    {
        $dbName = config('database.connections.mysql.database');
        $tables = [];
        $result = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
        foreach ($result as $row) {
            $tables[] = array_values((array)$row)[0];
        }

        $sql = "-- Database Backup for Pasgarda Platform\n";
        $sql .= "-- Generated at " . date('Y-m-d H:i:s') . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            // Get create table
            $createTable = \Illuminate\Support\Facades\DB::select("SHOW CREATE TABLE `{$table}`");
            $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";
            $sql .= array_values((array)$createTable[0])[1] . ";\n\n";

            // Get rows
            $rows = \Illuminate\Support\Facades\DB::table($table)->get();
            if ($rows->count() > 0) {
                $sql .= "INSERT INTO `{$table}` VALUES \n";
                $insertRows = [];
                foreach ($rows as $row) {
                    $values = [];
                    foreach ((array)$row as $value) {
                        if ($value === null) {
                            $values[] = 'NULL';
                        } else {
                            $values[] = "'" . addslashes($value) . "'";
                        }
                    }
                    $insertRows[] = "(" . implode(', ', $values) . ")";
                }
                $sql .= implode(",\n", $insertRows) . ";\n\n";
            }
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        $filename = "backup_pasgarda_" . date('Y_m_d_His') . ".sql";

        return response($sql, 200, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
