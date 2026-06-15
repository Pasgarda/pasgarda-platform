<?php

namespace App\Jobs;

use App\Models\Contingent;
use App\Models\Event;
use App\Models\JuryScore;
use App\Models\Score;
use App\Models\ScoreFinalRound;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ProcessScoreAggregationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 120;

    public int $eventId;
    public ?int $contingentId;

    public function __construct(int $eventId, ?int $contingentId = null)
    {
        $this->eventId = $eventId;
        $this->contingentId = $contingentId;
    }

    public function handle(): void
    {
        if ($this->contingentId) {
            $this->aggregateScores($this->eventId, $this->contingentId);
        }

        Score::recalculateVotingBonuses($this->eventId);
        $this->checkAndSendScoreNotifications();

        Cache::forget("dashboard_stats_{$this->eventId}");
        Cache::forget("live_leaderboard_{$this->eventId}");
    }

    private function aggregateScores(int $eventId, int $contingentId): void
    {
        $allJuriesScores = JuryScore::where('event_id', $eventId)
            ->where('round', 'rekap')
            ->where('contingent_id', $contingentId)
            ->get();

        $aggPbb = 0; $aggDanton = 0; $aggVariasi = 0; $aggFormasi = 0;
        $aggDantonVafor = 0; $aggKostum = 0; $aggMakeup = 0;

        foreach ($allJuriesScores as $js) {
            if ($js->jury_type === 'pbb') {
                $aggPbb += (int) $js->pbb_score;
                $aggDanton += (int) $js->danton_score;
            } elseif ($js->jury_type === 'vafor') {
                $aggVariasi += (int) $js->variasi_score;
                $aggFormasi += (int) $js->formasi_score;
                $aggDantonVafor += (int) $js->danton_vafor_score;
            } elseif ($js->jury_type === 'makeup_kostum') {
                $aggKostum += (int) $js->kostum_score;
                $aggMakeup += (int) $js->makeup_score;
            }
        }

        $existingScore = Score::where('event_id', $eventId)
            ->where('contingent_id', $contingentId)
            ->first();

        $existingKostumPenalty = $existingScore->kostum_penalty ?? 0;
        $existingMakeupPenalty = $existingScore->makeup_penalty ?? 0;
        $existingPenalties = $existingScore->penalties_score ?? 0;

        $grandTotal = $aggPbb + $aggDanton + $aggVariasi + $aggFormasi
            + $aggDantonVafor
            + ($aggKostum - $existingKostumPenalty)
            + ($aggMakeup - $existingMakeupPenalty)
            - $existingPenalties;

        Score::updateOrCreate(
            ['event_id' => $eventId, 'contingent_id' => $contingentId],
            [
                'pbb_score' => $aggPbb,
                'danton_score' => $aggDanton,
                'vafor_score' => $aggVariasi + $aggFormasi + $aggDantonVafor,
                'variasi_score' => $aggVariasi,
                'formasi_score' => $aggFormasi,
                'danton_vafor_score' => $aggDantonVafor,
                'kostum_score' => $aggKostum,
                'makeup_score' => $aggMakeup,
                'kostum_penalty' => $existingKostumPenalty,
                'makeup_penalty' => $existingMakeupPenalty,
                'penalties_score' => $existingPenalties,
                'grand_total' => $grandTotal,
            ]
        );
    }

    private function checkAndSendScoreNotifications(): void
    {
        $contingents = Contingent::where('event_id', $this->eventId)->get();

        foreach ($contingents as $contingent) {
            $score = Score::where('event_id', $this->eventId)
                ->where('contingent_id', $contingent->id)
                ->first();

            if (!$score || $score->coach_notified_at) continue;

            $juryCount = JuryScore::where('event_id', $this->eventId)
                ->where('contingent_id', $contingent->id)
                ->where('round', 'rekap')
                ->count();

            if ($juryCount < 7) continue;

            $coachUser = $contingent->coachUser;
            if (!$coachUser || !$coachUser->email) {
                $coachUser = User::where('role', 'coach')
                    ->where('name', $contingent->coach_name)
                    ->first();
            }
            if (!$coachUser || !$coachUser->email) continue;

            $event = Event::find($this->eventId);
            $subject = "[PASGARDA] Lembar Nilai Kontingen {$contingent->school_name} Telah Terbit";
            $body = "Halo {$coachUser->name},\n\n"
                  . "Nilai untuk kontingen Anda ({$contingent->school_name}) pada event {$event->name} telah lengkap dan dapat dilihat.\n\n"
                  . "Silakan login ke akun Anda untuk melihat nilai.\n\n"
                  . "Terima kasih.\n\n--\nPASGARDA Platform";

            SendEmailJob::dispatch($coachUser->email, $subject, $body);
            $score->update(['coach_notified_at' => now()]);
        }
    }
}
