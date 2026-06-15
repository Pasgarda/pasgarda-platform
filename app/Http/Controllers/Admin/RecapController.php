<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contingent;
use App\Models\Event;
use App\Models\IssuedTicket;
use App\Models\JuryScore;
use App\Models\MerchandiseSale;
use App\Models\Order;
use App\Models\Score;
use App\Models\ScoreFinalRound;
use App\Models\SocialMediaLike;
use App\Models\SupporterLog;
use App\Models\TicketPackage;
use App\Models\User;
use App\Models\VoteLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use OpenSpout\Writer\XLSX\Writer;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;

class RecapController extends Controller
{
    public function index($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        // 1. Keuangan
        $totalRevenue = (float) Order::where('event_id', $event->id)->where('payment_status', 'paid')->sum('total_price');
        $merchRevenue = (float) MerchandiseSale::where('event_id', $event->id)->sum('total_price');
        $paidOrders = Order::where('event_id', $event->id)->where('payment_status', 'paid')->count();
        $pendingOrders = Order::where('event_id', $event->id)->where('payment_status', 'pending')->count();

        // 2. Tiket
        $totalOnline = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_method', '!=', 'OTS')->where('payment_status', 'paid'))->count();
        $totalOts = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_method', 'OTS'))->count();
        $checkedIn = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))->where('check_in_status', true)->count();

        // Per-package breakdown
        $packageBreakdown = TicketPackage::where('event_id', $event->id)->where('is_active', true)->get()->map(function ($pkg) {
            $qty = IssuedTicket::where('ticket_package_id', $pkg->id)
                ->whereHas('order', fn($q) => $q->where('payment_status', 'paid'))
                ->count();
            return [
                'name' => $pkg->name,
                'type' => $pkg->type,
                'price' => (float) $pkg->price,
                'sold' => $qty,
                'revenue' => $qty * (float) $pkg->price,
            ];
        });

        // 3. Kontingen
        $contingentStats = [
            'total' => Contingent::where('event_id', $event->id)->count(),
            'verified' => Contingent::where('event_id', $event->id)->where('status', 'verified')->count(),
            'by_category' => Contingent::where('event_id', $event->id)
                ->selectRaw('category_type, COUNT(*) as total')
                ->groupBy('category_type')
                ->pluck('total', 'category_type'),
        ];

        // 4. Voting
        $totalVotes = VoteLog::where('event_id', $event->id)->count();
        $votesDay1 = VoteLog::where('event_id', $event->id)
            ->whereHas('issuedTicket.order.contingent', function ($q) {
                $q->whereIn('category_type', ['U16', 'Purna']);
            })->count();
        $votesDay2 = VoteLog::where('event_id', $event->id)
            ->whereHas('issuedTicket.order.contingent', function ($q) {
                $q->whereIn('category_type', ['U12', 'U19']);
            })->count();
        $topVoted = VoteLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, COUNT(*) as total')
            ->groupBy('contingent_id')
            ->orderByDesc('total')
            ->take(5)
            ->with('contingent')
            ->get()
            ->map(fn($v) => [
                'school_name' => $v->contingent?->school_name ?? 'Unknown',
                'total' => $v->total,
            ]);

        // 5. Supporter
        $totalSupporters = SupporterLog::where('event_id', $event->id)->count();
        $onlineSupporterLimit = $event->online_ticket_limit ?? 700;

        $topSupported = SupporterLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, COUNT(*) as total')
            ->groupBy('contingent_id')
            ->orderByDesc('total')
            ->take(5)
            ->with('contingent')
            ->get()
            ->map(fn($v) => [
                'school_name' => $v->contingent?->school_name ?? 'Unknown',
                'total' => $v->total,
            ]);

        // 6. Penilaian
        $categories = ['U12', 'U16', 'U19', 'Purna'];
        $scoringStats = [];
        foreach ($categories as $cat) {
            $contingents = Contingent::where('event_id', $event->id)->where('category_type', $cat)->pluck('id');
            $scored = Score::whereIn('contingent_id', $contingents)->count();
            $juryEntries = JuryScore::whereIn('contingent_id', $contingents)->count();
            $finalEntered = ScoreFinalRound::whereIn('contingent_id', $contingents)->count();
            $scoringStats[$cat] = [
                'total' => $contingents->count(),
                'scored' => $scored,
                'jury_entries' => $juryEntries,
                'final_entered' => $finalEntered,
            ];
        }

        // 6b. Recent Orders
        $recentOrders = Order::where('event_id', $event->id)
            ->with('user:id,name')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'order_id' => $o->midtrans_transaction_id,
                'buyer_name' => $o->user?->name ?? 'Unknown',
                'total_price' => (float) $o->total_price,
                'payment_status' => $o->payment_status,
                'payment_method' => $o->payment_method,
                'created_at' => $o->created_at->format('d M H:i'),
            ]);

        // 7. Pengguna
        $userStats = [
            'total' => User::count(),
            'by_role' => User::selectRaw('role, COUNT(*) as total')->groupBy('role')->pluck('total', 'role'),
        ];

        // 8. Sosmed
        $totalLikes = SocialMediaLike::whereHas('contingent', fn($q) => $q->where('event_id', $event->id))
            ->selectRaw('COALESCE(SUM(likes_count_reels), 0) + COALESCE(SUM(likes_count_posts), 0) as total')
            ->value('total');

        return Inertia::render('Admin/Recap', [
            'event' => $event,
            'revenue' => [
                'total' => $totalRevenue,
                'merch' => $merchRevenue,
                'grand_total' => $totalRevenue + $merchRevenue,
            ],
            'orders' => [
                'paid' => $paidOrders,
                'pending' => $pendingOrders,
            ],
            'tickets' => [
                'online' => $totalOnline,
                'ots' => $totalOts,
                'checked_in' => $checkedIn,
                'online_limit' => $onlineSupporterLimit,
            ],
            'packageBreakdown' => $packageBreakdown,
            'contingentStats' => $contingentStats,
            'votes' => [
                'total' => $totalVotes,
                'day1' => $votesDay1,
                'day2' => $votesDay2,
                'top5' => $topVoted,
            ],
            'supporters' => [
                'total' => $totalSupporters,
                'top5' => $topSupported,
            ],
            'scoring' => $scoringStats,
            'users' => $userStats,
            'totalLikes' => $totalLikes,
            'recentOrders' => $recentOrders,
            'eventSettings' => [
                'leaderboard_status' => $event->leaderboard_status,
                'voting_day_1_status' => $event->voting_day_1_status ?? 'active',
                'voting_day_2_status' => $event->voting_day_2_status ?? 'active',
                'online_ticket_limit' => $event->online_ticket_limit ?? 700,
                'max_tickets_per_user' => $event->max_tickets_per_user,
            ],
        ]);
    }

    public function exportExcel($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $totalRevenue = (float) Order::where('event_id', $event->id)->where('payment_status', 'paid')->sum('total_price');
        $merchRevenue = (float) MerchandiseSale::where('event_id', $event->id)->sum('total_price');
        $paidOrders = Order::where('event_id', $event->id)->where('payment_status', 'paid')->count();
        $pendingOrders = Order::where('event_id', $event->id)->where('payment_status', 'pending')->count();

        $totalOnline = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_method', '!=', 'OTS')->where('payment_status', 'paid'))->count();
        $totalOts = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_method', 'OTS'))->count();
        $checkedIn = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))->where('check_in_status', true)->count();

        $packageBreakdown = TicketPackage::where('event_id', $event->id)->where('is_active', true)->get()->map(function ($pkg) {
            $qty = IssuedTicket::where('ticket_package_id', $pkg->id)
                ->whereHas('order', fn($q) => $q->where('payment_status', 'paid'))
                ->count();
            return ['name' => $pkg->name, 'type' => $pkg->type, 'price' => (float) $pkg->price, 'sold' => $qty, 'revenue' => $qty * (float) $pkg->price];
        });

        $contingentByCategory = Contingent::where('event_id', $event->id)
            ->selectRaw('category_type, COUNT(*) as total, SUM(CASE WHEN status = \'verified\' THEN 1 ELSE 0 END) as verified')
            ->groupBy('category_type')
            ->get();

        $totalVotes = VoteLog::where('event_id', $event->id)->count();
        $totalSupporters = SupporterLog::where('event_id', $event->id)->count();

        $topVoted = VoteLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, COUNT(*) as total')
            ->groupBy('contingent_id')->orderByDesc('total')->take(5)
            ->with('contingent')->get()
            ->map(fn($v) => ['school_name' => $v->contingent?->school_name ?? 'Unknown', 'total' => $v->total]);

        $topSupported = SupporterLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, COUNT(*) as total')
            ->groupBy('contingent_id')->orderByDesc('total')->take(5)
            ->with('contingent')->get()
            ->map(fn($v) => ['school_name' => $v->contingent?->school_name ?? 'Unknown', 'total' => $v->total]);

        $userByRole = User::selectRaw('role, COUNT(*) as total')->groupBy('role')->pluck('total', 'role');
        $totalLikes = SocialMediaLike::whereHas('contingent', fn($q) => $q->where('event_id', $event->id))
            ->selectRaw('COALESCE(SUM(likes_count_reels), 0) + COALESCE(SUM(likes_count_posts), 0) as total')->value('total');

        $recentOrders = Order::where('event_id', $event->id)
            ->with('user:id,name')->latest()->take(10)->get()
            ->map(fn($o) => [
                'id' => $o->id, 'order_id' => $o->midtrans_transaction_id,
                'buyer_name' => $o->user?->name ?? 'Unknown',
                'total_price' => (float) $o->total_price,
                'payment_status' => $o->payment_status,
                'payment_method' => $o->payment_method,
                'created_at' => $o->created_at->format('d M H:i'),
            ]);

        $categories = ['U12', 'U16', 'U19', 'Purna'];
        $scoringStats = [];
        foreach ($categories as $cat) {
            $cids = Contingent::where('event_id', $event->id)->where('category_type', $cat)->pluck('id');
            $scoringStats[$cat] = [
                'total' => $cids->count(),
                'scored' => Score::whereIn('contingent_id', $cids)->count(),
                'jury_entries' => JuryScore::whereIn('contingent_id', $cids)->count(),
                'final_entered' => ScoreFinalRound::whereIn('contingent_id', $cids)->count(),
            ];
        }

        $writer = new Writer();
        $writer->openToBrowser("recap_{$event->slug}.xlsx");

        $headerStyle = new Style(
            fontBold: true,
            fontColor: Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: CellAlignment::CENTER,
        );

        // Sheet 1: Overview
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Overview');
        $sheet->setColumnWidthForRange(25, 1, 1);
        $sheet->setColumnWidthForRange(15, 2, 2);

        $writer->addRow(Row::fromValuesWithStyle(["REKAPAN DATA — {$event->name}"], $headerStyle));
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyle(['Metrik', 'Nilai'], $headerStyle));
        $writer->addRow(Row::fromValues(['Total Pendapatan', "Rp " . number_format($totalRevenue + $merchRevenue, 0, ',', '.')]));
        $writer->addRow(Row::fromValues(['Pendapatan Tiket', "Rp " . number_format($totalRevenue, 0, ',', '.')]));
        $writer->addRow(Row::fromValues(['Pendapatan Merch', "Rp " . number_format($merchRevenue, 0, ',', '.')]));
        $writer->addRow(Row::fromValues(['Pesanan Lunas', $paidOrders]));
        $writer->addRow(Row::fromValues(['Pesanan Pending', $pendingOrders]));
        $writer->addRow(Row::fromValues(['Tiket Online Terjual', $totalOnline]));
        $writer->addRow(Row::fromValues(['Tiket OTS', $totalOts]));
        $writer->addRow(Row::fromValues(['Check-In', $checkedIn]));
        $writer->addRow(Row::fromValues(['Total Kontingen', Contingent::where('event_id', $event->id)->count()]));
        $writer->addRow(Row::fromValues(['Total Suara Voting', $totalVotes]));
        $writer->addRow(Row::fromValues(['Total Supporters', $totalSupporters]));
        $writer->addRow(Row::fromValues(['Total Likes Sosmed', $totalLikes]));
        $writer->addRow(Row::fromValues(['Total Pengguna', User::count()]));

        // Sheet 2: Tiket
        $writer->addNewSheetAndMakeItCurrent();
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Tiket');
        $sheet->setColumnWidthForRange(25, 1, 1);
        $sheet->setColumnWidthForRange(15, 2, 2);
        $sheet->setColumnWidthForRange(15, 3, 3);
        $sheet->setColumnWidthForRange(15, 4, 4);

        $writer->addRow(Row::fromValuesWithStyle(['Paket', 'Tipe', 'Harga', 'Terjual', 'Pendapatan'], $headerStyle));
        foreach ($packageBreakdown as $pkg) {
            $writer->addRow(Row::fromValues([$pkg['name'], $pkg['type'], $pkg['price'], $pkg['sold'], $pkg['revenue']]));
        }

        // Sheet 3: Kontingen
        $writer->addNewSheetAndMakeItCurrent();
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Kontingen');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(10, 2, 2);
        $sheet->setColumnWidthForRange(10, 3, 3);

        $writer->addRow(Row::fromValuesWithStyle(['Kategori', 'Total', 'Terverifikasi'], $headerStyle));
        foreach ($contingentByCategory as $c) {
            $writer->addRow(Row::fromValues([$c->category_type, $c->total, $c->verified]));
        }

        // Sheet 4: Voting & Supporter
        $writer->addNewSheetAndMakeItCurrent();
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Voting & Supporter');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(30, 2, 2);
        $sheet->setColumnWidthForRange(10, 3, 3);

        $writer->addRow(Row::fromValuesWithStyle(['TOP 5 VOTING'], $headerStyle));
        $writer->addRow(Row::fromValuesWithStyle(['Rank', 'Kontingen', 'Suara'], $headerStyle));
        foreach ($topVoted as $i => $v) {
            $writer->addRow(Row::fromValues([$i + 1, $v['school_name'], $v['total']]));
        }

        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValuesWithStyle(['TOP 5 SUPPORTER'], $headerStyle));
        $writer->addRow(Row::fromValuesWithStyle(['Rank', 'Kontingen', 'Total'], $headerStyle));
        foreach ($topSupported as $i => $v) {
            $writer->addRow(Row::fromValues([$i + 1, $v['school_name'], $v['total']]));
        }

        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValues(['Total Voting', $totalVotes]));
        $writer->addRow(Row::fromValues(['Total Supporter', $totalSupporters]));

        // Sheet 5: Penilaian
        $writer->addNewSheetAndMakeItCurrent();
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Penilaian');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(10, 2, 2);
        $sheet->setColumnWidthForRange(10, 3, 3);
        $sheet->setColumnWidthForRange(15, 4, 4);
        $sheet->setColumnWidthForRange(15, 5, 5);

        $catLabelMap = ['U12' => 'SD (U12)', 'U16' => 'SMP (U16)', 'U19' => 'SMA (U19)', 'Purna' => 'Purna'];
        $writer->addRow(Row::fromValuesWithStyle(['Kategori', 'Total', 'Dinilai', 'Entri Juri', 'Final'], $headerStyle));
        foreach ($scoringStats as $cat => $stat) {
            $writer->addRow(Row::fromValues([$catLabelMap[$cat] ?? $cat, $stat['total'], $stat['scored'], $stat['jury_entries'], $stat['final_entered']]));
        }

        // Sheet 6: Pesanan Terbaru
        $writer->addNewSheetAndMakeItCurrent();
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Pesanan Terbaru');
        $sheet->setColumnWidthForRange(10, 1, 1);
        $sheet->setColumnWidthForRange(20, 2, 2);
        $sheet->setColumnWidthForRange(15, 3, 3);
        $sheet->setColumnWidthForRange(12, 4, 4);
        $sheet->setColumnWidthForRange(12, 5, 5);
        $sheet->setColumnWidthForRange(15, 6, 6);

        $writer->addRow(Row::fromValuesWithStyle(['ID', 'Order ID', 'Pembeli', 'Total', 'Status', 'Metode', 'Tanggal'], $headerStyle));
        foreach ($recentOrders as $o) {
            $writer->addRow(Row::fromValues([$o['id'], $o['order_id'], $o['buyer_name'], $o['total_price'], $o['payment_status'], $o['payment_method'], $o['created_at']]));
        }

        // Sheet 7: Pengguna
        $writer->addNewSheetAndMakeItCurrent();
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Pengguna');
        $sheet->setColumnWidthForRange(20, 1, 1);
        $sheet->setColumnWidthForRange(10, 2, 2);

        $writer->addRow(Row::fromValuesWithStyle(['Role', 'Jumlah'], $headerStyle));
        $writer->addRow(Row::fromValues(['Total', User::count()]));
        foreach ($userByRole as $role => $count) {
            $writer->addRow(Row::fromValues([$role, $count]));
        }

        $writer->close();
    }
}
