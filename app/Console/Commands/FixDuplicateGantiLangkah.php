<?php

namespace App\Console\Commands;

use App\Models\Contingent;
use App\Models\Event;
use App\Models\JuryScore;
use App\Models\ScoreFinalRound;
use Illuminate\Console\Command;

class FixDuplicateGantiLangkah extends Command
{
    protected $signature = 'scores:fix-duplicate-ganti-langkah {slug? : Event slug}';

    protected $description = 'Rename duplicate Ganti Langkah keys di jury_scores.pbb_details ke Ganti Langkah 1 dan Ganti Langkah 2';

    public function handle()
    {
        $slug = $this->argument('slug');
        $event = $slug
            ? Event::where('slug', $slug)->firstOrFail()
            : Event::where('status', 'active')->first();

        if (!$event) {
            $this->error('Event tidak ditemukan.');
            return 1;
        }

        $this->info("Event: {$event->name}");

        // Preload contingent category types to avoid N+1
        $catMap = Contingent::where('event_id', $event->id)
            ->pluck('category_type', 'id');

        // --- FIX JURY_SCORES ---
        $juryScores = JuryScore::where('event_id', $event->id)->get();
        $this->info("Jury scores: {$juryScores->count()} rows");
        $fixed = 0;

        $bar = $this->output->createProgressBar($juryScores->count());
        $bar->start();

        foreach ($juryScores as $js) {
            $changed = false;

            // Skip U12 — they only have one Ganti Langkah, no duplicate
            $cat = $catMap[$js->contingent_id] ?? null;
            if ($cat === 'U12') {
                $bar->advance();
                continue;
            }

            if ($js->pbb_details && array_key_exists('Ganti Langkah', $js->pbb_details)) {
                $details = $js->pbb_details;
                $val = $details['Ganti Langkah'];
                unset($details['Ganti Langkah']);
                $details['Ganti Langkah 1'] = $val;
                $details['Ganti Langkah 2'] = $val;
                $js->pbb_details = $details;
                $changed = true;
            }

            if ($changed) {
                $pbbSum = $js->pbb_details ? array_sum($js->pbb_details) : 0;
                $js->pbb_score = $pbbSum;
                $totalBefore = $js->total_score;

                $otherSum = 0;
                if ($js->danton_details) $otherSum += array_sum($js->danton_details);
                if ($js->variasi_details) $otherSum += array_sum($js->variasi_details);
                if ($js->formasi_details) $otherSum += array_sum($js->formasi_details);
                if ($js->danton_vafor_details) $otherSum += array_sum($js->danton_vafor_details);
                if ($js->kostum_details) $otherSum += array_sum($js->kostum_details);
                if ($js->makeup_details) $otherSum += array_sum($js->makeup_details);

                $js->total_score = $pbbSum + $otherSum;
                $js->save();
                $fixed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Fixed jury_scores: {$fixed} rows");

        // --- FIX SCORES_FINAL_ROUND ---
        $finalScores = ScoreFinalRound::where('event_id', $event->id)->get();
        $this->info("Scores final round: {$finalScores->count()} rows");
        $fixedFinal = 0;

        foreach ($finalScores as $fs) {
            // Skip U12
            $cat = $catMap[$fs->contingent_id] ?? null;
            if ($cat === 'U12') continue;

            $changed = false;

            for ($i = 1; $i <= 3; $i++) {
                $field = "juri_{$i}_pbb_details";
                $details = $fs->{$field} ?? [];
                if (array_key_exists('Ganti Langkah', $details)) {
                    $val = $details['Ganti Langkah'];
                    unset($details['Ganti Langkah']);
                    $details['Ganti Langkah 1'] = $val;
                    $details['Ganti Langkah 2'] = $val;
                    $fs->{$field} = $details;
                    $changed = true;
                }
            }

            if ($changed) {
                $pbbTotal = 0;
                $dantonTotal = 0;
                for ($i = 1; $i <= 3; $i++) {
                    $pbbDet = $fs->{"juri_{$i}_pbb_details"} ?? [];
                    $dantonDet = $fs->{"juri_{$i}_danton_details"} ?? [];
                    $pbbTotal += array_sum($pbbDet);
                    $dantonTotal += array_sum($dantonDet);
                }
                $vaforTotal = 0;
                for ($i = 1; $i <= 2; $i++) {
                    $varDet = $fs->{"juri_{$i}_variasi_details"} ?? [];
                    $formDet = $fs->{"juri_{$i}_formasi_details"} ?? [];
                    $dvDet = $fs->{"juri_{$i}_danton_vafor_details"} ?? [];
                    $vaforTotal += array_sum($varDet) + array_sum($formDet) + array_sum($dvDet);
                }

                $fs->pbb_score = $pbbTotal;
                $fs->danton_score = $dantonTotal;
                $fs->vafor_score = $vaforTotal;
                $fs->score_juri_1 = $pbbTotal + $dantonTotal;
                $fs->score_juri_2 = $vaforTotal;
                $fs->save();
                $fixedFinal++;
            }
        }

        $this->info("Fixed scores_final_round: {$fixedFinal} rows");

        $this->info('Selesai! Jalankan `php artisan scores:set-all-ten` untuk normalisasi nilai ke 10.');
        return 0;
    }
}
