<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\Contingent;
use App\Models\ScoringRubric;
use App\Models\JuryMember;
use App\Models\JuryScore;
use App\Models\Score;
use App\Models\ScoreFinalRound;
use Illuminate\Support\Facades\DB;

class PopulateAllContingentScoresSeeder extends Seeder
{
    public function run(): void
    {
        $event = Event::where('slug', 'lpbb-vol20')->first();
        if (!$event) {
            $event = Event::first();
        }
        if (!$event) {
            $this->command->error("No event found. Please run composer run setup first.");
            return;
        }

        $this->command->info("Initializing dynamic hierarchical rubrics and juries for event: {$event->name}...");

        // Clean existing tables to avoid duplicate key issues and start fresh
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        ScoringRubric::where('event_id', $event->id)->delete();
        JuryMember::where('event_id', $event->id)->delete();
        JuryScore::where('event_id', $event->id)->delete();
        Score::where('event_id', $event->id)->delete();
        ScoreFinalRound::where('event_id', $event->id)->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Default structures to seed
        $defaults = [
            'pbb' => [
                [
                    'name' => 'PBB U-16, U-19, Purna/Senior',
                    'code' => 'pbb',
                    'unsur' => [
                        'Berhimpun', 'Berkumpul (Bersaf)', 'Istirahat (Di Tempat)', 'Sikap Sempurna', 'Setengah Lengan Lencang Kiri',
                        'Hormat', 'Lencang Kiri', 'Hitung', 'Parade Periksa Kerapian', '3 Langkah Ke Belakang',
                        'Hadap Kiri Jalan (Di Tempat)', 'Balik Kanan (Henti)', '3 Langkah Ke Depan', '4 Langkah Ke Kanan', 'Lencang Depan',
                        'Hadap Kiri', 'Langkah Perlahan Maju', 'Hadap Kiri Maju (Langkah Biasa)', 'Ganti Langkah 1', 'Melintang Kiri',
                        'Balik Kanan (Maju)', 'Hormat Kanan', 'Ganti Langkah 2', 'Langkah Tegap Ke Langkah Biasa', 'Hadap Kanan Maju',
                        'Belok Kanan', 'Lari', '2 Kali Belok Kanan', 'Hadap Kiri Maju', 'Henti', 'Bubar'
                    ]
                ],
                [
                    'name' => 'PBB U-12',
                    'code' => 'pbb_u12',
                    'unsur' => [
                        'Berkumpul (Bersaf)', 'Sikap Sempurna', 'Setengah Lengan Lencang Kiri', 'Hormat', 'Lencang Kiri',
                        'Hitung', 'Parade Periksa Kerapian', 'Hadap Kiri (Jalan Di Tempat)', 'Balik Kanan Henti', '3 Langkah Ke Belakang',
                        '3 Langkah Ke Depan', '3 Langkah Ke Kanan', 'Lencang Depan', 'Langkah Biasa', 'Ganti Langkah',
                        'Belok Kanan', 'Hadap Kanan Maju', 'Haluan Kanan Maju', 'Hadap Kiri Maju', '2 Kali Belok Kiri',
                        'Hadap Kiri Henti', 'Langkah Perlahan', 'Bubar'
                    ]
                ],
                [
                    'name' => 'Danton',
                    'code' => 'danton',
                    'unsur' => [
                        'Sikap', 'Volume', 'Artikulasi', 'Intonasi, Ritme, Tempo',
                        'Penguasaan Materi', 'Penguasaan Lapangan', 'Penguasaan Pasukan'
                    ]
                ]
            ],
            'vafor' => [
                [
                    'name' => 'Variasi',
                    'code' => 'variasi',
                    'unsur' => [
                        'Opening & Ending Variasi', 'Pembawaan Tema & Konsep',
                        'Kesesuaian Gerakan Dengan Tema & Konsep', 'Kesopanan & Keamanan Gerakan',
                        'Tingkat Kesulitan & Detail Gerakan', 'Kerapihan & Kekompakan', 'Unsur PBB',
                        'Penjiwaan, Ekspresi, Pengucapan Kalimat', 'Semangat & Kestabilan Penampilan',
                        'Penguasaan Ruang & Materi'
                    ]
                ],
                [
                    'name' => 'Formasi',
                    'code' => 'formasi',
                    'unsur' => [
                        'Kombinasi & Pemilihan Gerakan', 'Pembawaan Tema & Konsep',
                        'Ending Celebration (Setelah Tutup Formasi)', 'Kesesuaian Gerakan Dengan Tema & Konsep',
                        'Kesopanan & Keamanan Gerakan', 'Tingkat Kesulitan & Detail Gerakan', 'Unsur PBB',
                        'Penjiwaan, Ekspresi, Pengucapan Kalimat', 'Semangat & Kestabilan Penampilan',
                        'Penguasaan Ruang & Materi'
                    ]
                ],
                [
                    'name' => 'Danton Vafor',
                    'code' => 'danton_vafor',
                    'unsur' => [
                        'Cara Pembawaan',
                        'Kombinasi/Kolaborasi Dengan Pasukan',
                        'Penguasaan Materi Variasi & Formasi'
                    ]
                ]
            ],
            'makeup_kostum' => [
                [
                    'name' => 'Kostum',
                    'code' => 'kostum',
                    'unsur' => [
                        'Kesesuaian Gender/Konsep', 'Keselarasan Penutup Kepala & Sepatu Dengan Kostum',
                        'Body Fitting/Ukuran Baju dan Kenyamanan', 'Cuttingan', 'Desain Kostum',
                        'Kesesuaian Kostum Dengan Konsep Vafor', 'Kharisma Pembawaan Kostum',
                        'Kebersihan & Kerapihan', 'Kreativitas Bentuk & Perpaduan Warna Dengan Kostum',
                        'Kesesuaian Atribut & Penempatan Dengan Desain Kostum'
                    ]
                ],
                [
                    'name' => 'Makeup',
                    'code' => 'makeup',
                    'unsur' => [
                        'Kesesuaian Make Up Dengan Desain Kostum', 'Kesesuaian Make Up Dengan Konsep Vafor',
                        'Kesesuaian Make Up Dengan Gender', 'Kharisma Pembawaan Make Up', 'Kreativitas',
                        'Ketahanan', 'Kenyamanan', 'Kerapihan', 'Kebersihan'
                    ]
                ]
            ]
        ];

        $juryDefaults = [
            'pbb' => [
                ['jury_number' => 1, 'name' => 'Haryoto'],
                ['jury_number' => 2, 'name' => 'Muhammad Dhon'],
                ['jury_number' => 3, 'name' => 'Andri Saputra'],
            ],
            'vafor' => [
                ['jury_number' => 1, 'name' => 'Bahari Pradana'],
                ['jury_number' => 2, 'name' => 'Nurrijal Maulia'],
            ],
            'makeup_kostum' => [
                ['jury_number' => 1, 'name' => 'Mutiara Kinanti Alfida'],
                ['jury_number' => 2, 'name' => 'Shafira Yunita Putri'],
            ]
        ];

        // Seed rubrics & juries for BOTH rounds (rekap and final)
        foreach (['rekap', 'final'] as $round) {
            // Seed Juries
            foreach ($juryDefaults as $type => $juries) {
                foreach ($juries as $jury) {
                    JuryMember::create([
                        'event_id' => $event->id,
                        'round' => $round,
                        'jury_type' => $type,
                        'jury_number' => $jury['jury_number'],
                        'name' => $jury['name'],
                        'is_active' => true,
                    ]);
                }
            }

            // Seed Rubrics (Parents & Children)
            foreach ($defaults as $catGroup => $materiList) {
                $sort = 1;
                foreach ($materiList as $materi) {
                    // Create Parent Rubric (Materi)
                    $parent = ScoringRubric::create([
                        'event_id' => $event->id,
                        'round' => $round,
                        'parent_id' => null,
                        'category' => $catGroup,
                        'name' => $materi['name'],
                        'code' => $materi['code'],
                        'sort_order' => $sort++,
                        'is_active' => true,
                    ]);

                    // Create Child Rubrics (Unsur)
                    $childSort = 1;
                    foreach ($materi['unsur'] as $unsurName) {
                        ScoringRubric::create([
                            'event_id' => $event->id,
                            'round' => $round,
                            'parent_id' => $parent->id,
                            'category' => $catGroup,
                            'name' => $unsurName,
                            'code' => null,
                            'sort_order' => $childSort++,
                            'is_active' => true,
                        ]);
                    }
                }
            }
        }

        $this->command->info("Rubrics and juries seeded successfully. Now generating mock scores...");

        // Load all active rubrics grouped by round and category group
        $rubricsByRound = [];
        foreach (['rekap', 'final'] as $round) {
            $parents = ScoringRubric::where('event_id', $event->id)
                ->where('round', $round)
                ->whereNull('parent_id')
                ->with('children')
                ->get();

            $rubricsByRound[$round] = $parents;
        }

        $contingents = Contingent::where('event_id', $event->id)->get();
        $this->command->info("Found {$contingents->count()} contingents. Generating scores...");

        foreach ($contingents as $idx => $c) {
            // 1. REKAP ROUND (First Round)
            $pbbScores = [];
            $dantonScores = [];
            $vaforScores = [];
            $makeupScores = [];
            $kostumScores = [];

            // PBB Juries (3 Juries)
            // pbb_score = 60 + $idx for each jury (sum = 180 + 3 * $idx)
            // danton_score = 20 + $idx for Jury 1, 20 for Jury 2 & 3 (sum = 60 + $idx)
            for ($num = 1; $num <= 3; $num++) {
                $pbbCode = ($c->category_type === 'U12') ? 'pbb_u12' : 'pbb';
                
                $pbbTarget = 60 + $idx;
                $dantonTarget = ($num === 1) ? (20 + $idx) : 20;

                $pbbDetails = $this->distributeScore($rubricsByRound['rekap']->where('category', 'pbb')->where('code', $pbbCode)->first(), $pbbTarget);
                $dantonDetails = $this->distributeScore($rubricsByRound['rekap']->where('category', 'pbb')->where('code', 'danton')->first(), $dantonTarget);

                $pbbSum = array_sum($pbbDetails);
                $dantonSum = array_sum($dantonDetails);

                JuryScore::create([
                    'event_id' => $event->id,
                    'round' => 'rekap',
                    'contingent_id' => $c->id,
                    'jury_type' => 'pbb',
                    'jury_number' => $num,
                    'pbb_score' => $pbbSum,
                    'danton_score' => $dantonSum,
                    'total_score' => $pbbSum + $dantonSum,
                    'pbb_details' => $pbbDetails,
                    'danton_details' => $dantonDetails,
                ]);

                $pbbScores[] = $pbbSum;
                $dantonScores[] = $dantonSum;
            }

            // Vafor Juries (2 Juries)
            // Jury 1: Variasi = 30 + $idx, Formasi = 30 + $idx, Danton Vafor = 10 + $idx. Total = 70 + 3 * $idx.
            // Jury 2: Variasi = 30, Formasi = 30, Danton Vafor = 10. Total = 70.
            // Sum of Vafor Juries = 140 + 3 * $idx.
            for ($num = 1; $num <= 2; $num++) {
                $varTarget = ($num === 1) ? (30 + $idx) : 30;
                $forTarget = ($num === 1) ? (30 + $idx) : 30;
                $dnvTarget = ($num === 1) ? (10 + $idx) : 10;

                $variasiDetails = $this->distributeScore($rubricsByRound['rekap']->where('category', 'vafor')->where('code', 'variasi')->first(), $varTarget);
                $formasiDetails = $this->distributeScore($rubricsByRound['rekap']->where('category', 'vafor')->where('code', 'formasi')->first(), $forTarget);
                $dantonVaforDetails = $this->distributeScore($rubricsByRound['rekap']->where('category', 'vafor')->where('code', 'danton_vafor')->first(), $dnvTarget);

                $vaforSum = array_sum($variasiDetails) + array_sum($formasiDetails) + array_sum($dantonVaforDetails);

                JuryScore::create([
                    'event_id' => $event->id,
                    'round' => 'rekap',
                    'contingent_id' => $c->id,
                    'jury_type' => 'vafor',
                    'jury_number' => $num,
                    'vafor_score' => $vaforSum,
                    'total_score' => $vaforSum,
                    'variasi_details' => $variasiDetails,
                    'formasi_details' => $formasiDetails,
                    'danton_vafor_details' => $dantonVaforDetails,
                ]);

                $vaforScores[] = $vaforSum;
            }

            // Makeup & Kostum Juries (2 Juries)
            // Jury 1: Kostum = 40 + $idx, Makeup = 30 + $idx. Total = 70 + 2 * $idx.
            // Jury 2: Kostum = 40 + $idx, Makeup = 30. Total = 70 + $idx.
            // Sum Kostum = 80 + 2 * $idx. Sum Makeup = 60 + $idx.
            for ($num = 1; $num <= 2; $num++) {
                $kosTarget = 40 + $idx;
                $makTarget = ($num === 1) ? (30 + $idx) : 30;

                $kostumDetails = $this->distributeScore($rubricsByRound['rekap']->where('category', 'makeup_kostum')->where('code', 'kostum')->first(), $kosTarget);
                $makeupDetails = $this->distributeScore($rubricsByRound['rekap']->where('category', 'makeup_kostum')->where('code', 'makeup')->first(), $makTarget);

                $kostumSum = array_sum($kostumDetails);
                $makeupSum = array_sum($makeupDetails);

                JuryScore::create([
                    'event_id' => $event->id,
                    'round' => 'rekap',
                    'contingent_id' => $c->id,
                    'jury_type' => 'makeup_kostum',
                    'jury_number' => $num,
                    'kostum_score' => $kostumSum,
                    'makeup_score' => $makeupSum,
                    'total_score' => $kostumSum + $makeupSum,
                    'kostum_details' => $kostumDetails,
                    'makeup_details' => $makeupDetails,
                ]);

                $kostumScores[] = $kostumSum;
                $makeupScores[] = $makeupSum;
            }

            // Save aggregate score
            $aggPbb = array_sum($pbbScores);
            $aggDanton = array_sum($dantonScores);
            $aggVafor = array_sum($vaforScores);
            $aggKostum = array_sum($kostumScores);
            $aggMakeup = array_sum($makeupScores);

            $penalties = 0; // Keeping penalties at 0 as requested for clean leaderboard check
            $grandTotal = $aggPbb + $aggDanton + $aggVafor + $aggKostum + $aggMakeup - $penalties;

            Score::create([
                'event_id' => $event->id,
                'contingent_id' => $c->id,
                'pbb_score' => $aggPbb,
                'danton_score' => $aggDanton,
                'vafor_score' => $aggVafor,
                'kostum_score' => $aggKostum,
                'makeup_score' => $aggMakeup,
                'penalties_score' => $penalties,
                'grand_total' => $grandTotal,
            ]);

            // 2. FINAL ROUND (The Final)
            $finalPbbScores = [];
            $finalDantonScores = [];
            $finalVaforScores = [];

            // PBB Juries (3 Juries)
            // pbb_score = 60 + $idx (sum = 180 + 3 * $idx)
            // danton_score = 20 + $idx (sum = 60 + 3 * $idx)
            for ($num = 1; $num <= 3; $num++) {
                $pbbCode = ($c->category_type === 'U12') ? 'pbb_u12' : 'pbb';
                $pbbTarget = 60 + $idx;
                $dantonTarget = 20 + $idx;

                $pbbDetails = $this->distributeScore($rubricsByRound['final']->where('category', 'pbb')->where('code', $pbbCode)->first(), $pbbTarget);
                $dantonDetails = $this->distributeScore($rubricsByRound['final']->where('category', 'pbb')->where('code', 'danton')->first(), $dantonTarget);

                $pbbSum = array_sum($pbbDetails);
                $dantonSum = array_sum($dantonDetails);

                JuryScore::create([
                    'event_id' => $event->id,
                    'round' => 'final',
                    'contingent_id' => $c->id,
                    'jury_type' => 'pbb',
                    'jury_number' => $num,
                    'pbb_score' => $pbbSum,
                    'danton_score' => $dantonSum,
                    'total_score' => $pbbSum + $dantonSum,
                    'pbb_details' => $pbbDetails,
                    'danton_details' => $dantonDetails,
                ]);

                $finalPbbScores[] = $pbbSum;
                $finalDantonScores[] = $dantonSum;
            }

            // Vafor Juries (2 Juries)
            // Jury 1: Variasi = 30 + $idx, Formasi = 30 + $idx, Danton Vafor = 10 + $idx. Total = 70 + 3 * $idx.
            // Jury 2: Variasi = 30 + $idx, Formasi = 30, Danton Vafor = 10. Total = 70 + $idx.
            // Sum Vafor = 140 + 4 * $idx.
            for ($num = 1; $num <= 2; $num++) {
                $varTarget = 30 + $idx;
                $forTarget = ($num === 1) ? (30 + $idx) : 30;
                $dnvTarget = ($num === 1) ? (10 + $idx) : 10;

                $variasiDetails = $this->distributeScore($rubricsByRound['final']->where('category', 'vafor')->where('code', 'variasi')->first(), $varTarget);
                $formasiDetails = $this->distributeScore($rubricsByRound['final']->where('category', 'vafor')->where('code', 'formasi')->first(), $forTarget);
                $dantonVaforDetails = $this->distributeScore($rubricsByRound['final']->where('category', 'vafor')->where('code', 'danton_vafor')->first(), $dnvTarget);

                $vaforSum = array_sum($variasiDetails) + array_sum($formasiDetails) + array_sum($dantonVaforDetails);

                JuryScore::create([
                    'event_id' => $event->id,
                    'round' => 'final',
                    'contingent_id' => $c->id,
                    'jury_type' => 'vafor',
                    'jury_number' => $num,
                    'vafor_score' => $vaforSum,
                    'total_score' => $vaforSum,
                    'variasi_details' => $variasiDetails,
                    'formasi_details' => $formasiDetails,
                    'danton_vafor_details' => $dantonVaforDetails,
                ]);

                $finalVaforScores[] = $vaforSum;
            }

            // Save Final Round Aggregate Score
            $finalPbb = array_sum($finalPbbScores);
            $finalDanton = array_sum($finalDantonScores);
            $finalVafor = array_sum($finalVaforScores);

            $finalPenalties = 0;
            $finalTotal = $finalPbb + $finalDanton + $finalVafor - $finalPenalties;

            ScoreFinalRound::create([
                'event_id' => $event->id,
                'contingent_id' => $c->id,
                'pbb_score' => $finalPbb,
                'danton_score' => $finalDanton,
                'vafor_score' => $finalVafor,
                'score_juri_1' => $finalPbb + $finalDanton,
                'score_juri_2' => $finalVafor,
                'penalties' => $finalPenalties,
                'voting_bonus' => 0.00,
                'total_score' => $finalTotal,
            ]);
        }

        $this->command->info("All scores populated successfully! Recalculating voting bonuses...");

        // Keep voting bonuses and totals updated for both rounds
        Score::recalculateVotingBonuses($event->id);

        $this->command->info("Seeding complete!");
    }

    private function distributeScore($parentRubric, $targetTotal)
    {
        $details = [];
        if ($parentRubric && $parentRubric->children) {
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
            $prefix = $prefixMap[$parentRubric->code] ?? $parentRubric->code;
            
            $sortedChildren = $parentRubric->children->sortBy('sort_order')->values();
            $count = $sortedChildren->count();
            if ($count > 0) {
                $average = floor($targetTotal / $count);
                $remainder = $targetTotal % $count;
                
                foreach ($sortedChildren as $i => $child) {
                    $key = $prefix . '_' . str_pad($i + 1, 2, '0', STR_PAD_LEFT);
                    $details[$key] = (int) ($average + ($i < $remainder ? 1 : 0));
                }
            }
        }
        return $details;
    }
}
