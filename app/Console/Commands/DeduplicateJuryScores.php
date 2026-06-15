<?php

namespace App\Console\Commands;

use App\Models\JuryScore;
use App\Models\Score;
use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeduplicateJuryScores extends Command
{
    protected $signature = 'scores:deduplicate';

    protected $description = 'Hapus duplikat jury_scores, sisakan record terakhir per (event, round, contingent, type, number), lalu re-aggregate';

    public function handle()
    {
        $duplicates = DB::table('jury_scores as js')
            ->selectRaw('MAX(js.id) as keep_id')
            ->from(DB::raw('(SELECT event_id, `round`, contingent_id, jury_type, jury_number FROM jury_scores GROUP BY event_id, `round`, contingent_id, jury_type, jury_number HAVING COUNT(*) > 1) as dup'))
            ->join('jury_scores as js', function ($join) {
                $join->on('js.event_id', '=', 'dup.event_id')
                    ->on('js.round', '=', 'dup.round')
                    ->on('js.contingent_id', '=', 'dup.contingent_id')
                    ->on('js.jury_type', '=', 'dup.jury_type')
                    ->on('js.jury_number', '=', 'dup.jury_number');
            })
            ->groupBy('dup.event_id', 'dup.round', 'dup.contingent_id', 'dup.jury_type', 'dup.jury_number')
            ->get();

        $deletedCount = 0;
        $affectedEvents = collect();

        foreach ($duplicates as $dup) {
            $deleted = DB::table('jury_scores')
                ->where('event_id', function ($q) use ($dup) {
                    $q->select('event_id')->from('jury_scores')->where('id', $dup->keep_id);
                })
                ->where('round', function ($q) use ($dup) {
                    $q->select('round')->from('jury_scores')->where('id', $dup->keep_id);
                })
                ->where('contingent_id', function ($q) use ($dup) {
                    $q->select('contingent_id')->from('jury_scores')->where('id', $dup->keep_id);
                })
                ->where('jury_type', function ($q) use ($dup) {
                    $q->select('jury_type')->from('jury_scores')->where('id', $dup->keep_id);
                })
                ->where('jury_number', function ($q) use ($dup) {
                    $q->select('jury_number')->from('jury_scores')->where('id', $dup->keep_id);
                })
                ->where('id', '<>', $dup->keep_id)
                ->delete();

            $deletedCount += $deleted;

            $js = JuryScore::find($dup->keep_id);
            if ($js) {
                $affectedEvents->push($js->event_id);
            }
        }

        $uniqueEvents = $affectedEvents->unique();
        $this->info("Deleted {$deletedCount} duplicate jury_score records.");
        $this->info("Re-aggregating scores for " . $uniqueEvents->count() . " affected events...");

        $bar = $this->output->createProgressBar($uniqueEvents->count());

        foreach ($uniqueEvents as $eventId) {
            $event = Event::find($eventId);
            if (!$event) {
                $bar->advance();
                continue;
            }

            // Re-aggregate from jury_scores into scores table for ALL contingents in this event
            $contingentIds = DB::table('jury_scores')
                ->where('event_id', $eventId)
                ->where('round', 'rekap')
                ->distinct()
                ->pluck('contingent_id');

            foreach ($contingentIds as $contingentId) {
                $allJuries = JuryScore::where('event_id', $eventId)
                    ->where('round', 'rekap')
                    ->where('contingent_id', $contingentId)
                    ->get();

                $aggPbb = 0;
                $aggDanton = 0;
                $aggVafor = 0;
                $aggKostum = 0;
                $aggMakeup = 0;

                foreach ($allJuries as $js) {
                    if ($js->jury_type === 'pbb') {
                        $aggPbb += $js->pbb_score;
                        $aggDanton += $js->danton_score;
                    } elseif ($js->jury_type === 'vafor') {
                        $aggVafor += $js->vafor_score;
                    } elseif ($js->jury_type === 'makeup_kostum') {
                        $aggKostum += $js->kostum_score;
                        $aggMakeup += $js->makeup_score;
                    }
                }

                $existingScore = Score::where('event_id', $eventId)
                    ->where('contingent_id', $contingentId)
                    ->first();

                $penalties = $existingScore ? (float) $existingScore->penalties_score : 0;

                Score::updateOrCreate(
                    [
                        'event_id' => $eventId,
                        'contingent_id' => $contingentId,
                    ],
                    [
                        'pbb_score' => (int) round($aggPbb),
                        'danton_score' => (int) round($aggDanton),
                        'vafor_score' => (int) round($aggVafor),
                        'kostum_score' => (int) round($aggKostum),
                        'makeup_score' => (int) round($aggMakeup),
                    ]
                );
            }

            // Recalculate voting bonuses and grand_total
            Score::recalculateVotingBonuses($eventId);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info('Selesai! Semua skor telah di-re-aggregate.');
    }
}
