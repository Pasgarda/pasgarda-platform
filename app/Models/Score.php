<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Score extends Model
{
    protected $fillable = [
        'event_id',
        'contingent_id',
        'pbb_score',
        'danton_score',
        'vafor_score',
        'variasi_score',
        'formasi_score',
        'danton_vafor_score',
        'kostum_score',
        'kostum_penalty',
        'makeup_score',
        'makeup_penalty',
        'penalties_score',
        'penalties',
        'nilai_kontingen_bonus',
        'grand_total',
        'is_locked',
        'coach_notified_at',
    ];

    protected $casts = [
        'pbb_score' => 'integer',
        'danton_score' => 'integer',
        'vafor_score' => 'integer',
        'variasi_score' => 'integer',
        'formasi_score' => 'integer',
        'danton_vafor_score' => 'integer',
        'kostum_score' => 'integer',
        'kostum_penalty' => 'integer',
        'makeup_score' => 'integer',
        'makeup_penalty' => 'integer',
        'penalties_score' => 'integer',
        'penalties' => 'array',
        'nilai_kontingen_bonus' => 'integer',
        'grand_total' => 'integer',
        'is_locked' => 'boolean',
        'coach_notified_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function contingent()
    {
        return $this->belongsTo(Contingent::class);
    }

    public function scorePbbDetails()
    {
        return $this->hasMany(ScorePbbDetail::class);
    }

    protected $appends = ['vafor_score', 'net_kostum_score'];

    public function getVaforScoreAttribute($value)
    {
        return (int) ($this->attributes['variasi_score'] ?? 0)
            + (int) ($this->attributes['formasi_score'] ?? 0)
            + (int) ($this->attributes['danton_vafor_score'] ?? 0);
    }

    public function getNetKostumScoreAttribute()
    {
        return (int) ($this->attributes['kostum_score'] ?? 0)
            - (int) ($this->attributes['kostum_penalty'] ?? 0);
    }

    public static function recalculateVotingBonuses($eventId)
    {
        $contingents = Contingent::where('event_id', $eventId)
            ->withCount('voteLogs')
            ->with('scores')
            ->orderByDesc('vote_logs_count')
            ->get()
            ->keyBy('id');

        $bonuses = [
            1 => 0.01,
            2 => 0.008,
            3 => 0.006,
            4 => 0.004,
            5 => 0.003,
            6 => 0.002,
            7 => 0.001,
        ];

        // Group contingents by category for rank computation
        $contingentsByCategory = $contingents->groupBy('category_type');

        // Calculate voting bonus for each contingent and update first-round scores
        $firstRoundUpdates = [];
        foreach ($contingents as $contingent) {
            $score = $contingent->scores->first();
            if (!$score) continue;

            // Dense ranking within category (same votes = same rank)
            $catList = $contingentsByCategory->get($contingent->category_type, collect())->sortByDesc('vote_logs_count')->values();
            $rank = 8;
            $prevVotes = null;
            $currentRank = 0;
            foreach ($catList as $idx => $c) {
                if ($c->vote_logs_count !== $prevVotes) {
                    $currentRank = $idx + 1;
                    $prevVotes = $c->vote_logs_count;
                }
                if ($c->id == $contingent->id) {
                    $rank = $currentRank;
                    break;
                }
            }

            $pbbDantonSum = (int) $score->pbb_score + (int) $score->danton_score;
            $bonusPercentage = ($contingent->vote_logs_count > 0) ? ($bonuses[$rank] ?? 0.0) : 0.0;
            $votingBonus = (int) round($pbbDantonSum * $bonusPercentage);

            $kostumNet = (int) $score->kostum_score - (int) ($score->kostum_penalty ?? 0);
            $makeupNet = (int) $score->makeup_score - (int) ($score->makeup_penalty ?? 0);
            $grandTotal = (int) (
                (int) $score->pbb_score + (int) $score->danton_score +
                (int) $score->variasi_score + (int) $score->formasi_score +
                (int) $score->danton_vafor_score +
                $kostumNet + $makeupNet -
                (int) $score->penalties_score
            );

            $firstRoundUpdates[] = [
                'id' => $score->id,
                'nilai_kontingen_bonus' => $votingBonus,
                'grand_total' => $grandTotal,
            ];
        }
        if ($firstRoundUpdates) {
            $bonusCases = implode(' ', array_map(fn ($s) => "WHEN {$s['id']} THEN {$s['nilai_kontingen_bonus']}", $firstRoundUpdates));
            $gtCases = implode(' ', array_map(fn ($s) => "WHEN {$s['id']} THEN {$s['grand_total']}", $firstRoundUpdates));
            $ids = implode(',', array_column($firstRoundUpdates, 'id'));
            DB::statement("UPDATE scores SET nilai_kontingen_bonus = CASE id {$bonusCases} END, grand_total = CASE id {$gtCases} END WHERE id IN ({$ids})");
        }

        // Preload all final round scores for this event
        $finalScores = ScoreFinalRound::where('event_id', $eventId)->get()->keyBy('contingent_id');

        // Bulk update final round scores
        $finalUpdates = [];
        foreach ($finalScores as $contingentId => $fs) {
            $contingent = $contingents->get($contingentId);
            if (!$contingent) continue;

            // Dense ranking within category (same votes = same rank)
            $catList = $contingentsByCategory->get($contingent->category_type, collect())->sortByDesc('vote_logs_count')->values();
            $rank = 8;
            $prevVotes = null;
            $currentRank = 0;
            foreach ($catList as $idx => $c) {
                if ($c->vote_logs_count !== $prevVotes) {
                    $currentRank = $idx + 1;
                    $prevVotes = $c->vote_logs_count;
                }
                if ($c->id == $contingent->id) {
                    $rank = $currentRank;
                    break;
                }
            }

            $firstRoundScore = $contingent->scores->first();
            $pbbDantonSum = $firstRoundScore ? ((int) $firstRoundScore->pbb_score + (int) $firstRoundScore->danton_score) : 0;

            $bonusPercentage = ($contingent->vote_logs_count > 0) ? ($bonuses[$rank] ?? 0.0) : 0.0;
            $votingBonus = (int) round($pbbDantonSum * $bonusPercentage);

            $baseScoreSum = (int) $fs->pbb_score + (int) $fs->danton_score + (int) $fs->vafor_score;
            if ($baseScoreSum == 0) {
                $baseScoreSum = (int) $fs->score_juri_1 + (int) $fs->score_juri_2;
            }

            $totalScore = (int) ($baseScoreSum - (int) $fs->penalties);

            $finalUpdates[] = [
                'id' => $fs->id,
                'voting_bonus' => $votingBonus,
                'total_score' => $totalScore,
            ];
        }

        if ($finalUpdates) {
            $vbCases = implode(' ', array_map(fn ($u) => "WHEN {$u['id']} THEN {$u['voting_bonus']}", $finalUpdates));
            $tsCases = implode(' ', array_map(fn ($u) => "WHEN {$u['id']} THEN {$u['total_score']}", $finalUpdates));
            $ids = implode(',', array_column($finalUpdates, 'id'));
            DB::statement("UPDATE scores_final_round SET voting_bonus = CASE id {$vbCases} END, total_score = CASE id {$tsCases} END WHERE id IN ({$ids})");
        }
    }

    public static function checkAndSendScoreNotification($contingentId, $eventId)
    {
        $score = self::where('event_id', $eventId)
            ->where('contingent_id', $contingentId)
            ->first();

        if (!$score || $score->coach_notified_at !== null) {
            return;
        }

        // Check if there are exactly 7 JuryScore records
        $juryScoresCount = \App\Models\JuryScore::where('event_id', $eventId)
            ->where('contingent_id', $contingentId)
            ->count();

        if ($juryScoresCount < 7) {
            return;
        }

        // Get the contingent
        $contingent = \App\Models\Contingent::find($contingentId);
        if (!$contingent || !$contingent->coach_name) {
            return;
        }

        // Get the coach user matching coach_name
        $coachUser = \App\Models\User::where('role', 'coach')
            ->where('name', $contingent->coach_name)
            ->first();

        if (!$coachUser || !$coachUser->email) {
            return;
        }

        $event = \App\Models\Event::find($eventId);
        if (!$event) {
            return;
        }

        // Send Email
        $subject = "[PASGARDA] Lembar Nilai Kontingen {$contingent->school_name} Telah Terbit";
        $body = "Halo {$coachUser->name},\n\n"
              . "Nilai untuk kontingen Anda ({$contingent->school_name}) pada event {$event->name} telah lengkap dimasukkan oleh dewan juri.\n\n"
              . "Anda sekarang dapat membuka Portal Rep Pelatih di platform PASGARDA untuk melihat lembar penilaian privat, perolehan skor PBB, Danton, Variasi, Formasi, Kostum, dan Makeup secara real-time:\n\n"
              . "http://127.0.0.1:8000/events/{$event->slug}/myscore\n\n"
              . "Terima kasih atas partisipasi dan dedikasi Anda!\n\n"
              . "Salam,\n"
              . "Panitia PASGARDA";

        try {
            \Illuminate\Support\Facades\Mail::raw($body, function ($message) use ($coachUser, $subject) {
                $message->to($coachUser->email)
                    ->subject($subject);
            });

            $score->update(['coach_notified_at' => now()]);
            \Illuminate\Support\Facades\Log::info("SCORE RELEASE EMAIL SENT to coach {$coachUser->email} for contingent {$contingent->school_name}");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send score notification email to {$coachUser->email}: " . $e->getMessage());
        }
    }
}
