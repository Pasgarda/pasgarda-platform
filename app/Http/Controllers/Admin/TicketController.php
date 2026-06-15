<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessScoreAggregationJob;
use App\Jobs\SendEmailJob;
use App\Models\Contingent;
use App\Models\Event;
use App\Models\Order;
use App\Models\IssuedTicket;
use App\Models\Score;
use App\Models\SupporterLog;
use App\Models\TicketPackage;
use App\Models\VoteLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Closure;

class TicketController extends Controller
{
    public function showTicketDetail($qrHash)
    {
        $ticket = IssuedTicket::with(['ticketPackage', 'order.event'])
            ->where('unique_qr_hash', $qrHash)
            ->firstOrFail();

        $event = $ticket->order->event;
        $package = $ticket->ticketPackage;
        $isOwner = Auth::check() && Auth::id() === $ticket->order->user_id;
        $ticketNumber = IssuedTicket::where('order_id', $ticket->order->id)
            ->where('id', '<=', $ticket->id)
            ->count();

        // Other tickets by the same buyer for this event
        $otherTickets = IssuedTicket::with(['ticketPackage', 'order'])
            ->whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
            ->where('buyer_name', $ticket->buyer_name)
            ->where('id', '!=', $ticket->id)
            ->latest()
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'order_id' => $t->order->id,
                'order_created_at' => $t->order->created_at->format('d M Y H:i'),
                'package_name' => $t->ticketPackage?->name ?? '-',
                'qr_hash' => $t->unique_qr_hash,
                'check_in_status' => $t->check_in_status,
                'created_at' => $t->created_at->format('d M Y H:i'),
            ]);

        return Inertia::render('Event/TicketDetail', [
            'ticket' => [
                'order_id' => $ticket->order->id,
                'ticket_number' => $ticketNumber,
                'buyer_name' => $ticket->buyer_name,
                'buyer_email' => $ticket->buyer_email,
                'package_name' => $package->name,
                'package_price' => (float) $package->price,
                'validity_days' => $package->validity_days,
                'days_remaining' => $ticket->days_remaining,
                'vote_tokens_remaining' => $ticket->vote_tokens_remaining,
                'coupon_tokens_remaining' => $ticket->coupon_tokens_remaining,
                'sharing_tokens_remaining' => $ticket->sharing_tokens_remaining,
                'supporter_tokens_remaining' => $ticket->supporter_tokens_remaining,
                'check_in_status' => $ticket->check_in_status,
                'checked_in_at' => $ticket->checked_in_at?->format('d M Y H:i:s'),
                'qr_hash' => $ticket->unique_qr_hash,
                'package_type' => $package->type ?? 'online',
            ],
            'event' => [
                'name' => $event->name,
                'slug' => $event->slug,
                'venue' => $event->venue,
                'date_start' => $event->date_start->format('d M Y'),
                'date_end' => $event->date_end->format('d M Y'),
            ],
            'otherTickets' => $otherTickets,
            'isOwner' => $isOwner,
        ]);
    }


    public function showOtsPanel(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $packages = TicketPackage::where('event_id', $event->id)->whereIn('type', ['ots', 'online'])->where('is_active', true)->get();

        // Get paginated scanned tickets (OTS + Online that have been checked in)
        $ticketsQuery = IssuedTicket::with(['order', 'ticketPackage', 'voteLogs.contingent', 'supporterLogs.contingent'])
            ->where('check_in_status', true)
            ->whereHas('order', function ($q) use ($event) {
                $q->where('event_id', $event->id)->where('payment_status', 'paid');
            });

        if ($search = $request->query('search')) {
            $ticketsQuery->where(function ($q) use ($search) {
                $q->where('buyer_name', 'like', "%{$search}%")
                  ->orWhere('unique_qr_hash', 'like', "%{$search}%");
            });
        }

        $recentTickets = $ticketsQuery->orderBy('checked_in_at', 'desc')->paginate(10)->withQueryString();

        // Get recent check-ins grouped by day
        $dailyCheckins = IssuedTicket::where('check_in_status', true)
            ->whereHas('order', function ($q) use ($event) {
                $q->where('event_id', $event->id)->where('payment_status', 'paid');
            })
            ->selectRaw('DATE(checked_in_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($item) use ($event) {
                $latest = IssuedTicket::where('check_in_status', true)
                    ->whereHas('order', function ($q) use ($event) {
                        $q->where('event_id', $event->id)->where('payment_status', 'paid');
                    })
                    ->whereDate('checked_in_at', $item->date)
                    ->orderBy('checked_in_at', 'desc')
                    ->get(['buyer_name', 'checked_in_at', 'unique_qr_hash']);
                return [
                    'date' => \Carbon\Carbon::parse($item->date)->format('d M Y'),
                    'count' => $item->count,
                    'latest' => $latest->map(fn($t) => [
                        'name' => $t->buyer_name,
                        'time' => $t->checked_in_at->format('H:i'),
                        'hash' => substr($t->unique_qr_hash, 0, 8) . '...'
                    ])
                ];
            });

        // Get all contingents for vote allocation dropdown
        $contingents = Contingent::where('event_id', $event->id)
            ->orderBy('category_type')
            ->orderBy('sort_order')
            ->get(['id', 'school_name', 'region', 'category_type']);

        return Inertia::render('Admin/OtsTickets', [
            'event' => $event,
            'packages' => $packages,
            'recentTickets' => $recentTickets,
            'dailyCheckins' => $dailyCheckins,
            'contingents' => $contingents,
            'search' => $search ?? '',
        ]);
    }

    public function showPayments(Request $request, $slug)
    {
        $user = auth()->user();
        if ($user->role === 'operator_gate' && $user->email !== 'gate@pasgarda.com') {
            abort(403, 'Hanya Master Gate yang dapat mengakses halaman ini.');
        }

        $event = Event::where('slug', $slug)->firstOrFail();

        // Pending approvals (unchanged)
        $pendingApprovals = Order::where('event_id', $event->id)
            ->where('payment_status', 'pending')
            ->whereNotNull('payment_proof')
            ->with(['user', 'issuedTickets.ticketPackage'])
            ->latest()
            ->take(50)
            ->get()
            ->map(function ($order) {
                $ticketCounts = $order->issuedTickets->groupBy('ticket_package_id')->map(function ($tix) {
                    return [
                        'package_name' => $tix->first()->ticketPackage?->name ?? 'Tiket',
                        'quantity' => $tix->count(),
                        'price' => $tix->first()->ticketPackage?->price ?? 0,
                    ];
                })->values();

                return [
                    'id' => $order->id,
                    'order_id' => $order->midtrans_transaction_id,
                    'user' => [
                        'name' => $order->user?->name ?? 'Spectator',
                        'email' => $order->user?->email ?? '-',
                    ],
                    'total_price' => (float) $order->total_price,
                    'payment_status' => $order->payment_status,
                    'payment_proof' => $order->payment_proof,
                    'created_at' => $order->created_at->format('d M Y H:i'),
                    'tickets_summary' => $ticketCounts,
                ];
            });

        // All paid tickets (OTS + Online) for Riwayat Pembelian Tiket
        $ticketQuery = IssuedTicket::with([
                'ticketPackage',
                'order.user',
                'voteLogs.contingent',
                'supporterLogs.contingent',
            ])
            ->whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'));

        if ($search = $request->query('search')) {
            $ticketQuery->where(function ($q) use ($search) {
                $q->where('buyer_name', 'like', "%{$search}%")
                  ->orWhere('unique_qr_hash', 'like', "%{$search}%");
            });
        }

        $ticketHistory = $ticketQuery->latest()->paginate(10)->through(function ($t) {
            $isOts = str_starts_with($t->order?->payment_method ?? '', 'OTS');
            $otsPm = $isOts ? (str_starts_with($t->order?->payment_method ?? '', 'OTS-') ? strtolower(substr($t->order->payment_method, 4)) : 'cash') : null;

            $voteGrouped = $t->voteLogs->groupBy(fn($v) => $v->contingent?->school_name ?? 'Unknown')
                ->map(fn($logs, $name) => $name . ' (' . $logs->count() . 'x)')
                ->implode(', ');

            $supporterGrouped = $t->supporterLogs->groupBy(fn($s) => $s->contingent?->school_name ?? 'Unknown')
                ->map(fn($logs, $name) => $name . ' (' . $logs->count() . 'x)')
                ->implode(', ');

            return [
                'id' => $t->id,
                'buyer_name' => $t->buyer_name,
                'sumber' => $isOts ? 'OTS' : 'Online',
                'unique_qr_hash' => $t->unique_qr_hash,
                'package_name' => $t->ticketPackage?->name ?? '-',
                'days_remaining' => $t->days_remaining,
                'vote_tokens_remaining' => $t->vote_tokens_remaining,
                'coupon_tokens_remaining' => $t->coupon_tokens_remaining,
                'sharing_tokens_remaining' => $t->sharing_tokens_remaining,
                'vote_for' => $voteGrouped ?: '-',
                'supporter' => $supporterGrouped ?: '-',
                'total_price' => (float) ($t->order?->total_price ?? 0),
                'payment_proof' => $t->order?->payment_proof,
                'ots_payment_type' => $otsPm,
                'created_at' => $t->order?->created_at?->format('d M Y H:i') ?? $t->created_at->format('d M Y H:i'),
            ];
        });

        // Stats: revenue breakdown per package & total
        $totalRevenue = Order::where('event_id', $event->id)
            ->where('payment_status', 'paid')
            ->sum('total_price');

        $otsRevenue = Order::where('event_id', $event->id)
            ->where('payment_status', 'paid')
            ->where('payment_method', 'like', 'OTS%')
            ->sum('total_price');

        $onlineRevenue = $totalRevenue - $otsRevenue;

        $packageBreakdown = collect();
        $packages = TicketPackage::where('event_id', $event->id)->where('is_active', true)->pluck('name', 'id');
        if ($packages->isNotEmpty()) {
            $pkgRaw = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
                ->join('orders', 'issued_tickets.order_id', '=', 'orders.id')
                ->selectRaw('issued_tickets.ticket_package_id')
                ->selectRaw('COUNT(*) as total_tickets')
                ->selectRaw('SUM(orders.total_price / (SELECT COUNT(*) FROM issued_tickets it WHERE it.order_id = orders.id)) as revenue')
                ->groupBy('issued_tickets.ticket_package_id')
                ->get()
                ->keyBy('ticket_package_id');

            $packageBreakdown = $packages->map(fn($name, $id) => [
                'name' => $name,
                'total_tickets' => (int) ($pkgRaw->get($id)?->total_tickets ?? 0),
                'revenue' => (float) ($pkgRaw->get($id)?->revenue ?? 0),
            ])->values();
        }

        $totalTickets = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))->count();
        $totalOts = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_method', 'like', 'OTS%')->where('payment_status', 'paid'))->count();
        $totalOnline = $totalTickets - $totalOts;

        // Approved orders (unique online orders with payment_status = paid)
        $approvedOrders = Order::where('event_id', $event->id)
            ->where('payment_status', 'paid')
            ->where('payment_method', 'not like', 'OTS%')
            ->count();

        // Check-in / visitor count
        $checkedIn = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
            ->where('check_in_status', true)
            ->count();

        // Approval history (paid online orders with proof)
        $approvalHistory = Order::where('event_id', $event->id)
            ->where('payment_status', 'paid')
            ->where('payment_method', 'not like', 'OTS%')
            ->whereNotNull('payment_proof')
            ->with('user')
            ->latest('updated_at')
            ->take(10)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'order_id' => $o->midtrans_transaction_id,
                'buyer_name' => $o->user?->name ?? '-',
                'total_price' => (float) $o->total_price,
                'approved_at' => $o->updated_at->format('d M Y H:i'),
            ]);

        // Rejection history
        $rejectionHistory = Order::where('event_id', $event->id)
            ->where('payment_status', 'failed')
            ->whereNotNull('rejected_reason')
            ->with('user')
            ->latest('updated_at')
            ->take(10)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'order_id' => $o->midtrans_transaction_id,
                'buyer_name' => $o->user?->name ?? '-',
                'total_price' => (float) $o->total_price,
                'reason' => $o->rejected_reason,
                'rejected_at' => $o->updated_at->format('d M Y H:i'),
            ]);

        return Inertia::render('Admin/Payments', [
            'event' => $event,
            'pendingApprovals' => $pendingApprovals,
            'ticketHistory' => $ticketHistory,
            'approvalHistory' => $approvalHistory,
            'rejectionHistory' => $rejectionHistory,
            'search' => $request->query('search', ''),
            'stats' => [
                'total_tickets' => $totalTickets,
                'total_ots' => $totalOts,
                'total_online' => $totalOnline,
                'total_revenue' => (float) $totalRevenue,
                'total_ots_revenue' => (float) $otsRevenue,
                'total_online_revenue' => (float) $onlineRevenue,
                'package_breakdown' => $packageBreakdown,
                'approved_orders' => $approvedOrders,
                'checked_in' => $checkedIn,
            ],
        ]);
    }

    public function exportPaymentsCsv(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $writer = new \OpenSpout\Writer\XLSX\Writer();
        $writer->openToBrowser('payments-' . $event->slug . '-' . now()->format('Ymd_His') . '.xlsx');

        $headerStyle = new \OpenSpout\Common\Entity\Style\Style(
            fontBold: true,
            fontColor: \OpenSpout\Common\Entity\Style\Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: \OpenSpout\Common\Entity\Style\CellAlignment::CENTER,
        );

        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Payments Data');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 6);

        // ===== SECTION 1: RINGKASAN =====
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['RINGKASAN DATA TIKET'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Event:', $event->name]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Venue:', $event->venue]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Tanggal:', $event->date_start?->format('d M Y') . ' - ' . $event->date_end?->format('d M Y')]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));

        $totalOts = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_method', 'like', 'OTS%')->where('payment_status', 'paid'))->count();
        $totalOnline = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_method', 'not like', 'OTS%')->where('payment_status', 'paid'))->count();
        $totalAll = $totalOts + $totalOnline;

        $revenueOts = (float) Order::where('event_id', $event->id)->where('payment_status', 'paid')->where('payment_method', 'like', 'OTS%')->sum('total_price');
        $revenueOnline = (float) Order::where('event_id', $event->id)->where('payment_status', 'paid')->where('payment_method', 'not like', 'OTS%')->sum('total_price');
        $revenueTotal = $revenueOts + $revenueOnline;

        $pendingCount = Order::where('event_id', $event->id)->where('payment_status', 'pending')->whereNotNull('payment_proof')->count();
        $approvedCount = Order::where('event_id', $event->id)->where('payment_status', 'paid')->count();
        $rejectedCount = Order::where('event_id', $event->id)->where('payment_status', 'failed')->count();

        $checkedIn = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))->where('check_in_status', true)->count();
        $notCheckedIn = $totalAll - $checkedIn;

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['METRIK', 'NILAI'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Total Tiket OTS', $totalOts]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Total Tiket Online', $totalOnline]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Total Semua Tiket', $totalAll]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Pendapatan OTS', 'Rp ' . number_format($revenueOts, 0, ',', '.')]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Pendapatan Online', 'Rp ' . number_format($revenueOnline, 0, ',', '.')]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Total Pendapatan', 'Rp ' . number_format($revenueTotal, 0, ',', '.')]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Menunggu Verifikasi', $pendingCount]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Disetujui', $approvedCount]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Ditolak', $rejectedCount]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Telah Check-in', $checkedIn]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Belum Check-in', $notCheckedIn]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));

        // ===== SECTION 2: BREAKDOWN PER PAKET =====
        $packages = TicketPackage::where('event_id', $event->id)->where('is_active', true)->pluck('name', 'id');
        $pkgRaw = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
            ->join('orders', 'issued_tickets.order_id', '=', 'orders.id')
            ->selectRaw('issued_tickets.ticket_package_id')
            ->selectRaw("SUM(orders.payment_method LIKE 'OTS%') as ots_count")
            ->selectRaw("SUM(orders.payment_method NOT LIKE 'OTS%') as online_count")
            ->groupBy('issued_tickets.ticket_package_id')
            ->get()
            ->keyBy('ticket_package_id');

        $pkgRevenue = Order::where('event_id', $event->id)->where('payment_status', 'paid')
            ->join('issued_tickets', 'orders.id', '=', 'issued_tickets.order_id')
            ->selectRaw('issued_tickets.ticket_package_id')
            ->selectRaw("SUM(orders.total_price / (SELECT COUNT(*) FROM issued_tickets it2 WHERE it2.order_id = orders.id)) as total_revenue")
            ->selectRaw("COUNT(issued_tickets.id) as total_tickets")
            ->groupBy('issued_tickets.ticket_package_id')
            ->get()
            ->keyBy('ticket_package_id');

        if ($packages->isNotEmpty()) {
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['BREAKDOWN PER PAKET TIKET'], $headerStyle));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['Paket', 'OTS', 'Online', 'Total Tiket', 'Pendapatan'], $headerStyle));
            foreach ($packages as $id => $name) {
                $otsC = (int) ($pkgRaw->get($id)?->ots_count ?? 0);
                $onC = (int) ($pkgRaw->get($id)?->online_count ?? 0);
                $rev = (float) ($pkgRevenue->get($id)?->total_revenue ?? 0);
                $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([$name, $otsC, $onC, $otsC + $onC, 'Rp ' . number_format($rev, 0, ',', '.')]));
            }
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        }

        // ===== SECTION 3: SEMUA TIKET (SUPER DETAIL) =====
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Detail Lengkap Tiket');
        $sheet->setColumnWidthForRange(10, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 6);
        $sheet->setColumnWidthForRange(20, 7, 20);

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['SEMUA TIKET — DETAIL LENGKAP'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle([
            'No',
            'Nama Pembeli',
            'Email',
            'Kode Tiket (QR Hash)',
            'Sumber',
            'Paket',
            'Harga Tiket',
            'Total Harga Order',
            'Sisa Hari',
            'Vote Tersisa',
            'Kupon Tersisa',
            'Sharing Tersisa',
            'Status Check-in',
            'Waktu Check-in',
            'Vote Untuk',
            'Supporter Untuk',
            'Status Pembayaran',
            'Metode Bayar',
            'Waktu Beli',
        ], $headerStyle));

        $idx = 0;
        IssuedTicket::with(['ticketPackage', 'order', 'voteLogs.contingent', 'supporterLogs.contingent'])
            ->whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
            ->latest()
            ->lazy(200)
            ->each(function($t) use ($writer, &$idx) {
                $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                    ++$idx,
                    $t->buyer_name,
                    $t->buyer_email ?? '-',
                    $t->unique_qr_hash,
                    str_starts_with($t->order?->payment_method ?? '', 'OTS') ? 'OTS' : 'Online',
                    $t->ticketPackage?->name ?? '-',
                    'Rp ' . number_format((float) ($t->ticketPackage?->price ?? 0), 0, ',', '.'),
                    'Rp ' . number_format((float) ($t->order?->total_price ?? 0), 0, ',', '.'),
                    $t->days_remaining,
                    $t->vote_tokens_remaining,
                    $t->coupon_tokens_remaining,
                    $t->sharing_tokens_remaining,
                    $t->check_in_status ? 'Sudah' : 'Belum',
                    $t->checked_in_at?->format('d M Y H:i') ?? '-',
                    $t->voteLogs->groupBy(fn($v) => $v->contingent?->school_name ?? 'Unknown')
                        ->map(fn($logs, $name) => $name . ' (' . $logs->sum('votes') . 'x)')
                        ->implode('; '),
                    $t->supporterLogs->groupBy(fn($s) => $s->contingent?->school_name ?? 'Unknown')
                        ->map(fn($logs, $name) => $name . ' (' . $logs->count() . 'x)')
                        ->implode('; '),
                    $t->order?->payment_status ?? '-',
                    $t->order?->payment_method ?? '-',
                    $t->created_at->format('d M Y H:i'),
                ]));
            });

        // ===== SECTION 4: RIWAYAT PERSETUJUAN =====
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Riwayat Order');
        $sheet->setColumnWidthForRange(10, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 6);

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['RIWAYAT PERSETUJUAN PEMBAYARAN'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['No', 'Order ID', 'Pembeli', 'Total Harga', 'Waktu Disetujui'], $headerStyle));
        $idx2 = 0;
        Order::where('event_id', $event->id)->where('payment_status', 'paid')
            ->whereNotNull('payment_proof')
            ->latest('updated_at')
            ->lazy(200)
            ->each(function($o) use ($writer, &$idx2) {
                $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                    ++$idx2,
                    $o->midtrans_transaction_id,
                    $o->user?->name ?? '-',
                    'Rp ' . number_format((float) $o->total_price, 0, ',', '.'),
                    $o->updated_at->format('d M Y H:i'),
                ]));
            });

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['RIWAYAT PENOLAKAN PEMBAYARAN'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['No', 'Order ID', 'Pembeli', 'Total Harga', 'Alasan', 'Waktu Ditolak'], $headerStyle));
        $idx3 = 0;
        Order::where('event_id', $event->id)->where('payment_status', 'failed')
            ->latest('updated_at')
            ->lazy(200)
            ->each(function($o) use ($writer, &$idx3) {
                $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                    ++$idx3,
                    $o->midtrans_transaction_id,
                    $o->user?->name ?? '-',
                    'Rp ' . number_format((float) $o->total_price, 0, ',', '.'),
                    $o->rejected_reason ?? '-',
                    $o->updated_at->format('d M Y H:i'),
                ]));
            });

        // ===== SECTION 5: DETAIL TIKET OTS =====
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Detail OTS');
        $sheet->setColumnWidthForRange(10, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 6);

        $colsOts = ['No', 'Nama Pembeli', 'Email', 'Kode Tiket (QR Hash)', 'Paket', 'Harga Tiket', 'Total Harga Order',
            'Sisa Hari', 'Vote Tersisa', 'Kupon Tersisa', 'Sharing Tersisa', 'Status Check-in', 'Waktu Check-in',
            'Vote Untuk', 'Supporter Untuk', 'Waktu Beli'];

        $renderOtsTable = function (string $title, Closure $filter) use ($writer, $headerStyle, $colsOts, $event, &$otsQrisRev, &$otsTunaiRev) {
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle([$title], $headerStyle));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle($colsOts, $headerStyle));

            $idx = 0;
            IssuedTicket::with(['ticketPackage', 'order', 'voteLogs.contingent', 'supporterLogs.contingent'])
                ->whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid')->where($filter))
                ->latest()
                ->lazy(200)
                ->each(function($t) use ($writer, &$idx, &$otsQrisRev, &$otsTunaiRev) {
                    $harga = (float) ($t->ticketPackage?->price ?? 0);
                    $pm = $t->order?->payment_method ?? '';
                    if (str_starts_with($pm, 'OTS-QRIS')) $otsQrisRev += $harga;
                    else $otsTunaiRev += $harga;
                    $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                        ++$idx,
                        $t->buyer_name,
                        $t->buyer_email ?? '-',
                        $t->unique_qr_hash,
                        $t->ticketPackage?->name ?? '-',
                        'Rp ' . number_format($harga, 0, ',', '.'),
                        'Rp ' . number_format((float) ($t->order?->total_price ?? 0), 0, ',', '.'),
                        $t->days_remaining,
                        $t->vote_tokens_remaining,
                        $t->coupon_tokens_remaining,
                        $t->sharing_tokens_remaining,
                        $t->check_in_status ? 'Sudah' : 'Belum',
                        $t->checked_in_at?->format('d M Y H:i') ?? '-',
                        $t->voteLogs->groupBy(fn($v) => $v->contingent?->school_name ?? 'Unknown')
                            ->map(fn($logs, $name) => $name . ' (' . $logs->sum('votes') . 'x)')->implode('; '),
                        $t->supporterLogs->groupBy(fn($s) => $s->contingent?->school_name ?? 'Unknown')
                            ->map(fn($logs, $name) => $name . ' (' . $logs->count() . 'x)')->implode('; '),
                        $t->created_at->format('d M Y H:i'),
                    ]));
                });

            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        };

        $otsQrisRev = 0;
        $otsTunaiRev = 0;
        $renderOtsTable('QRIS', fn($q) => $q->where('payment_method', 'like', 'OTS-QRIS%'));
        $renderOtsTable('TUNAI', fn($q) => $q->where(function($q) {
            $q->where('payment_method', 'OTS')->orWhere('payment_method', 'like', 'OTS-CASH%');
        }));

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['RINGKASAN PENDAPATAN OTS'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Pendapatan OTS QRIS', 'Rp ' . number_format($otsQrisRev, 0, ',', '.')]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Pendapatan OTS Tunai', 'Rp ' . number_format($otsTunaiRev, 0, ',', '.')]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Total Pendapatan OTS', 'Rp ' . number_format($otsQrisRev + $otsTunaiRev, 0, ',', '.')]));

        // ===== SECTION 6: DETAIL TIKET ONLINE =====
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Detail Online');
        $sheet->setColumnWidthForRange(10, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 6);

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['DETAIL TIKET ONLINE'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle([
            'No', 'Nama Pembeli', 'Email', 'Kode Tiket (QR Hash)', 'Paket', 'Harga Tiket', 'Total Harga Order',
            'Sisa Hari', 'Vote Tersisa', 'Kupon Tersisa', 'Sharing Tersisa', 'Status Check-in', 'Waktu Check-in',
            'Vote Untuk', 'Supporter Untuk', 'Waktu Beli',
        ], $headerStyle));

        $idx5 = 0;
        $revOnline = 0;
        IssuedTicket::with(['ticketPackage', 'order', 'voteLogs.contingent', 'supporterLogs.contingent'])
            ->whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid')->where('payment_method', 'not like', 'OTS%'))
            ->latest()
            ->lazy(200)
            ->each(function($t) use ($writer, &$idx5, &$revOnline) {
                $harga = (float) ($t->ticketPackage?->price ?? 0);
                $revOnline += $harga;
                $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                    ++$idx5,
                    $t->buyer_name,
                    $t->buyer_email ?? '-',
                    $t->unique_qr_hash,
                    $t->ticketPackage?->name ?? '-',
                    'Rp ' . number_format($harga, 0, ',', '.'),
                    'Rp ' . number_format((float) ($t->order?->total_price ?? 0), 0, ',', '.'),
                    $t->days_remaining,
                    $t->vote_tokens_remaining,
                    $t->coupon_tokens_remaining,
                    $t->sharing_tokens_remaining,
                    $t->check_in_status ? 'Sudah' : 'Belum',
                    $t->checked_in_at?->format('d M Y H:i') ?? '-',
                    $t->voteLogs->groupBy(fn($v) => $v->contingent?->school_name ?? 'Unknown')
                        ->map(fn($logs, $name) => $name . ' (' . $logs->sum('votes') . 'x)')->implode('; '),
                    $t->supporterLogs->groupBy(fn($s) => $s->contingent?->school_name ?? 'Unknown')
                        ->map(fn($logs, $name) => $name . ' (' . $logs->count() . 'x)')->implode('; '),
                    $t->created_at->format('d M Y H:i'),
                ]));
            });
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['RINGKASAN PENDAPATAN ONLINE'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['Total Pendapatan Online', 'Rp ' . number_format($revOnline, 0, ',', '.')]));

        $writer->close();
    }

    public function approveOrder($slug, $id)
    {
        $user = auth()->user();
        if ($user->role === 'operator_gate' && $user->email !== 'gate@pasgarda.com') {
            abort(403, 'Hanya Master Gate yang dapat menyetujui pembayaran.');
        }

        $order = Order::findOrFail($id);

        if ($order->payment_status === 'paid') {
            return back()->with('status', 'Transaksi sudah berstatus Lunas.');
        }

        $contingentId = $order->contingent_id;

        DB::transaction(function () use ($order, $contingentId) {
            $order->update([
                'payment_status' => 'paid',
            ]);

            // Auto-create votes & supporter records for each ticket in this order
            $tickets = $order->issuedTickets;
            $eventId = $order->event_id;
            $now = now();

            foreach ($tickets as $ticket) {
                // Set supporter contingent
                $ticket->update([
                    'supporter_contingent_id' => $contingentId,
                ]);

                // Create vote logs
                $voteTokens = $ticket->vote_tokens_remaining;
                if ($voteTokens > 0 && $contingentId) {
                    $voteData = [];
                    for ($i = 0; $i < $voteTokens; $i++) {
                        $voteData[] = [
                            'event_id' => $eventId,
                            'issued_ticket_id' => $ticket->id,
                            'contingent_id' => $contingentId,
                            'created_at' => $now,
                        ];
                    }
                    VoteLog::insert($voteData);
                    $ticket->decrement('vote_tokens_remaining', $voteTokens);
                }

                // Create supporter log
                if ($contingentId) {
                    SupporterLog::create([
                        'event_id' => $eventId,
                        'issued_ticket_id' => $ticket->id,
                        'contingent_id' => $contingentId,
                    ]);
                }
            }

            // Recalculate voting bonuses
            if ($contingentId) {
                ProcessScoreAggregationJob::dispatch($eventId);
            }
        });

        // Send confirmation email
        if ($order->user && $order->user->email) {
            try {
                $ticketUrl = url("/events/{$slug}/my-tickets");
                $subject = "Pembayaran Tiket PASGARDA Disetujui - {$order->midtrans_transaction_id}";
                $body = "Halo {$order->user->name},\n\nPembayaran Anda untuk order {$order->midtrans_transaction_id} sebesar Rp " . number_format($order->total_price, 0, ',', '.') . " telah disetujui oleh admin.\n\nTiket Anda kini telah aktif! Hak suara dan dukungan supporter telah otomatis diberikan ke kontingen pilihan Anda.\n\nLihat tiket Anda di sini:\n{$ticketUrl}\n\nTerima kasih,\nPanitia PASGARDA";
                $fromEmail = $order->event?->ticket_notification_email;
                $job = $fromEmail
                    ? new SendEmailJob($order->user->email, $subject, $body, $fromEmail)
                    : new SendEmailJob($order->user->email, $subject, $body);
                dispatch($job);
            } catch (\Exception $e) {
                Log::error("Failed to dispatch payment approval email: " . $e->getMessage());
            }
        }

        return back()->with('status', 'Pembayaran order ' . $order->midtrans_transaction_id . ' berhasil disetujui! Vote otomatis tercatat.');
    }

    public function rejectOrder(Request $request, $slug, $id)
    {
        $user = auth()->user();
if ($user->role === 'operator_gate' && $user->email !== 'gate@pasgarda.com') {
            abort(403, 'Hanya Master Gate yang dapat mengakses halaman ini.');
        }

        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $order = Order::findOrFail($id);

        if ($order->payment_status === 'paid') {
            return back()->withErrors(['error' => 'Tidak dapat menolak order yang sudah Lunas.']);
        }

        DB::transaction(function () use ($order, $request) {
            $order->load('issuedTickets');
            $ticketsByPackage = $order->issuedTickets->groupBy('ticket_package_id');
            foreach ($ticketsByPackage as $packageId => $tickets) {
                TicketPackage::where('id', $packageId)->increment('stock', $tickets->count());
            }

            // Clean up any vote & supporter logs if they exist
            $ticketIds = $order->issuedTickets->pluck('id');
            VoteLog::whereIn('issued_ticket_id', $ticketIds)->delete();
            SupporterLog::whereIn('issued_ticket_id', $ticketIds)->delete();

            $order->update([
                'payment_status' => 'failed',
                'rejected_reason' => $request->reason,
            ]);
        });

        // Send rejection email
        if ($order->user && $order->user->email) {
            try {
                $ticketUrl = url("/events/{$slug}/my-tickets");
                $subject = "Pembayaran Tiket PASGARDA Ditolak - {$order->midtrans_transaction_id}";
                $body = "Halo {$order->user->name},\n\nPembayaran Anda untuk order {$order->midtrans_transaction_id} sebesar Rp " . number_format($order->total_price, 0, ',', '.') . " ditolak oleh admin.\n\nAlasan Penolakan: {$request->reason}\n\nSilakan unggah kembali bukti transfer yang valid melalui halaman Tiket Saya:\n{$ticketUrl}\n\nTerima kasih,\nPanitia PASGARDA";
                $fromEmail = $order->event?->ticket_notification_email;
                $job = $fromEmail
                    ? new SendEmailJob($order->user->email, $subject, $body, $fromEmail)
                    : new SendEmailJob($order->user->email, $subject, $body);
                dispatch($job);
            } catch (\Exception $e) {
                Log::error("Failed to dispatch payment rejection email: " . $e->getMessage());
            }
        }

        return back()->with('status', 'Pembayaran order ' . $order->midtrans_transaction_id . ' berhasil ditolak!');
    }

    public function showAllTickets(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $ticketsQuery = IssuedTicket::with(['ticketPackage', 'voteLogs.contingent', 'supporterLogs.contingent'])
            ->whereHas('order', function ($q) use ($event) {
                $q->where('event_id', $event->id)->where('payment_status', 'paid');
            });

        if ($search = $request->query('search')) {
            $ticketsQuery->where(function ($q) use ($search) {
                $q->where('buyer_name', 'like', "%{$search}%")
                  ->orWhere('unique_qr_hash', 'like', "%{$search}%");
            });
        }

        $tickets = $ticketsQuery->latest()->paginate(25)->withQueryString()
            ->through(function ($t) {
                $isOts = str_starts_with($t->order?->payment_method ?? '', 'OTS');
                $otsPm = $isOts ? (str_starts_with($t->order?->payment_method ?? '', 'OTS-') ? strtolower(substr($t->order->payment_method, 4)) : 'cash') : null;

                $voteHistory = $t->voteLogs->groupBy(fn ($v) => $v->created_at->format('d M Y'))
                    ->map(fn ($logs, $day) => [
                        'day' => $day,
                        'logs' => $logs->map(fn ($v) => [
                            'time' => $v->created_at->format('H:i'),
                            'contingent_name' => $v->contingent?->school_name ?? 'Unknown',
                            'votes' => $v->votes,
                        ]),
                    ])->values();

                $supporterHistory = $t->supporterLogs->map(fn ($s) => [
                    'date' => $s->created_at->format('d M Y'),
                    'time' => $s->created_at->format('H:i'),
                    'contingent_name' => $s->contingent?->school_name ?? 'Unknown',
                ]);

                return (object) [
                    'id' => $t->id,
                    'buyer_name' => $t->buyer_name,
                    'unique_qr_hash' => $t->unique_qr_hash,
                    'ticket_package' => $t->ticketPackage,
                    'days_remaining' => $t->days_remaining,
                    'vote_tokens_remaining' => $t->vote_tokens_remaining,
                    'coupon_tokens_remaining' => $t->coupon_tokens_remaining,
                    'supporter_tokens_remaining' => $t->supporter_tokens_remaining,
                    'check_in_status' => $t->check_in_status,
                    'created_at' => $t->created_at,
                    'sumber' => $isOts ? 'OTS' : 'Online',
                    'ots_payment_type' => $otsPm,
                    'vote_history' => $voteHistory,
                    'supporter_history' => $supporterHistory,
                ];
            });

        // Aggregate: total & revenue per method (OTS vs Online) — 1 query
        $revenueStats = Order::where('event_id', $event->id)
            ->where('payment_status', 'paid')
            ->selectRaw("payment_method LIKE 'OTS%' as is_ots")
            ->selectRaw('COUNT(*) as total_orders')
            ->selectRaw('COALESCE(SUM(total_price), 0) as revenue')
            ->groupBy('is_ots')
            ->get()
            ->keyBy('is_ots');

        $totalOts = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_method', 'like', 'OTS%')->where('payment_status', 'paid'))->count();
        $totalOnline = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_method', 'not like', 'OTS%')->where('payment_status', 'paid'))->count();
        $revenueOts = (float) ($revenueStats->get(1)?->revenue ?? 0);
        $revenueOnline = (float) ($revenueStats->get(0)?->revenue ?? 0);

        // Package breakdown — 1 query
        $packageBreakdown = collect();
        $packages = TicketPackage::where('event_id', $event->id)->where('is_active', true)->pluck('name', 'id');
        if ($packages->isNotEmpty()) {
            $pkgRaw = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
                ->join('orders', 'issued_tickets.order_id', '=', 'orders.id')
                ->selectRaw('issued_tickets.ticket_package_id')
                ->selectRaw("SUM(orders.payment_method LIKE 'OTS%') as ots_count")
                ->selectRaw("SUM(orders.payment_method NOT LIKE 'OTS%') as online_count")
                ->groupBy('issued_tickets.ticket_package_id')
                ->get()
                ->keyBy('ticket_package_id');

            $packageBreakdown = $packages->map(fn ($name, $id) => [
                'name' => $name,
                'ots' => (int) ($pkgRaw->get($id)?->ots_count ?? 0),
                'online' => (int) ($pkgRaw->get($id)?->online_count ?? 0),
            ])->values();
        }

        // Check-in progress — 1 query
        $checkinStats = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(check_in_status = 1) as checked_in")
            ->first();

        $totalPaid = (int) ($checkinStats->total ?? 0);
        $checkedIn = (int) ($checkinStats->checked_in ?? 0);
        $notCheckedIn = $totalPaid - $checkedIn;

        return Inertia::render('Admin/OtsTicketsAll', [
            'event' => $event,
            'tickets' => $tickets,
            'search' => $search,
            'stats' => [
                'total_ots' => $totalOts,
                'total_online' => $totalOnline,
                'total_all' => $totalOts + $totalOnline,
                'revenue_ots' => $revenueOts,
                'revenue_online' => $revenueOnline,
                'revenue_total' => $revenueOts + $revenueOnline,
                'package_breakdown' => $packageBreakdown,
                'checked_in' => $checkedIn,
                'not_checked_in' => $notCheckedIn,
                'has_checked_in_data' => $checkedIn > 0,
            ],
        ]);
    }

    public function showScanHistory(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $ticketsQuery = IssuedTicket::with(['ticketPackage', 'voteLogs.contingent', 'supporterLogs.contingent'])
            ->whereHas('order', function ($q) use ($event) {
                $q->where('event_id', $event->id)->where('payment_status', 'paid');
            });

        if ($search = $request->query('search')) {
            $ticketsQuery->where(function ($q) use ($search) {
                $q->where('buyer_name', 'like', "%{$search}%")
                  ->orWhere('unique_qr_hash', 'like', "%{$search}%");
            });
        }

        $tickets = $ticketsQuery->latest()->paginate(25)->withQueryString()
            ->through(function ($t) {
                $isOts = str_starts_with($t->order?->payment_method ?? '', 'OTS');
                $otsPm = $isOts ? (str_starts_with($t->order?->payment_method ?? '', 'OTS-') ? strtolower(substr($t->order->payment_method, 4)) : 'cash') : null;

                $voteHistory = $t->voteLogs->groupBy(fn ($v) => $v->created_at->format('d M Y'))
                    ->map(fn ($logs, $day) => [
                        'day' => $day,
                        'logs' => $logs->map(fn ($v) => [
                            'time' => $v->created_at->format('H:i'),
                            'contingent_name' => $v->contingent?->school_name ?? 'Unknown',
                            'votes' => $v->votes,
                        ]),
                    ])->values();

                $supporterHistory = $t->supporterLogs->map(fn ($s) => [
                    'date' => $s->created_at->format('d M Y'),
                    'time' => $s->created_at->format('H:i'),
                    'contingent_name' => $s->contingent?->school_name ?? 'Unknown',
                ]);

                return (object) [
                    'id' => $t->id,
                    'buyer_name' => $t->buyer_name,
                    'unique_qr_hash' => $t->unique_qr_hash,
                    'ticket_package' => $t->ticketPackage,
                    'days_remaining' => $t->days_remaining,
                    'vote_tokens_remaining' => $t->vote_tokens_remaining,
                    'coupon_tokens_remaining' => $t->coupon_tokens_remaining,
                    'supporter_tokens_remaining' => $t->supporter_tokens_remaining,
                    'check_in_status' => $t->check_in_status,
                    'created_at' => $t->created_at,
                    'sumber' => $isOts ? 'OTS' : 'Online',
                    'ots_payment_type' => $otsPm,
                    'vote_history' => $voteHistory,
                    'supporter_history' => $supporterHistory,
                ];
            });

        return Inertia::render('Admin/ScanHistory', [
            'event' => $event,
            'tickets' => $tickets,
            'search' => $search,
        ]);
    }

    public function exportOtsCsv(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $writer = new \OpenSpout\Writer\XLSX\Writer();
        $writer->openToBrowser('tiket-' . $event->slug . '-' . now()->format('Ymd') . '.xlsx');

        $headerStyle = new \OpenSpout\Common\Entity\Style\Style(
            fontBold: true,
            fontColor: \OpenSpout\Common\Entity\Style\Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: \OpenSpout\Common\Entity\Style\CellAlignment::CENTER,
        );

        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Scan & OTS');
        $sheet->setColumnWidthForRange(15, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 6);

        // --- Summary Stats ---
        $totalOts = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_method', 'like', 'OTS%')->where('payment_status', 'paid'))->count();
        $totalOnline = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_method', 'not like', 'OTS%')->where('payment_status', 'paid'))->count();
        $totalAll = $totalOts + $totalOnline;

        $revenueOts = (float) Order::where('event_id', $event->id)->where('payment_status', 'paid')->where('payment_method', 'like', 'OTS%')->sum('total_price');
        $revenueOnline = (float) Order::where('event_id', $event->id)->where('payment_status', 'paid')->where('payment_method', 'not like', 'OTS%')->sum('total_price');
        $revenueTotal = $revenueOts + $revenueOnline;

        $checkedIn = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))->where('check_in_status', true)->count();
        $totalPaid = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))->count();
        $notCheckedIn = $totalPaid - $checkedIn;

        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['RINGKASAN DATA'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['Total Tiket', 'OTS', 'Online', 'Total'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['', $totalOts, $totalOnline, $totalAll]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['Pendapatan', 'OTS', 'Online', 'Total'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['', 'Rp ' . number_format($revenueOts, 0, ',', '.'), 'Rp ' . number_format($revenueOnline, 0, ',', '.'), 'Rp ' . number_format($revenueTotal, 0, ',', '.')]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['Kunjungan', 'Telah Berkunjung', 'Belum Berkunjung', 'Total'], $headerStyle));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues(['', $checkedIn, $notCheckedIn, $totalPaid]));
        $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));

        // Package breakdown
        $packages = TicketPackage::where('event_id', $event->id)->where('is_active', true)->pluck('name', 'id');
        $pkgRaw = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
            ->join('orders', 'issued_tickets.order_id', '=', 'orders.id')
            ->selectRaw('issued_tickets.ticket_package_id')
            ->selectRaw("SUM(orders.payment_method LIKE 'OTS%') as ots_count")
            ->selectRaw("SUM(orders.payment_method NOT LIKE 'OTS%') as online_count")
            ->groupBy('issued_tickets.ticket_package_id')
            ->get()
            ->keyBy('ticket_package_id');

        if ($packages->isNotEmpty()) {
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(['Per Paket', 'OTS', 'Online'], $headerStyle));
            foreach ($packages as $id => $name) {
                $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([$name, (int) ($pkgRaw->get($id)?->ots_count ?? 0), (int) ($pkgRaw->get($id)?->online_count ?? 0)]));
            }
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        }

        // --- Tickets grouped by payment type ---
        $renderSection = function (string $title, Closure $filter) use ($writer, $headerStyle, $event) {
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle([$title], $headerStyle));
            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValuesWithStyle(
                ['Nama Pembeli', 'Kode Tiket', 'Paket', 'Email', 'Sisa Hari', 'Vote Tersisa', 'Kupon Tersisa', 'Sharing Tersisa', 'Check-In', 'Vote Untuk', 'Supporter', 'Waktu'],
                $headerStyle
            ));

            IssuedTicket::with(['ticketPackage', 'voteLogs.contingent', 'supporterLogs.contingent'])
                ->whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid')->where($filter))
                ->latest()
                ->lazy(200)
                ->each(function ($t) use ($writer) {
                    $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([
                        $t->buyer_name,
                        $t->unique_qr_hash,
                        $t->ticketPackage?->name ?? '-',
                        $t->buyer_email ?? '-',
                        $t->days_remaining,
                        $t->vote_tokens_remaining,
                        $t->coupon_tokens_remaining,
                        $t->sharing_tokens_remaining,
                        $t->check_in_status ? 'Ya' : 'Tidak',
                        $t->voteLogs->groupBy(fn ($v) => $v->contingent?->school_name ?? 'Unknown')
                            ->map(fn ($logs, $name) => $name . ' (' . $logs->sum('votes') . 'x)')
                            ->implode('; '),
                        $t->supporterLogs->groupBy(fn ($s) => $s->contingent?->school_name ?? 'Unknown')
                            ->map(fn ($logs, $name) => $name . ' (' . $logs->count() . 'x)')
                            ->implode('; '),
                        $t->created_at->format('d M Y H:i'),
                    ]));
                });

            $writer->addRow(\OpenSpout\Common\Entity\Row::fromValues([]));
        };

        $renderSection('OTS QRIS', fn ($q) => $q->where('payment_method', 'like', 'OTS-QRIS%'));
        $renderSection('OTS Tunai', fn ($q) => $q->where(function ($q) {
            $q->where('payment_method', 'OTS')->orWhere('payment_method', 'like', 'OTS-CASH%');
        }));
        $renderSection('Online', fn ($q) => $q->where('payment_method', 'not like', 'OTS%'));

        $writer->close();
    }

    public function generateOtsTicket(Request $request, $slug)
    {
        $request->validate([
            'ticket_package_id' => 'required|exists:ticket_packages,id',
            'buyer_name' => 'required|string|max:255',
            'buyer_email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'quantity' => 'nullable|integer|min:1|max:50',
            'ots_payment_type' => 'required|in:qris,cash',
        ]);

        $quantity = (int) ($request->quantity ?? 1);

        $event = Event::where('slug', $slug)->firstOrFail();
        $package = TicketPackage::findOrFail($request->ticket_package_id);

        $orderId = 'OTS-' . strtoupper(Str::random(10));

        $tickets = DB::transaction(function () use ($event, $package, $orderId, $quantity, $request) {
            $order = Order::create([
                'user_id' => auth()->id(),
                'event_id' => $event->id,
                'midtrans_transaction_id' => $orderId,
                'total_price' => $package->price * $quantity,
                'payment_status' => 'paid',
                'payment_method' => 'OTS-' . strtoupper($request->ots_payment_type),
            ]);

            $created = [];
            for ($i = 0; $i < $quantity; $i++) {
                $qrHash = 'OTS-TKT-' . Str::random(24);
                $created[] = IssuedTicket::create([
                    'order_id' => $order->id,
                    'ticket_package_id' => $package->id,
                    'unique_qr_hash' => $qrHash,
                    'buyer_name' => $request->buyer_name,
                    'buyer_email' => $request->buyer_email,
                    'phone' => $request->phone,
                    'check_in_status' => false,
                    'vote_tokens_remaining' => $package->vote_allowance,
                    'days_remaining' => $package->validity_days,
                    'coupon_tokens_remaining' => $package->coupon_allowance,
                    'sharing_tokens_remaining' => $package->sharing_allowance,
                    'supporter_tokens_remaining' => 0,
                ]);
            }
            return $created;
        });

        $otsPaymentType = $request->ots_payment_type;

        $ticketData = collect($tickets)->map(function ($t) use ($package, $otsPaymentType) {
            $ticketUrl = url('/tickets/' . $t->unique_qr_hash);
            return [
                'id' => $t->id,
                'order_id' => $t->order_id,
                'buyer_name' => $t->buyer_name,
                'package_name' => $package->name,
                'ots_payment_type' => $otsPaymentType,
                'qr_hash' => $t->unique_qr_hash,
                'ticket_url' => $ticketUrl,
                'phone' => $t->phone,
                'whatsapp_url' => $t->phone ? 'https://wa.me/' . preg_replace('/[^0-9]/', '', $t->phone) . '?text=' . urlencode("Halo {$t->buyer_name},\n\nTiket OTS Anda:\nPaket: {$package->name}\nLink: {$ticketUrl}\n\nTunjukkan QR ini di gate masuk.") : null,
                'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' . urlencode($ticketUrl),
            ];
        })->toArray();

        // Send email only once for bulk (first ticket as reference)
        $firstTicket = $tickets[0] ?? null;
        if ($firstTicket && $firstTicket->buyer_email) {
            try {
                $ticketUrl = url('/tickets/' . $firstTicket->unique_qr_hash);
                $subject = "{$quantity} Tiket OTS PASGARDA - {$package->name}";
                $body = "Halo {$firstTicket->buyer_name},\n\n{$quantity} Tiket OTS (On The Spot) telah diterbitkan!\n\nPaket: {$package->name} x{$quantity}\nTotal: Rp " . number_format($package->price * $quantity, 0, ',', '.') . "\n\nLink tiket: {$ticketUrl}\n\nTerima kasih,\nPanitia PASGARDA";
                $fromEmail = $event->ticket_notification_email;
                $job = $fromEmail
                    ? new SendEmailJob($firstTicket->buyer_email, $subject, $body, $fromEmail)
                    : new SendEmailJob($firstTicket->buyer_email, $subject, $body);
                dispatch($job);
            } catch (\Exception $e) {
                Log::error("Failed to dispatch OTS bulk ticket email: " . $e->getMessage());
            }
        }

        return back()->with([
            'status' => "{$quantity} Tiket OTS {$package->name} berhasil diterbitkan!",
            'last_issued_tickets' => $ticketData,
            'flash' => [
                'status' => "{$quantity} Tiket OTS {$package->name} berhasil diterbitkan!",
                'last_issued_tickets' => $ticketData,
            ]
        ]);
    }

    public function scanTicket(Request $request)
    {
        $request->validate([
            'qr_hash' => 'required|string',
        ]);

        $qrHash = $request->qr_hash;
        if (str_contains($qrHash, '/tickets/')) {
            $parts = explode('/tickets/', $qrHash);
            $qrHash = end($parts);
            $qrHash = strtok($qrHash, '?');
        }

        $ticket = IssuedTicket::with(['ticketPackage', 'order'])
            ->where('unique_qr_hash', $qrHash)
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket TIDAK VALID! Data tiket tidak ditemukan di sistem.',
            ], 404);
        }

        if ($ticket->order->payment_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Tiket BELUM DIBAYAR! Pembayaran tiket ini belum terverifikasi.',
            ], 400);
        }

        $event = $ticket->order->event;
        if ($event->gate_status === 'closed') {
            return response()->json([
                'success' => false,
                'message' => 'Gate saat ini ditutup oleh panitia.',
            ], 403);
        }

        if ($event->gate_status === 'auto') {
            $now = now();
            $schedules = $event->gate_schedules ?? [];
            $isOpen = false;
            
            if (empty($schedules)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal otomatis belum diatur oleh panitia.',
                ], 403);
            }

            foreach ($schedules as $schedule) {
                $openAt = \Carbon\Carbon::parse($schedule['open_at']);
                $closeAt = \Carbon\Carbon::parse($schedule['close_at']);
                
                if ($now->between($openAt, $closeAt)) {
                    $isOpen = true;
                    break;
                }
            }

            if (!$isOpen) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gate sedang ditutup. Tidak ada jadwal operasional yang sesuai dengan waktu sekarang.',
                ], 403);
            }
        }

        $package = $ticket->ticketPackage;

        // Build vote history — last 100 rows
        $voteLogs = VoteLog::where('issued_ticket_id', $ticket->id)
            ->with('contingent:id,school_name')
            ->orderByDesc('created_at')
            ->take(100)
            ->get()
            ->reverse();

        $voteHistory = $voteLogs->groupBy(fn ($log) => $log->created_at->format('Y-m-d'))
            ->map(fn ($dayLogs) => $dayLogs->groupBy(fn ($log) => $log->created_at->format('H:i'))
                ->map(fn ($batch) => [
                    'time' => $batch->first()->created_at->format('H:i'),
                    'date' => $batch->first()->created_at->format('d M Y'),
                    'contingent_name' => $batch->first()->contingent?->school_name,
                    'votes' => $batch->count(),
                ])->values()
            );

        // Build supporter history — last 100 rows
        $supporterHistory = SupporterLog::where('issued_ticket_id', $ticket->id)
            ->with('contingent:id,school_name')
            ->orderByDesc('created_at')
            ->take(100)
            ->get()
            ->reverse()
            ->map(fn ($log) => [
                'time' => $log->created_at->format('H:i'),
                'date' => $log->created_at->format('d M Y'),
                'contingent_name' => $log->contingent?->school_name,
            ]);

        return response()->json([
            'success' => true,
            'already_checked_in' => $ticket->check_in_status,
            'buyer_name' => $ticket->buyer_name,
            'package_name' => $package->name,
            'package_type' => $package->type,
            'days_remaining' => $ticket->days_remaining,
            'days_exhausted' => $ticket->days_remaining <= 0,
            'vote_tokens' => $ticket->vote_tokens_remaining,
            'coupon_tokens' => $ticket->coupon_tokens_remaining,
            'sharing_tokens' => $ticket->sharing_tokens_remaining,
            'supporter_tokens' => 0,
            'vote_history' => $voteHistory,
            'supporter_history' => $supporterHistory,
            'check_in_history' => $ticket->check_in_history ?? [],
            'sumber' => str_starts_with($ticket->order->payment_method ?? '', 'OTS') ? 'OTS' : 'Online',
            'ots_payment_type' => str_starts_with($ticket->order?->payment_method ?? '', 'OTS-') ? strtolower(substr($ticket->order->payment_method, 4)) : null,
            'message' => 'Tiket ditemukan.',
        ]);
    }

    public function checkIn(Request $request)
    {
        $request->validate([
            'qr_hash' => 'required|string',
        ]);

        // Extract hash from full URL if the QR contains a URL (e.g. /tickets/OTS-TKT-xxx)
        $qrHash = $request->qr_hash;
        if (str_contains($qrHash, '/tickets/')) {
            $parts = explode('/tickets/', $qrHash);
            $qrHash = end($parts);
            // Remove any trailing query params
            $qrHash = strtok($qrHash, '?');
        }

        $ticket = IssuedTicket::with('order')->where('unique_qr_hash', $qrHash)->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket TIDAK VALID! Data tiket tidak ditemukan di sistem.',
            ], 404);
        }

        // Verify if order is paid
        if ($ticket->order->payment_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Tiket BELUM DIBAYAR! Pembayaran tiket ini belum terverifikasi.',
            ], 400);
        }

        $event = $ticket->order->event;
        if ($event->gate_status === 'closed') {
            return response()->json([
                'success' => false,
                'message' => 'Gate saat ini ditutup oleh panitia.',
            ], 403);
        }

        if ($event->gate_status === 'auto') {
            $now = now();
            $schedules = $event->gate_schedules ?? [];
            $isOpen = false;
            
            if (empty($schedules)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal otomatis belum diatur oleh panitia.',
                ], 403);
            }

            foreach ($schedules as $schedule) {
                $openAt = \Carbon\Carbon::parse($schedule['open_at']);
                $closeAt = \Carbon\Carbon::parse($schedule['close_at']);
                
                if ($now->between($openAt, $closeAt)) {
                    $isOpen = true;
                    break;
                }
            }

            if (!$isOpen) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gate sedang ditutup. Tidak ada jadwal operasional yang sesuai dengan waktu sekarang.',
                ], 403);
            }
        }

        // Check remaining days
        if ($ticket->days_remaining <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket SUDAH HABIS MASA BERLAKU! Hari kunjungan sudah habis.',
            ], 400);
        }

        // Record check-in history
        $now = now();
        $history = $ticket->check_in_history ?? [];
        $history[] = [
            'timestamp' => $now->toIso8601String(),
            'days_remaining_before' => $ticket->days_remaining,
        ];

        // Decrement days_remaining and mark check-in
        $ticket->update([
            'check_in_status' => true,
            'checked_in_at' => $now,
            'check_in_history' => $history,
            'days_remaining' => $ticket->days_remaining - 1,
        ]);

        $package = $ticket->ticketPackage;
        $isFirstCheckIn = count($history) === 1;

        return response()->json([
            'success' => true,
            'already_checked_in' => !$isFirstCheckIn,
            'buyer_name' => $ticket->buyer_name,
            'package_name' => $package->name,
            'package_type' => $package->type,
            'days_remaining' => $ticket->days_remaining,
            'vote_tokens' => $ticket->vote_tokens_remaining,
            'coupon_tokens' => $ticket->coupon_tokens_remaining,
            'sharing_tokens' => $ticket->sharing_tokens_remaining,
            'supporter_tokens' => 0,
            'sumber' => str_starts_with($ticket->order->payment_method ?? '', 'OTS') ? 'OTS' : 'Online',
            'ots_payment_type' => str_starts_with($ticket->order?->payment_method ?? '', 'OTS-') ? strtolower(substr($ticket->order->payment_method, 4)) : null,
            'check_in_history' => $ticket->fresh()->check_in_history ?? [],
            'message' => $isFirstCheckIn
                ? 'CHECK-IN BERHASIL! Silakan berikan cap stempel fisik pada tangan penonton.'
                : 'RE-ENTRY BERHASIL! (' . $ticket->days_remaining . ' hari tersisa)',
        ]);
    }

    public function bulkCheckin(Request $request)
    {
        $request->validate([
            'qr_hashes' => 'required|array|min:1|max:50',
            'qr_hashes.*' => 'required|string',
        ]);

        $results = [];

        foreach ($request->qr_hashes as $qrHash) {
            try {
                $internalRequest = new Request(['qr_hash' => $qrHash]);
                $response = $this->checkIn($internalRequest);
                $data = $response->getData(true);
                $results[] = [
                    'qr_hash' => $qrHash,
                    'success' => $data['success'] ?? true,
                    'message' => $data['message'] ?? 'CHECK-IN BERHASIL!',
                    'buyer_name' => $data['buyer_name'] ?? null,
                    'already_checked_in' => $data['already_checked_in'] ?? false,
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'qr_hash' => $qrHash,
                    'success' => false,
                    'message' => $e->getMessage(),
                    'buyer_name' => null,
                    'already_checked_in' => false,
                ];
            }
        }

        $successCount = count(array_filter($results, fn($r) => $r['success']));
        $failCount = count($results) - $successCount;

        $totalVoteTokens = 0;
        $totalCouponTokens = 0;
        $totalSharingTokens = 0;

        if ($successCount > 0) {
            $successHashes = array_column(
                array_filter($results, fn($r) => $r['success']),
                'qr_hash'
            );
            $tickets = IssuedTicket::whereIn('unique_qr_hash', $successHashes)->get();
            $totalVoteTokens = $tickets->sum('vote_tokens_remaining');
            $totalCouponTokens = $tickets->sum('coupon_tokens_remaining');
            $totalSharingTokens = $tickets->sum('sharing_tokens_remaining');
        }

        return response()->json([
            'success' => $failCount === 0,
            'results' => $results,
            'success_count' => $successCount,
            'fail_count' => $failCount,
            'total_vote_tokens' => $totalVoteTokens,
            'total_coupon_tokens' => $totalCouponTokens,
            'total_sharing_tokens' => $totalSharingTokens,
            'ticket_count' => $successCount + $failCount,
            'message' => $failCount === 0
                ? "{$successCount} tiket berhasil check-in."
                : "{$successCount} berhasil, {$failCount} gagal.",
        ]);
    }

    public function allocateVotes(Request $request)
    {
        $request->validate([
            'qr_hash' => 'required|string',
            'allocations' => 'nullable|array|min:1',
            'allocations.*.contingent_id' => 'required_with:allocations|exists:contingents,id',
            'allocations.*.votes' => 'required_with:allocations|integer|min:1',
            'contingent_id' => 'required_without:allocations|exists:contingents,id',
            'votes' => 'nullable|integer|min:1',
            'supporter_contingent_id' => 'nullable|exists:contingents,id',
        ]);

        // Extract hash from full URL if the QR contains a URL
        $qrHash = $request->qr_hash;
        if (str_contains($qrHash, '/tickets/')) {
            $parts = explode('/tickets/', $qrHash);
            $qrHash = end($parts);
            $qrHash = strtok($qrHash, '?');
        }

        $ticket = IssuedTicket::where('unique_qr_hash', $qrHash)->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan.',
            ], 404);
        }

        if ($ticket->order->payment_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Tiket belum dibayar.',
            ], 400);
        }

        $allocations = $request->input('allocations');
        if (!$allocations) {
            $allocations = [
                ['contingent_id' => $request->contingent_id, 'votes' => $request->votes ?? 0]
            ];
        }
        $totalVotesRequested = collect($allocations)->sum('votes');

        // Check voting day status
        $event = $ticket->order->event;
        $allContingentIds = collect($allocations)->pluck('contingent_id')->unique();
        $allocContingents = Contingent::whereIn('id', $allContingentIds)->pluck('category_type', 'id');
        foreach ($allocations as $allocation) {
            $cat = $allocContingents[$allocation['contingent_id']] ?? null;
            $isDay1 = in_array($cat, ['U16', 'Purna']);
            $isDay2 = in_array($cat, ['U12', 'U19']);
            if ($isDay1 && $event->voting_day_1_status === 'stopped') {
                return response()->json(['success' => false, 'message' => 'Voting untuk kategori Hari ke-1 (SMP & Purna) telah ditutup.'], 403);
            }
            if ($isDay2 && $event->voting_day_2_status === 'stopped') {
                return response()->json(['success' => false, 'message' => 'Voting untuk kategori Hari ke-2 (SD & SMA) telah ditutup.'], 403);
            }
        }

        if ($totalVotesRequested <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada token voting yang tersedia.',
            ], 400);
        }

        if ($totalVotesRequested > $ticket->vote_tokens_remaining) {
            return response()->json([
                'success' => false,
                'message' => "Token voting tidak mencukupi. Dibutuhkan {$totalVotesRequested}, tersedia {$ticket->vote_tokens_remaining}.",
            ], 400);
        }

        $event = $ticket->order->event;

        DB::transaction(function () use ($event, $ticket, $allocations, $totalVotesRequested, $request) {
            $ticket->decrement('vote_tokens_remaining', $totalVotesRequested);

            // Batch insert votes
            $voteData = [];
            $now = now();
            foreach ($allocations as $allocation) {
                for ($i = 0; $i < $allocation['votes']; $i++) {
                    $voteData[] = [
                        'event_id' => $event->id,
                        'issued_ticket_id' => $ticket->id,
                        'contingent_id' => $allocation['contingent_id'],
                        'created_at' => $now,
                    ];
                }
            }
            if ($voteData) {
                VoteLog::insert($voteData);
            }

            if ($request->supporter_contingent_id) {
                SupporterLog::create([
                    'event_id' => $event->id,
                    'issued_ticket_id' => $ticket->id,
                    'contingent_id' => $request->supporter_contingent_id,
                ]);
                VoteLog::create([
                    'event_id' => $event->id,
                    'issued_ticket_id' => $ticket->id,
                    'contingent_id' => $request->supporter_contingent_id,
                    'created_at' => now(),
                ]);
            }

            ProcessScoreAggregationJob::dispatch($event->id);
        });

        return response()->json([
            'success' => true,
            'vote_tokens_remaining' => $ticket->fresh()->vote_tokens_remaining,
            'message' => $request->contingent_id
                ? "Semua {$totalVotesRequested} vote berhasil dialokasikan!"
                : "{$totalVotesRequested} vote berhasil dialokasikan!",
        ]);
    }

    public function bulkAllocateVotes(Request $request)
    {
        $request->validate([
            'qr_hashes' => 'required|array|min:1|max:50',
            'qr_hashes.*' => 'required|string',
            'contingent_id' => 'required|exists:contingents,id',
            'votes' => 'required|integer|min:1',
        ]);

        $totalVotesRequested = $request->votes;
        $contingentId = $request->contingent_id;

        $tickets = IssuedTicket::whereIn('unique_qr_hash', $request->qr_hashes)
            ->whereHas('order', fn($q) => $q->where('payment_status', 'paid'))
            ->where('vote_tokens_remaining', '>', 0)
            ->orderBy('id')
            ->get();

        if ($tickets->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada tiket dengan token voting tersedia.',
            ], 400);
        }

        $totalAvailable = $tickets->sum('vote_tokens_remaining');

        if ($totalVotesRequested > $totalAvailable) {
            return response()->json([
                'success' => false,
                'message' => "Token voting tidak mencukupi. Dibutuhkan {$totalVotesRequested}, tersedia {$totalAvailable} dari {$tickets->count()} tiket.",
            ], 400);
        }

        // Check voting day status
        $event = $tickets->first()->order->event;
        $contingent = Contingent::find($contingentId);
        $cat = $contingent->category_type;
        $isDay1 = in_array($cat, ['U16', 'Purna']);
        $isDay2 = in_array($cat, ['U12', 'U19']);

        if ($isDay1 && $event->voting_day_1_status === 'stopped') {
            return response()->json(['success' => false, 'message' => 'Voting untuk kategori Hari ke-1 (SMP & Purna) telah ditutup.'], 403);
        }
        if ($isDay2 && $event->voting_day_2_status === 'stopped') {
            return response()->json(['success' => false, 'message' => 'Voting untuk kategori Hari ke-2 (SD & SMA) telah ditutup.'], 403);
        }

        DB::transaction(function () use ($event, $tickets, $contingentId, $totalVotesRequested) {
            $remaining = $totalVotesRequested;
            $now = now();
            $voteData = [];

            foreach ($tickets as $ticket) {
                if ($remaining <= 0) break;

                $take = min($remaining, $ticket->vote_tokens_remaining);
                $ticket->decrement('vote_tokens_remaining', $take);

                for ($i = 0; $i < $take; $i++) {
                    $voteData[] = [
                        'event_id' => $event->id,
                        'issued_ticket_id' => $ticket->id,
                        'contingent_id' => $contingentId,
                        'created_at' => $now,
                    ];
                }

                $remaining -= $take;
            }

            if ($voteData) {
                VoteLog::insert($voteData);
            }

            ProcessScoreAggregationJob::dispatch($event->id);
        });

        $newTotalVoteTokens = IssuedTicket::whereIn('unique_qr_hash', $request->qr_hashes)
            ->sum('vote_tokens_remaining');

        return response()->json([
            'success' => true,
            'message' => "{$totalVotesRequested} vote berhasil dialokasikan ke {$contingent->school_name}!",
            'total_vote_tokens' => $newTotalVoteTokens,
        ]);
    }

    public function bulkClaimCoupon(Request $request)
    {
        $request->validate([
            'qr_hashes' => 'required|array|min:1|max:50',
            'qr_hashes.*' => 'required|string',
        ]);

        $tickets = IssuedTicket::whereIn('unique_qr_hash', $request->qr_hashes)
            ->where('coupon_tokens_remaining', '>', 0)
            ->get();

        if ($tickets->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada tiket dengan kupon doorprize tersedia.',
            ], 400);
        }

        $claimed = 0;

        foreach ($tickets as $ticket) {
            if ($ticket->coupon_tokens_remaining > 0) {
                $ticket->decrement('coupon_tokens_remaining');
                $claimed++;
            }
        }

        $remaining = IssuedTicket::whereIn('unique_qr_hash', $request->qr_hashes)
            ->sum('coupon_tokens_remaining');

        return response()->json([
            'success' => true,
            'message' => "{$claimed} kupon doorprize berhasil diklaim!",
            'total_coupon_tokens' => $remaining,
        ]);
    }

    public function claimCoupon(Request $request)
    {
        $request->validate([
            'qr_hash' => 'required|string',
        ]);

        $qrHash = $request->qr_hash;
        if (str_contains($qrHash, '/tickets/')) {
            $parts = explode('/tickets/', $qrHash);
            $qrHash = end($parts);
            $qrHash = strtok($qrHash, '?');
        }

        $ticket = IssuedTicket::where('unique_qr_hash', $qrHash)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Tiket tidak ditemukan.'], 404);
        }

        if ($ticket->coupon_tokens_remaining <= 0) {
            return response()->json(['success' => false, 'message' => 'Kupon doorprize sudah habis.'], 400);
        }

        $ticket->decrement('coupon_tokens_remaining');
        $ticket->decrement('sharing_tokens_remaining');

        $ticket = $ticket->fresh();

        return response()->json([
            'success' => true,
            'coupon_tokens_remaining' => $ticket->coupon_tokens_remaining,
            'sharing_tokens_remaining' => $ticket->sharing_tokens_remaining,
            'message' => 'Kupon doorprize berhasil diklaim!',
        ]);
    }

    public function claimSharing(Request $request)
    {
        $request->validate([
            'qr_hash' => 'required|string',
        ]);

        $qrHash = $request->qr_hash;
        if (str_contains($qrHash, '/tickets/')) {
            $parts = explode('/tickets/', $qrHash);
            $qrHash = end($parts);
            $qrHash = strtok($qrHash, '?');
        }

        $ticket = IssuedTicket::where('unique_qr_hash', $qrHash)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Tiket tidak ditemukan.'], 404);
        }

        if ($ticket->sharing_tokens_remaining <= 0) {
            return response()->json(['success' => false, 'message' => 'Sharing produk sudah habis.'], 400);
        }

        $ticket->decrement('sharing_tokens_remaining');

        return response()->json([
            'success' => true,
            'sharing_tokens_remaining' => $ticket->fresh()->sharing_tokens_remaining,
            'message' => 'Sharing produk berhasil diklaim!',
        ]);
    }

    public function cancelOtsOrder(Request $request)
    {
        $request->validate([
            'qr_hashes' => 'required|array|min:1|max:50',
            'qr_hashes.*' => 'required|string',
        ]);

        $ticket = IssuedTicket::with('order.issuedTickets.voteLogs', 'order.issuedTickets.supporterLogs')
            ->whereIn('unique_qr_hash', $request->qr_hashes)
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan.',
            ], 404);
        }

        $order = $ticket->order;

        if (!str_starts_with($order->payment_method ?? '', 'OTS')) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pesanan OTS yang bisa dibatalkan.',
            ], 400);
        }

        DB::transaction(function () use ($order) {
            foreach ($order->issuedTickets as $t) {
                $t->voteLogs()->delete();
                $t->supporterLogs()->delete();
                $t->forceDelete();
            }
            $order->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Pesanan OTS berhasil dibatalkan.',
        ]);
    }

    public function deleteTicket($slug, $id)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $ticket = IssuedTicket::with('order')->findOrFail($id);

        $reason = request('reason');
        if (!$reason || !trim($reason)) {
            return back()->with('status', 'Harap isi alasan penghapusan.');
        }

        DB::transaction(function () use ($ticket, $reason, $event) {
            $ticket->voteLogs()->delete();
            $ticket->supporterLogs()->delete();

            $ticket->deleted_reason = trim($reason);
            $ticket->save();
            $ticket->delete();

            ProcessScoreAggregationJob::dispatch($event->id);
        });

        return back()->with('status', 'Tiket berhasil dihapus beserta data vote & supporter terkait.');
    }

    public function seedDemoData($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $contingents = Contingent::where('event_id', $event->id)->pluck('id');

        if ($contingents->isEmpty()) {
            return back()->with('status', 'Tidak ada kontingen untuk event ini. Buat kontingen terlebih dahulu.');
        }

        $day1 = $event->date_start;
        $day2 = $event->date_end;

        // Ambil 500 tiket paid (OTS + Online) yang belum check-in
        $tickets = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
            ->where('check_in_status', false)
            ->inRandomOrder()
            ->take(500)
            ->get();

        if ($tickets->isEmpty()) {
            return back()->with('status', 'Tidak ada tiket yang bisa diisi data demo.');
        }

        $processed = 0;

        DB::transaction(function () use ($tickets, $contingents, $day1, $day2, &$processed) {
            foreach ($tickets as $ticket) {
                // Acak day 1 (70%) atau day 2 (30%)
                $useDay2 = rand(0, 100) > 70 && $day2;
                $checkDate = $useDay2 ? $day2 : $day1;

                // Jam acak 08:00 - 16:00
                $hour = rand(8, 15);
                $minute = rand(0, 59);
                $checkedAt = $checkDate->copy()->setTime($hour, $minute, rand(0, 59));

                $ticket->update([
                    'check_in_status' => true,
                    'checked_in_at' => $checkedAt,
                ]);

                // Supporter: pilih 1 kontingen acak
                $supporterContingentId = $contingents->random();
                SupporterLog::create([
                    'event_id' => $event->id,
                    'issued_ticket_id' => $ticket->id,
                    'contingent_id' => $supporterContingentId,
                    'created_at' => $checkedAt,
                    'updated_at' => $checkedAt,
                ]);

                // Vote: acak 0 - vote_tokens_remaining
                if ($ticket->vote_tokens_remaining > 0) {
                    $votesToCast = rand(0, $ticket->vote_tokens_remaining);
                    if ($votesToCast > 0) {
                        $voteData = [];
                        for ($v = 0; $v < $votesToCast; $v++) {
                            $voteData[] = [
                                'event_id' => $event->id,
                                'issued_ticket_id' => $ticket->id,
                                'contingent_id' => $contingents->random(),
                                'created_at' => $checkedAt,
                            ];
                        }
                        VoteLog::insert($voteData);
                        $ticket->decrement('vote_tokens_remaining', $votesToCast);
                    }
                }

                $processed++;
            }

            // Recalculate voting bonuses
            ProcessScoreAggregationJob::dispatch($event->id);
        });

        return back()->with('status', "Data demo berhasil diisi! {$processed} tiket telah di-check-in dengan vote & supporter acak.");
    }

    public function clearOnlineData($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        // Cascade delete: orders → issued_tickets → vote_logs → supporter_logs
        $deleted = Order::where('event_id', $event->id)
            ->where(function ($q) {
                $q->whereNull('payment_method')
                  ->orWhere('payment_method', 'not like', 'OTS%');
            })
            ->delete();

        // Recalculate voting bonuses since votes are gone
        ProcessScoreAggregationJob::dispatch($event->id);

        return back()->with('status', "Data online berhasil dihapus! {$deleted} pesanan ({$deleted} tiket berikut vote & supporter) telah dibersihkan.");
    }

    public function pollOtsPanel($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $pendingCount = Order::where('event_id', $event->id)
            ->where('payment_method', 'manual_transfer')
            ->where('payment_status', 'pending')
            ->whereNotNull('payment_proof')
            ->count();

        $totalTickets = IssuedTicket::whereHas('order', function ($q) use ($event) {
            $q->where('event_id', $event->id)->where('payment_status', 'paid');
        })->count();

        return response()->json([
            'pending_count' => $pendingCount,
            'total_tickets' => $totalTickets,
        ]);
    }

    public function pollPayments($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $pendingCount = Order::where('event_id', $event->id)
            ->where('payment_status', 'pending')
            ->whereNotNull('payment_proof')
            ->count();

        $totalTickets = IssuedTicket::whereHas('order', fn($q) => $q->where('event_id', $event->id)->where('payment_status', 'paid'))
            ->count();

        return response()->json([
            'pending_count' => $pendingCount,
            'total_tickets' => $totalTickets,
        ]);
    }

    public function showAllOrders($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $orders = Order::where('event_id', $event->id)
            ->whereIn('payment_status', ['paid', 'failed'])
            ->with(['user', 'issuedTickets.ticketPackage'])
            ->latest()
            ->get()
            ->map(function ($order) {
                $ticketCounts = $order->issuedTickets->groupBy('ticket_package_id')->map(function ($tix) {
                    return [
                        'package_name' => $tix->first()->ticketPackage?->name ?? 'Tiket',
                        'quantity' => $tix->count(),
                        'price' => $tix->first()->ticketPackage?->price ?? 0,
                    ];
                })->values();

                return [
                    'id' => $order->id,
                    'order_id' => $order->midtrans_transaction_id,
                    'user' => [
                        'name' => $order->user?->name ?? 'Spectator',
                        'email' => $order->user?->email ?? '-',
                    ],
                    'total_price' => (float) $order->total_price,
                    'payment_method' => $order->payment_method,
                    'payment_status' => $order->payment_status,
                    'payment_proof' => $order->payment_proof,
                    'rejected_reason' => $order->rejected_reason,
                    'created_at' => $order->created_at->format('d M Y H:i'),
                    'updated_at' => $order->updated_at->format('d M Y H:i'),
                    'tickets_summary' => $ticketCounts,
                ];
            });

        return Inertia::render('Admin/OrdersList', [
            'event' => $event,
            'orders' => $orders,
        ]);
    }

    public function showOrderDetail($slug, $orderId)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $order = Order::where('event_id', $event->id)
            ->where('id', $orderId)
            ->with(['user', 'issuedTickets.ticketPackage'])
            ->firstOrFail();

        $ticketSummary = $order->issuedTickets->groupBy('ticket_package_id')->map(function ($tix) {
            return [
                'package_name' => $tix->first()->ticketPackage?->name ?? 'Tiket',
                'quantity' => $tix->count(),
                'price' => $tix->first()->ticketPackage?->price ?? 0,
            ];
        })->values();

        return Inertia::render('Admin/OrderDetail', [
            'event' => $event,
            'order' => [
                'order_id' => $order->midtrans_transaction_id,
                'user' => [
                    'name' => $order->user?->name ?? 'Spectator',
                    'email' => $order->user?->email ?? '-',
                ],
                'total_price' => (float) $order->total_price,
                'payment_method' => $order->payment_method,
                'payment_status' => $order->payment_status,
                'payment_proof' => $order->payment_proof,
                'rejected_reason' => $order->rejected_reason,
                'created_at' => $order->created_at->format('d M Y H:i'),
                'updated_at' => $order->updated_at->format('d M Y H:i'),
                'tickets_summary' => $ticketSummary,
            ],
        ]);
    }

    public function updateWaContacts(Request $request, $slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        $request->validate([
            'wa_contacts' => 'nullable|array',
            'wa_contacts.*.name' => 'required|string|max:50',
            'wa_contacts.*.phone' => 'required|string|max:20',
        ]);
        $event->update(['wa_contacts' => $request->wa_contacts ?? []]);
        return back()->with('status', 'Kontak WA berhasil diperbarui.');
    }

    public function updateNotificationEmail(Request $request, $slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->firstOrFail();
        $request->validate([
            'email' => 'nullable|email|max:255',
        ]);
        $event->update(['ticket_notification_email' => $request->email]);
        return back()->with('status', 'Email notifikasi berhasil diperbarui.');
    }
}
