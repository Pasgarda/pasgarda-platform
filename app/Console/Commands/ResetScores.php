<?php

namespace App\Console\Commands;

use App\Models\Contingent;
use App\Models\Event;
use App\Models\JuryMember;
use App\Models\JuryScore;
use App\Models\Score;
use App\Models\ScoringRubric;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetScores extends Command
{
    protected $signature = 'scores:reset {slug : Event slug}';

    protected $description = 'Hapus semua jury_scores (rekap) dan scores untuk event, lalu buat ulang dengan nilai 0';

    public function handle()
    {
        $event = Event::where('slug', $this->argument('slug'))->firstOrFail();
        $this->info("Event: {$event->name} (ID: {$event->id})");

        $contingents = Contingent::where('event_id', $event->id)->get();
        $this->info("Contingents: {$contingents->count()}");

        if ($contingents->isEmpty()) {
            $this->warn('Tidak ada kontingen untuk event ini.');
            return;
        }

        $juryMembers = JuryMember::where('event_id', $event->id)
            ->where('round', 'rekap')
            ->where('is_active', true)
            ->get()
            ->groupBy('jury_type')
            ->map(function ($items) {
                return $items->map(function ($m) {
                    return ['id' => $m->jury_number, 'name' => $m->name];
                })->values()->toArray();
            })->toArray();
        $usedDefaults = false;
        if (empty($juryMembers)) {
            $juryMembers = $this->defaultJuryMembers();
            $usedDefaults = true;
            $this->warn('Juri tidak ditemukan di DB, pakai default.');
        }

        $rubricItems = $this->getRubricItems($event->id, $usedDefaults);

        $this->info('Menghapus data lama...');
        $deletedJury = JuryScore::where('event_id', $event->id)->where('round', 'rekap')->delete();
        $deletedScores = Score::where('event_id', $event->id)->delete();
        $this->info("  jury_scores (rekap): {$deletedJury} dihapus");
        $this->info("  scores: {$deletedScores} dihapus");

        $created = 0;
        $bar = $this->output->createProgressBar($contingents->count() * $this->countJuryCombinations($juryMembers));
        $bar->start();

        foreach ($contingents as $contingent) {
            $categoryType = $contingent->category_type;

            foreach (['pbb', 'vafor', 'makeup_kostum'] as $juryType) {
                if (!isset($juryMembers[$juryType])) {
                    continue;
                }

                foreach ($juryMembers[$juryType] as $jury) {
                    $juryNumber = $jury['id'];

                    $details = $this->buildZeroDetails($juryType, $categoryType, $rubricItems);

                    JuryScore::create([
                        'event_id' => $event->id,
                        'round' => 'rekap',
                        'contingent_id' => $contingent->id,
                        'jury_type' => $juryType,
                        'jury_number' => $juryNumber,
                        'pbb_score' => 0,
                        'danton_score' => 0,
                        'vafor_score' => 0,
                        'kostum_score' => 0,
                        'makeup_score' => 0,
                        'penalties_score' => 0,
                        'total_score' => 0,
                        'pbb_details' => $details['pbb_details'],
                        'danton_details' => $details['danton_details'],
                        'variasi_details' => $details['variasi_details'],
                        'formasi_details' => $details['formasi_details'],
                        'danton_vafor_details' => $details['danton_vafor_details'],
                        'kostum_details' => $details['kostum_details'],
                        'makeup_details' => $details['makeup_details'],
                    ]);

                    $created++;
                    $bar->advance();
                }
            }

            Score::create([
                'event_id' => $event->id,
                'contingent_id' => $contingent->id,
                'pbb_score' => 0,
                'danton_score' => 0,
                'vafor_score' => 0,
                'kostum_score' => 0,
                'makeup_score' => 0,
                'penalties_score' => 0,
                'penalties' => [],
                'nilai_kontingen_bonus' => 0,
                'grand_total' => 0,
            ]);
        }

        $bar->finish();
        $this->newLine();

        Score::recalculateVotingBonuses($event->id);

        $this->info("Selesai! {$created} jury_scores dan {$contingents->count()} scores dibuat ulang dengan nilai 0.");
        $this->line('Silakan reload halaman rekap untuk melihat perubahan.');
    }

    private function getRubricItems(int $eventId, bool $useDefaults): array
    {
        $codes = [
            'pbb' => 'pbb',
            'pbb_u12' => 'pbb_u12',
            'danton' => 'danton',
            'variasi' => 'variasi',
            'formasi' => 'formasi',
            'danton_vafor' => 'danton_vafor',
            'kostum' => 'kostum',
            'makeup' => 'makeup',
        ];

        $items = [];
        foreach ($codes as $key => $code) {
            $items[$key] = $this->getChildRubrics($eventId, 'rekap', $code, $useDefaults);
        }

        return $items;
    }

    private function getChildRubrics(int $eventId, string $round, string $code, bool $useDefaults): array
    {
        if (!$useDefaults) {
            $parent = ScoringRubric::where('event_id', $eventId)
                ->where('round', $round)
                ->whereNull('parent_id')
                ->where('code', $code)
                ->first();

            if ($parent) {
                $children = ScoringRubric::where('parent_id', $parent->id)
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->pluck('name')
                    ->toArray();

                if (!empty($children)) {
                    return $children;
                }
            }
        }

        return $this->{'default' . ucfirst(implode('', array_map('ucfirst', explode('_', $code)))) . 'Items'}()
            ?? $this->defaultPbbItems();
    }

    private function buildZeroDetails(string $juryType, string $categoryType, array $rubricItems): array
    {
        $zeroDetails = [
            'pbb_details' => [],
            'danton_details' => [],
            'variasi_details' => [],
            'formasi_details' => [],
            'danton_vafor_details' => [],
            'kostum_details' => [],
            'makeup_details' => [],
        ];

        if ($juryType === 'pbb') {
            $pbbItems = $categoryType === 'U12' ? $rubricItems['pbb_u12'] : $rubricItems['pbb'];
            foreach ($pbbItems as $idx => $item) {
                $zeroDetails['pbb_details'][$item . '_' . $idx] = 0;
            }
            foreach ($rubricItems['danton'] as $item) {
                $zeroDetails['danton_details'][$item] = 0;
            }
        } elseif ($juryType === 'vafor') {
            foreach ($rubricItems['variasi'] as $item) {
                $zeroDetails['variasi_details'][$item] = 0;
            }
            foreach ($rubricItems['formasi'] as $item) {
                $zeroDetails['formasi_details'][$item] = 0;
            }
            foreach ($rubricItems['danton_vafor'] as $item) {
                $zeroDetails['danton_vafor_details'][$item] = 0;
            }
        } elseif ($juryType === 'makeup_kostum') {
            foreach ($rubricItems['kostum'] as $item) {
                $zeroDetails['kostum_details'][$item] = 0;
            }
            foreach ($rubricItems['makeup'] as $item) {
                $zeroDetails['makeup_details'][$item] = 0;
            }
        }

        return $zeroDetails;
    }

    private function countJuryCombinations(array $juryMembers): int
    {
        $count = 0;
        foreach (['pbb', 'vafor', 'makeup_kostum'] as $type) {
            if (isset($juryMembers[$type])) {
                $count += count($juryMembers[$type]);
            }
        }
        return $count;
    }

    private function defaultPbbItems(): array
    {
        return [
            'Berhimpun', 'Berkumpul (Bersaf)', 'Istirahat (Di Tempat)', 'Sikap Sempurna', 'Setengah Lengan Lencang Kiri',
            'Hormat', 'Lencang Kiri', 'Hitung', 'Parade Periksa Kerapian', '3 Langkah Ke Belakang',
            'Hadap Kiri Jalan (Di Tempat)', 'Balik Kanan (Henti)', '3 Langkah Ke Depan', '4 Langkah Ke Kanan', 'Lencang Depan',
            'Hadap Kiri', 'Langkah Perlahan Maju', 'Hadap Kiri Maju (Langkah Biasa)', 'Ganti Langkah 1', 'Melintang Kiri',
            'Balik Kanan (Maju)', 'Hormat Kanan', 'Ganti Langkah 2', 'Langkah Tegap Ke Langkah Biasa', 'Hadap Kanan Maju',
            'Belok Kanan', 'Lari', '2 Kali Belok Kanan', 'Hadap Kiri Maju', 'Henti', 'Bubar',
        ];
    }

    private function defaultPbbU12Items(): array
    {
        return [
            'Berkumpul (Bersaf)', 'Sikap Sempurna', 'Setengah Lengan Lencang Kiri', 'Hormat', 'Lencang Kiri',
            'Hitung', 'Parade Periksa Kerapian', 'Hadap Kiri (Jalan Di Tempat)', 'Balik Kanan Henti', '3 Langkah Ke Belakang',
            '3 Langkah Ke Depan', '3 Langkah Ke Kanan', 'Lencang Depan', 'Langkah Biasa', 'Ganti Langkah',
            'Belok Kanan', 'Hadap Kanan Maju', 'Haluan Kanan Maju', 'Hadap Kiri Maju', '2 Kali Belok Kiri',
            'Hadap Kiri Henti', 'Langkah Perlahan', 'Bubar',
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
            'Kesesuaian Atribut & Penempatan Dengan Desain Kostum',
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
}
