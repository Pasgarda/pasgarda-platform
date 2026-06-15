<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Contingent;
use App\Models\Order;
use App\Models\IssuedTicket;
use App\Models\VoteLog;
use App\Models\SupporterLog;
use App\Models\Score;
use App\Models\ScoreFinalRound;
use App\Models\JuryScore;
use App\Models\MerchandiseSale;
use App\Models\SocialMediaLike;
use App\Models\User;
use App\Models\TicketPackage;
use Illuminate\Http\Request;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Writer;

class DataExportController extends Controller
{
    public function exportAll($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $writer = new Writer();
        $headerStyle = new Style(
            fontBold: true,
            fontColor: Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: CellAlignment::CENTER,
        );

        $filePath = storage_path("app/export_{$event->slug}_" . now()->format('Ymd_His') . '.xlsx');
        $writer->openToFile($filePath);

        // Sheet 1: Ringkasan Keuangan
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Ringkasan Keuangan');
        $sheet->setColumnWidthForRange(25, 1, 1);
        $sheet->setColumnWidthForRange(20, 2, 2);
        $sheet->setColumnWidthForRange(20, 3, 3);
        $writer->addRow(Row::fromValuesWithStyle(['Ringkasan Keuangan - ' . $event->name], $headerStyle));

        $totalOts = Order::where('event_id', $event->id)->where('payment_status', 'paid')
            ->where('payment_method', '!=', 'online')->sum('total_price');
        $totalOnline = Order::where('event_id', $event->id)->where('payment_status', 'paid')
            ->where('payment_method', 'online')->sum('total_price');
        $totalMerch = MerchandiseSale::where('event_id', $event->id)->sum('total_price');
        $totalRevenue = Order::where('event_id', $event->id)->where('payment_status', 'paid')->sum('total_price') + $totalMerch;

        $writer->addRow(Row::fromValues(['Total Pendapatan', number_format($totalRevenue, 0, ',', '.')]));
        $writer->addRow(Row::fromValues(['- Tiket OTS', number_format($totalOts, 0, ',', '.')]));
        $writer->addRow(Row::fromValues(['- Tiket Online', number_format($totalOnline, 0, ',', '.')]));
        $writer->addRow(Row::fromValues(['- Merchandise', number_format($totalMerch, 0, ',', '.')]));

        // Per Paket breakdown
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyle(['Rincian per Paket Tiket'], $headerStyle));
        $writer->addRow(Row::fromValues(['Paket', 'Jumlah Terjual', 'Total Pendapatan']));
        $packages = TicketPackage::where('event_id', $event->id)->get();
        foreach ($packages as $pkg) {
            $qty = IssuedTicket::where('ticket_package_id', $pkg->id)
                ->whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
                ->count();
            $revenue = $qty * $pkg->price;
            $writer->addRow(Row::fromValues([$pkg->name, $qty, number_format($revenue, 0, ',', '.')]));
        }

        // Sheet 2: Pesanan
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Pesanan');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 2);
        $sheet->setColumnWidthForRange(30, 3, 3);
        $sheet->setColumnWidthForRange(15, 4, 6);
        $sheet->setColumnWidthForRange(20, 7, 7);
        $writer->addRow(Row::fromValuesWithStyle(['ID', 'User', 'Email', 'Total', 'Status', 'Metode', 'Tanggal'], $headerStyle));
        Order::where('event_id', $event->id)->chunk(200, function ($orders) use ($writer) {
            foreach ($orders as $o) {
                $writer->addRow(Row::fromValues([
                    $o->midtrans_transaction_id, $o->user?->name, $o->user?->email,
                    number_format($o->total_price, 0, ',', '.'), $o->payment_status, $o->payment_method,
                    $o->created_at->format('d M Y H:i'),
                ]));
            }
        });

        // Sheet 3: Tiket Terbit
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Tiket Terbit');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(20, 2, 2);
        $sheet->setColumnWidthForRange(25, 3, 3);
        $sheet->setColumnWidthForRange(30, 4, 4);
        $sheet->setColumnWidthForRange(15, 5, 6);
        $sheet->setColumnWidthForRange(20, 7, 7);
        $writer->addRow(Row::fromValuesWithStyle(['QR Hash', 'Paket', 'Pembeli', 'Email', 'Check-In', 'Vote', 'Tanggal'], $headerStyle));
        IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id))
            ->chunk(200, function ($tickets) use ($writer) {
                foreach ($tickets as $t) {
                    $writer->addRow(Row::fromValues([
                        $t->unique_qr_hash, $t->package?->name, $t->buyer_name, $t->buyer_email,
                        $t->check_in_status ? 'Ya' : 'Tidak', $t->vote_tokens_remaining,
                        $t->created_at->format('d M Y H:i'),
                    ]));
                }
            });

        // Sheet 4: Kontingen & Nilai
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Kontingen & Nilai');
        $sheet->setColumnWidthForRange(30, 1, 1);
        $sheet->setColumnWidthForRange(15, 2, 3);
        $sheet->setColumnWidthForRange(10, 4, 11);
        $writer->addRow(Row::fromValuesWithStyle(['Kontingen', 'Kategori', 'Region', 'PBB', 'Danton', 'Vafor', 'Kostum', 'Makeup', 'Penalty', 'Bonus', 'Grand Total'], $headerStyle));
        Contingent::where('event_id', $event->id)->with('scores')->each(function ($c) use ($writer) {
            $s = $c->scores->first();
            $writer->addRow(Row::fromValues([
                $c->school_name, $c->category_type, $c->region,
                $s?->pbb_score ?? 0, $s?->danton_score ?? 0, $s?->vafor_score ?? 0,
                $s?->kostum_score ?? 0, $s?->makeup_score ?? 0, $s?->penalties_score ?? 0,
                $s?->nilai_kontingen_bonus ?? 0, $s?->grand_total ?? 0,
            ]));
        });

        // Sheet 5: Final Round
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Final Round');
        $sheet->setColumnWidthForRange(30, 1, 1);
        $sheet->setColumnWidthForRange(15, 2, 2);
        $sheet->setColumnWidthForRange(12, 3, 8);
        $writer->addRow(Row::fromValuesWithStyle(['Kontingen', 'Kategori', 'Juri 1', 'Juri 2', 'Juri 3', 'Penalty', 'Voting Bonus', 'Total'], $headerStyle));
        Contingent::where('event_id', $event->id)->with('scoresFinalRound')->each(function ($c) use ($writer) {
            $f = $c->scoresFinalRound->first();
            $writer->addRow(Row::fromValues([
                $c->school_name, $c->category_type,
                $f?->score_juri_1 ?? 0, $f?->score_juri_2 ?? 0, $f?->score_juri_3 ?? 0,
                $f?->penalties ?? 0, $f?->voting_bonus ?? 0, $f?->total_score ?? 0,
            ]));
        });

        // Sheet 6: Daftar Juara (Juknis logic)
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Daftar Juara');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 2);
        $sheet->setColumnWidthForRange(35, 3, 3);
        $sheet->setColumnWidthForRange(15, 4, 4);
        $writer->addRow(Row::fromValuesWithStyle(['Kategori', 'Juara', 'Kontingen', 'Skor PBB+Danton+Vafor-Penalti'], $headerStyle));
        $categories = ['U12', 'U16', 'U19', 'Purna'];
        foreach ($categories as $cat) {
            $contingents = Contingent::where('event_id', $event->id)->where('category_type', $cat)
                ->with('scores')->get()->map(function ($c) {
                    $s = $c->scores->first();
                    $juaraScore = $s ? ((float) $s->pbb_score + (float) $s->danton_score + (float) $s->vafor_score - (float) $s->penalties_score) : 0;
                    $c->juara_score = max($juaraScore, 0);
                    return $c;
                })->sortByDesc('juara_score')->values();

            if (in_array($cat, ['U16', 'U19'])) {
                $selectionScores = $contingents->map(function ($c) {
                    return $c->juara_score;
                })->toArray();

                $finalScores = ScoreFinalRound::where('event_id', $event->id)
                    ->get()->keyBy('contingent_id');

                $finalistIds = collect($selectionScores)->sortDesc()->keys()->take(2);

                $finalistData = $finalistIds->map(function ($idx) use ($contingents, $finalScores) {
                    $c = $contingents[$idx];
                    $f = $finalScores->get($c->id);
                    $total = $f ? (float) $f->total_score : 0;
                    return ['contingent' => $c, 'total' => $total];
                })->sortByDesc('total')->values();

                $writer->addRow(Row::fromValues([$cat, 'Juara Grand Final 1', $finalistData[0]['contingent']->school_name ?? '-', $finalistData[0]['total'] ?? 0]));
                $writer->addRow(Row::fromValues([$cat, 'Juara Grand Final 2', $finalistData[1]['contingent']->school_name ?? '-', $finalistData[1]['total'] ?? 0]));

                $filtered = $contingents->filter(fn($c) => !$finalistIds->contains(fn($idx) => $contingents[$idx]->id === $c->id))->values();
                $juaraTitles = ['Utama 1', 'Utama 2', 'Utama 3'];
                foreach ($filtered->take(3) as $i => $c) {
                    $writer->addRow(Row::fromValues([$cat, $juaraTitles[$i] ?? "Utama " . ($i+1), $c->school_name, $c->juara_score]));
                }
            } else {
                $juaraTitles = ['Utama 1', 'Utama 2', 'Utama 3', 'Harapan 1', 'Harapan 2'];
                foreach ($contingents->take(5) as $i => $c) {
                    $writer->addRow(Row::fromValues([$cat, $juaraTitles[$i] ?? "Juara " . ($i+1), $c->school_name, $c->juara_score]));
                }
            }
        }

        // Sheet 7: Vote Log
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Vote Log');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(35, 2, 2);
        $sheet->setColumnWidthForRange(20, 3, 3);
        $writer->addRow(Row::fromValuesWithStyle(['Tiket', 'Kontingen', 'Waktu'], $headerStyle));
        VoteLog::where('event_id', $event->id)->chunk(200, function ($votes) use ($writer) {
            foreach ($votes as $v) {
                $writer->addRow(Row::fromValues([$v->issued_ticket_id, $v->contingent?->school_name, $v->created_at->format('d M Y H:i')]));
            }
        });

        // Sheet 8: Supporter Log
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Supporter Log');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(35, 2, 2);
        $sheet->setColumnWidthForRange(15, 3, 3);
        $sheet->setColumnWidthForRange(20, 4, 4);
        $writer->addRow(Row::fromValuesWithStyle(['Tiket', 'Kontingen', 'Hari', 'Waktu'], $headerStyle));
        SupporterLog::where('event_id', $event->id)->chunk(200, function ($supporters) use ($writer) {
            foreach ($supporters as $s) {
                $writer->addRow(Row::fromValues([$s->issued_ticket_id, $s->contingent?->school_name, $s->day_number, $s->created_at->format('d M Y H:i')]));
            }
        });

        // Sheet 9: Merchandise
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Merchandise');
        $sheet->setColumnWidthForRange(30, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 2);
        $sheet->setColumnWidthForRange(10, 3, 3);
        $sheet->setColumnWidthForRange(15, 4, 4);
        $sheet->setColumnWidthForRange(20, 5, 5);
        $writer->addRow(Row::fromValuesWithStyle(['Kontingen', 'Pembeli', 'Qty', 'Total', 'Tanggal'], $headerStyle));
        MerchandiseSale::where('event_id', $event->id)->chunk(200, function ($items) use ($writer) {
            foreach ($items as $m) {
                $writer->addRow(Row::fromValues([$m->contingent?->school_name, $m->buyer_name, $m->qty, number_format($m->total_price, 0, ',', '.'), $m->created_at->format('d M Y H:i')]));
            }
        });

        // Sheet 10: Sosmed Likes
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Sosmed Likes');
        $sheet->setColumnWidthForRange(35, 1, 1);
        $sheet->setColumnWidthForRange(15, 2, 3);
        $writer->addRow(Row::fromValuesWithStyle(['Kontingen', 'Likes Reels', 'Likes Posts'], $headerStyle));
        SocialMediaLike::whereHas('contingent', fn($q) => $q->where('event_id', $event->id))
            ->chunk(200, function ($likes) use ($writer) {
                foreach ($likes as $l) {
                    $writer->addRow(Row::fromValues([$l->contingent?->school_name, $l->likes_count_reels, $l->likes_count_posts]));
                }
            });

        // Sheet 11: Users
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Users');
        $sheet->setColumnWidthForRange(25, 1, 1);
        $sheet->setColumnWidthForRange(30, 2, 2);
        $sheet->setColumnWidthForRange(15, 3, 3);
        $sheet->setColumnWidthForRange(20, 4, 4);
        $sheet->setColumnWidthForRange(15, 5, 5);
        $sheet->setColumnWidthForRange(20, 6, 6);
        $writer->addRow(Row::fromValuesWithStyle(['Nama', 'Email', 'Role', 'Last Login', 'Last IP', 'Tanggal Daftar'], $headerStyle));
        User::chunk(200, function ($users) use ($writer) {
            foreach ($users as $u) {
                $writer->addRow(Row::fromValues([
                    $u->name, $u->email, $u->role,
                    $u->last_login_at ? date('d M Y H:i', strtotime((string) $u->last_login_at)) : '', $u->last_login_ip,
                    $u->created_at ? date('d M Y H:i', strtotime((string) $u->created_at)) : '',
                ]));
            }
        });

        // Sheet 12: Rekap Nilai Detail
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Rekap Nilai Detail');
        $sheet->setColumnWidthForRange(5, 1, 1);
        $sheet->setColumnWidthForRange(35, 2, 2);
        $sheet->setColumnWidthForRange(12, 3, 4);
        $sheet->setColumnWidthForRange(8, 5, 28);

        $section1Header = [
            'No', 'Kontingen', 'Kategori', 'Region',
            'J1 PBB', 'J1 Danton', 'J2 PBB', 'J2 Danton', 'J3 PBB', 'J3 Danton',
            'V1 Variasi', 'V1 Formasi', 'V1 DantonVafor',
            'V2 Variasi', 'V2 Formasi', 'V2 DantonVafor',
            'MK1 Kostum', 'MK1 Makeup', 'MK2 Kostum', 'MK2 Makeup',
            'Total PBB', 'Total Danton', 'Total Vafor', 'Total Kostum', 'Total Makeup',
            'Penalty', 'Bonus', 'Grand Total',
        ];

        $writer->addRow(Row::fromValuesWithStyle(['Rekap Nilai Detail - ' . $event->name], $headerStyle));
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyle(['A. RINGKASAN NILAI PER KONTINGEN'], $headerStyle));
        $writer->addRow(Row::fromValuesWithStyle($section1Header, $headerStyle));

        $no = 1;
        $grandTotalSum = 0;

        Contingent::where('event_id', $event->id)
            ->with(['scores', 'juryScores'])
            ->chunk(200, function ($contingents) use ($writer, &$no, &$grandTotalSum) {
                foreach ($contingents as $c) {
                    $s = $c->scores->first();
                    $juryScores = $c->juryScores;

                    $j1Pbb = $j1Danton = $j2Pbb = $j2Danton = $j3Pbb = $j3Danton = 0;
                    $v1Variasi = $v1Formasi = $v1DantonVafor = 0;
                    $v2Variasi = $v2Formasi = $v2DantonVafor = 0;
                    $mk1Kostum = $mk1Makeup = $mk2Kostum = $mk2Makeup = 0;

                    foreach ($juryScores as $js) {
                        switch ($js->jury_type) {
                            case 'pbb':
                                $p = (float) ($js->pbb_score ?? 0);
                                $d = (float) ($js->danton_score ?? 0);
                                if ($js->jury_number === 1) { $j1Pbb = $p; $j1Danton = $d; }
                                elseif ($js->jury_number === 2) { $j2Pbb = $p; $j2Danton = $d; }
                                elseif ($js->jury_number === 3) { $j3Pbb = $p; $j3Danton = $d; }
                                break;
                            case 'vafor':
                                $v = $js->variasi_details ? collect($js->variasi_details)->sum() : 0;
                                $f = $js->formasi_details ? collect($js->formasi_details)->sum() : 0;
                                $dv = $js->danton_vafor_details ? collect($js->danton_vafor_details)->sum() : 0;
                                if ($js->jury_number === 1) { $v1Variasi = $v; $v1Formasi = $f; $v1DantonVafor = $dv; }
                                elseif ($js->jury_number === 2) { $v2Variasi = $v; $v2Formasi = $f; $v2DantonVafor = $dv; }
                                break;
                            case 'makeup_kostum':
                                $k = (float) ($js->kostum_score ?? 0);
                                $m = (float) ($js->makeup_score ?? 0);
                                if ($js->jury_number === 1) { $mk1Kostum = $k; $mk1Makeup = $m; }
                                elseif ($js->jury_number === 2) { $mk2Kostum = $k; $mk2Makeup = $m; }
                                break;
                        }
                    }

                    $totalPbb = $j1Pbb + $j2Pbb + $j3Pbb;
                    $totalDanton = $j1Danton + $j2Danton + $j3Danton;
                    $totalVafor = $v1Variasi + $v1Formasi + $v1DantonVafor + $v2Variasi + $v2Formasi + $v2DantonVafor;
                    $totalKostum = $mk1Kostum + $mk2Kostum;
                    $totalMakeup = $mk1Makeup + $mk2Makeup;

                    $penalty = (float) ($s->penalties_score ?? 0);
                    $bonus = (float) ($s->nilai_kontingen_bonus ?? 0);
                    $grandTotal = (float) ($s->grand_total ?? 0);
                    $grandTotalSum += $grandTotal;

                    $writer->addRow(Row::fromValues([
                        $no++, $c->school_name, $c->category_type, $c->region,
                        $j1Pbb, $j1Danton, $j2Pbb, $j2Danton, $j3Pbb, $j3Danton,
                        $v1Variasi, $v1Formasi, $v1DantonVafor,
                        $v2Variasi, $v2Formasi, $v2DantonVafor,
                        $mk1Kostum, $mk1Makeup, $mk2Kostum, $mk2Makeup,
                        $totalPbb, $totalDanton, $totalVafor, $totalKostum, $totalMakeup,
                        $penalty, $bonus, $grandTotal,
                    ]));
                }
            });

        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyle(['GRAND TOTAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', $grandTotalSum], $headerStyle));

        // Section B: Detail PBB per Juri
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyle(['B. DETAIL PBB PER JURI'], $headerStyle));

        $movements31 = [
            'Berhimpun', 'Berkumpul (Bersaf)', 'Istirahat (Di Tempat)', 'Sikap Sempurna',
            'Setengah Lengan Lencang Kiri', 'Hormat', 'Lencang Kiri', 'Hitung',
            'Parade Periksa Kerapian', '3 Langkah Ke Belakang', 'Hadap Kiri Jalan (Di Tempat)',
            'Balik Kanan (Henti)', '3 Langkah Ke Depan', '4 Langkah Ke Kanan', 'Lencang Depan',
            'Hadap Kiri', 'Langkah Perlahan Maju', 'Hadap Kiri Maju (Langkah Biasa)',
            'Ganti Langkah 1', 'Melintang Kiri', 'Balik Kanan (Maju)', 'Hormat Kanan',
            'Ganti Langkah 2', 'Langkah Tegap Ke Langkah Biasa', 'Hadap Kanan Maju',
            'Belok Kanan', 'Lari', '2 Kali Belok Kanan', 'Hadap Kiri Maju', 'Henti', 'Bubar',
        ];

        $movements23 = [
            'Berkumpul (Bersaf)', 'Sikap Sempurna', 'Setengah Lengan Lencang Kiri', 'Hormat',
            'Lencang Kiri', 'Hitung', 'Parade Periksa Kerapian', 'Hadap Kiri (Jalan Di Tempat)',
            'Balik Kanan Henti', '3 Langkah Ke Belakang', '3 Langkah Ke Depan', '3 Langkah Ke Kanan',
            'Lencang Depan', 'Langkah Biasa', 'Ganti Langkah', 'Belok Kanan', 'Hadap Kanan Maju',
            'Haluan Kanan Maju', 'Hadap Kiri Maju', '2 Kali Belok Kiri', 'Hadap Kiri Henti',
            'Langkah Perlahan', 'Bubar',
        ];

        $allContingents = Contingent::where('event_id', $event->id)
            ->with('juryScores')
            ->get()
            ->sortBy(function ($c) {
                $order = ['U12' => 0, 'U16' => 1, 'U19' => 2, 'Purna' => 3];
                return $order[$c->category_type] ?? 99;
            });

        $categoryGroups = $allContingents->groupBy(function ($c) {
            return $c->category_type === 'U12' ? 'U12' : 'NonU12';
        });

        foreach ($categoryGroups as $group => $items) {
            $movements = $group === 'U12' ? $movements23 : $movements31;

            $writer->addRow(Row::fromValues([]));
            $writer->addRow(Row::fromValuesWithStyle(
                array_merge(['Kontingen', 'Kategori', 'Juri'], $movements, ['Total']),
                $headerStyle
            ));

            foreach ($items as $c) {
                $juryScores = $c->juryScores->where('jury_type', 'pbb');

                foreach ([1, 2, 3] as $juryNum) {
                    $js = $juryScores->firstWhere('jury_number', $juryNum);

                    $rowData = [$c->school_name, $c->category_type, "Juri $juryNum"];
                    $totalPbb = 0;

                    foreach ($movements as $idx => $movement) {
                        $key = $movement . '_' . $idx;
                        $score = 0;
                        if ($js && $js->pbb_details) {
                            $details = $js->pbb_details;
                            $score = (float) ($details[$key] ?? $details[$movement] ?? 0);
                        }
                        $rowData[] = $score;
                        $totalPbb += $score;
                    }

                    $rowData[] = $totalPbb;
                    $writer->addRow(Row::fromValues($rowData));
                }
            }
        }

        $writer->close();

        return response()->download($filePath)->deleteFileAfterSend(true);
    }
}
