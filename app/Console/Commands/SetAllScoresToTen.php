<?php

namespace App\Console\Commands;

use App\Models\Contingent;
use App\Models\Event;
use App\Models\JuryScore;
use App\Models\Score;
use App\Models\ScoreFinalRound;
use Illuminate\Console\Command;

class SetAllScoresToTen extends Command
{
    protected $signature = 'scores:set-all-ten {slug? : Event slug}';

    protected $description = 'Set semua sub-item nilai di jury_scores, scores, dan scores_final_round ke 10';

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

        $contingents = Contingent::where('event_id', $event->id)->get();
        $this->info("Kontingen: {$contingents->count()}");

        if ($contingents->isEmpty()) {
            $this->warn('Tidak ada kontingen.');
            return;
        }

        $contingentIds = $contingents->pluck('id');
        $catMap = $contingents->pluck('category_type', 'id');

        // --- JURY_SCORES (REKAP + FINAL) ---
        $juryScores = JuryScore::whereIn('contingent_id', $contingentIds)
            ->where('event_id', $event->id)
            ->get();

        $this->info("Jury scores: {$juryScores->count()} rows");
        $bar = $this->output->createProgressBar($juryScores->count());
        $bar->start();

        foreach ($juryScores as $js) {
            $cat = $catMap[$js->contingent_id] ?? 'U16';
            $this->setJuryDetailsToTen($js, $cat);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        // --- SCORES ---
        $this->info('Menghitung ulang scores (aggregasi)...');
        foreach ($contingents as $c) {
            $this->recalcScoreForContingent($event->id, $c);
        }
        $this->info('  done.');

        // --- SCORES_FINAL_ROUND ---
        $this->info('Menghitung ulang scores_final_round...');
        foreach ($contingents as $c) {
            $this->recalcFinalRoundForContingent($event->id, $c);
        }
        $this->info('  done.');

        // --- RECALCULATE BONUSES ---
        $this->info('Menghitung ulang voting bonuses...');
        Score::recalculateVotingBonuses($event->id);
        $this->info('Selesai!');

        return 0;
    }

    private function setJuryDetailsToTen(JuryScore $js, string $cat): void
    {
        $update = [];
        $total = 0;

        // PBB details
        if ($js->pbb_details) {
            $details = $js->pbb_details;
            $sum = 0;
            foreach ($details as $k => $v) {
                $details[$k] = 10;
                $sum += 10;
            }
            $update['pbb_details'] = $details;
            $update['pbb_score'] = $sum;
            $total += $sum;
        }

        // Danton details
        if ($js->danton_details) {
            $details = $js->danton_details;
            $sum = 0;
            foreach ($details as $k => $v) {
                $details[$k] = 10;
                $sum += 10;
            }
            $update['danton_details'] = $details;
            $update['danton_score'] = $sum;
            $total += $sum;
        }

        // Variasi details
        if ($js->variasi_details) {
            $details = $js->variasi_details;
            $sum = 0;
            foreach ($details as $k => $v) {
                $details[$k] = 10;
                $sum += 10;
            }
            $update['variasi_details'] = $details;
            $update['variasi_score'] = $sum;
        }

        // Formasi details
        if ($js->formasi_details) {
            $details = $js->formasi_details;
            $sum = 0;
            foreach ($details as $k => $v) {
                $details[$k] = 10;
                $sum += 10;
            }
            $update['formasi_details'] = $details;
            $update['formasi_score'] = $sum;
        }

        // Danton Vafor details
        if ($js->danton_vafor_details) {
            $details = $js->danton_vafor_details;
            $sum = 0;
            foreach ($details as $k => $v) {
                $details[$k] = 10;
                $sum += 10;
            }
            $update['danton_vafor_details'] = $details;
            $update['danton_vafor_score'] = $sum;
        }

        // Vafor total
        $update['vafor_score'] = ($update['variasi_score'] ?? 0)
            + ($update['formasi_score'] ?? 0)
            + ($update['danton_vafor_score'] ?? 0);

        // Kostum details
        if ($js->kostum_details) {
            $details = $js->kostum_details;
            $sum = 0;
            foreach ($details as $k => $v) {
                $details[$k] = 10;
                $sum += 10;
            }
            $update['kostum_details'] = $details;
            $update['kostum_score'] = $sum;
            $total += $sum;
        }

        // Makeup details
        if ($js->makeup_details) {
            $details = $js->makeup_details;
            $sum = 0;
            foreach ($details as $k => $v) {
                $details[$k] = 10;
                $sum += 10;
            }
            $update['makeup_details'] = $details;
            $update['makeup_score'] = $sum;
            $total += $sum;
        }

        // Jika vafor tidak masuk total (karena jury_type=vafor handled by variasi/formasi/danton_vafor)
        if ($js->jury_type === 'vafor') {
            $total = $update['vafor_score'];
        }

        $update['penalties_score'] = 0;
        $update['total_score'] = $total;

        $js->update($update);
    }

    private function recalcScoreForContingent(int $eventId, Contingent $c): void
    {
        $cat = $c->category_type;
        $juryRekap = JuryScore::where('event_id', $eventId)
            ->where('contingent_id', $c->id)
            ->where('round', 'rekap')
            ->get();

        $pbbScores = $juryRekap->where('jury_type', 'pbb');
        $vaforScores = $juryRekap->where('jury_type', 'vafor');
        $mkScores = $juryRekap->where('jury_type', 'makeup_kostum');

        $data = [
            'pbb_score' => round($pbbScores->sum('pbb_score'), 2),
            'danton_score' => round($pbbScores->sum('danton_score'), 2),
            'variasi_score' => round($vaforScores->sum('variasi_score'), 2),
            'formasi_score' => round($vaforScores->sum('formasi_score'), 2),
            'danton_vafor_score' => round($vaforScores->sum('danton_vafor_score'), 2),
            'kostum_score' => round($mkScores->sum('kostum_score'), 2),
            'kostum_penalty' => 0,
            'makeup_score' => round($mkScores->sum('makeup_score'), 2),
            'penalties_score' => 0,
            'penalties' => [],
            'vafor_score' => 0,
            'nilai_kontingen_bonus' => 0,
            'grand_total' => 0,
        ];

        $data['vafor_score'] = $data['variasi_score'] + $data['formasi_score'] + $data['danton_vafor_score'];
        $data['grand_total'] = $data['pbb_score'] + $data['danton_score'] + $data['vafor_score']
            + $data['kostum_score'] + $data['makeup_score']
            - $data['penalties_score'] - $data['kostum_penalty'];

        Score::updateOrCreate(
            ['event_id' => $eventId, 'contingent_id' => $c->id],
            $data
        );
    }

    private function recalcFinalRoundForContingent(int $eventId, Contingent $c): void
    {
        $juryFinal = JuryScore::where('event_id', $eventId)
            ->where('contingent_id', $c->id)
            ->where('round', 'final')
            ->get();

        if ($juryFinal->isEmpty()) {
            return;
        }

        $pbbScores = $juryFinal->where('jury_type', 'pbb');
        $vaforScores = $juryFinal->where('jury_type', 'vafor');

        $finalPbb = round($pbbScores->sum('pbb_score'), 2);
        $finalDanton = round($pbbScores->sum('danton_score'), 2);
        $finalVafor = round($vaforScores->sum('vafor_score'), 2);
        $totalScore = $finalPbb + $finalDanton + $finalVafor;

        ScoreFinalRound::updateOrCreate(
            ['event_id' => $eventId, 'contingent_id' => $c->id],
            [
                'pbb_score' => $finalPbb,
                'danton_score' => $finalDanton,
                'vafor_score' => $finalVafor,
                'score_juri_1' => $finalPbb + $finalDanton,
                'score_juri_2' => $finalVafor,
                'penalties' => 0,
                'voting_bonus' => 0,
                'total_score' => $totalScore,
            ]
        );
    }
}
