<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendEmailJob;
use App\Models\Event;
use App\Models\MerchandiseOrder;
use App\Models\MerchandiseProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use OpenSpout\Writer\XLSX\Writer;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;

class MerchandiseController extends Controller
{
    public function index($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $products = MerchandiseProduct::where('event_id', $event->id)->where('is_active', true)->get();

        $pendingOrders = MerchandiseOrder::where('event_id', $event->id)
            ->where('status', 'pending')
            ->whereNotNull('payment_proof')
            ->with(['user', 'contingent', 'purchases.product'])
            ->latest()
            ->take(50)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'code' => 'ORD-' . $o->id,
                'user' => [
                    'name' => $o->user?->name ?? 'Unknown',
                    'email' => $o->user?->email ?? '',
                ],
                'contingent' => [
                    'school_name' => $o->contingent?->school_name ?? 'Unknown',
                    'category_type' => $o->contingent?->category_type ?? '',
                ],
                'total_price' => $o->total_price,
                'total_points' => $o->total_points,
                'payment_proof' => $o->payment_proof,
                'items' => $o->purchases->map(fn($p) => [
                    'product_name' => $p->product?->name ?? '',
                    'quantity' => $p->quantity,
                ]),
                'created_at' => $o->created_at->format('d M Y H:i'),
            ]);

        $approvedOrders = MerchandiseOrder::where('event_id', $event->id)
            ->where('status', 'approved')
            ->with(['user', 'contingent', 'purchases.product'])
            ->latest('approved_at')
            ->take(10)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'user' => ['name' => $o->user?->name ?? 'Unknown'],
                'contingent' => [
                    'school_name' => $o->contingent?->school_name ?? 'Unknown',
                    'category_type' => $o->contingent?->category_type ?? '',
                ],
                'total_price' => $o->total_price,
                'total_points' => $o->total_points,
                'approved_at' => $o->approved_at?->format('d M H:i'),
            ]);

        $rejectedOrders = MerchandiseOrder::where('event_id', $event->id)
            ->where('status', 'rejected')
            ->with(['user', 'contingent'])
            ->latest('updated_at')
            ->take(10)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'user' => ['name' => $o->user?->name ?? 'Unknown'],
                'contingent' => ['school_name' => $o->contingent?->school_name ?? 'Unknown'],
                'total_price' => $o->total_price,
                'rejection_reason' => $o->rejection_reason,
                'rejected_at' => $o->updated_at->format('d M H:i'),
            ]);

        $categories = ['U12', 'U16', 'U19', 'Purna'];
        $leaderboard = [];
        foreach ($categories as $cat) {
            $top = MerchandiseOrder::where('merchandise_orders.event_id', $event->id)
                ->where('merchandise_orders.status', 'approved')
                ->join('contingents', 'merchandise_orders.contingent_id', '=', 'contingents.id')
                ->where('contingents.category_type', $cat)
                ->selectRaw('contingents.id, contingents.school_name, SUM(merchandise_orders.total_points) as total_points, COUNT(merchandise_orders.id) as total_orders')
                ->groupBy('contingents.id', 'contingents.school_name')
                ->orderByDesc('total_points')
                ->take(10)
                ->get()
                ->map(fn($r) => [
                    'school_name' => $r->school_name,
                    'total_points' => (int) $r->total_points,
                    'total_orders' => (int) $r->total_orders,
                ]);
            $leaderboard[$cat] = $top;
        }

        $allOrders = MerchandiseOrder::where('event_id', $event->id)
            ->with(['user', 'contingent', 'purchases.product'])
            ->latest()
            ->paginate(20)
            ->through(fn($o) => [
                'id' => $o->id,
                'buyer_name' => $o->user?->name ?? 'Unknown',
                'buyer_phone' => $o->buyer_phone,
                'school_name' => $o->contingent?->school_name ?? 'Unknown',
                'category_type' => $o->contingent?->category_type ?? '',
                'items' => $o->purchases->map(fn($p) => [
                    'product_name' => $p->product?->name ?? '',
                    'quantity' => $p->quantity,
                    'total_price' => $p->total_price,
                ])->values(),
                'total_price' => $o->total_price,
                'total_points' => $o->total_points,
                'status' => $o->status,
                'payment_proof' => $o->payment_proof,
                'created_at' => $o->created_at->format('d M H:i'),
            ]);

        $productRevenue = MerchandiseProduct::where('event_id', $event->id)
            ->where('is_active', true)
            ->with(['purchases' => function ($q) {
                $q->whereHas('order', fn($q) => $q->where('status', 'approved'));
            }])
            ->get()
            ->map(fn($p) => [
                'name' => $p->name,
                'price' => $p->price,
                'points' => $p->points,
                'total_sold' => (int) $p->purchases->sum('quantity'),
                'total_revenue' => (int) $p->purchases->sum('total_price'),
            ]);

        return Inertia::render('Admin/Merchandise', [
            'event' => $event,
            'products' => $products,
            'pendingOrders' => $pendingOrders,
            'approvedOrders' => $approvedOrders,
            'rejectedOrders' => $rejectedOrders,
            'leaderboard' => $leaderboard,
            'allOrders' => $allOrders,
            'productRevenue' => $productRevenue,
        ]);
    }

    public function approve($slug, $id)
    {
        $order = MerchandiseOrder::findOrFail($id);
        if ($order->status !== 'pending') {
            return back()->with('error', 'Pesanan sudah diproses.');
        }

        $order->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        $order->purchases()->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        // Send notification email
        if ($order->user && $order->user->email) {
            try {
                $event = Event::find($order->event_id);
                $historyUrl = url("/events/{$event->slug}/merchandise/history");
                $subject = "Pembayaran Merchandise PASGARDA Disetujui - #{$order->id}";
                $body = "Halo {$order->user->name},\n\nPembayaran merchandise Anda untuk order #{$order->id} telah disetujui oleh admin.\n\nPoin sponsor telah masuk ke kontingen pilihan Anda.\n\nLihat riwayat pembelian Anda di sini:\n{$historyUrl}\n\nTerima kasih,\nPanitia PASGARDA";
                $fromEmail = $event?->merchandise_notification_email;
                $job = $fromEmail
                    ? new SendEmailJob($order->user->email, $subject, $body, $fromEmail)
                    : new SendEmailJob($order->user->email, $subject, $body);
                dispatch($job);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to dispatch merch approval email: " . $e->getMessage());
            }
        }

        return back()->with('status', 'Pesanan disetujui! Poin sponsor telah masuk ke kontingen.');
    }

    public function reject(Request $request, $slug, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $order = MerchandiseOrder::findOrFail($id);
        if ($order->status !== 'pending') {
            return back()->with('error', 'Pesanan sudah diproses.');
        }

        $order->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        $order->purchases()->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        // Send rejection email
        if ($order->user && $order->user->email) {
            try {
                $event = Event::find($order->event_id);
                $historyUrl = url("/events/{$event->slug}/merchandise/history");
                $subject = "Pembayaran Merchandise PASGARDA Ditolak - #{$order->id}";
                $body = "Halo {$order->user->name},\n\nPembayaran merchandise Anda untuk order #{$order->id} telah ditolak oleh admin.\n\nAlasan Penolakan: {$request->reason}\n\nSilakan lihat riwayat pembelian Anda untuk informasi lebih lanjut:\n{$historyUrl}\n\nTerima kasih,\nPanitia PASGARDA";
                $fromEmail = $event?->merchandise_notification_email;
                $job = $fromEmail
                    ? new SendEmailJob($order->user->email, $subject, $body, $fromEmail)
                    : new SendEmailJob($order->user->email, $subject, $body);
                dispatch($job);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to dispatch merch rejection email: " . $e->getMessage());
            }
        }

        return back()->with('status', 'Pesanan ditolak.');
    }

    public function uploadQris(Request $request, $slug)
    {
        $request->validate([
            'qris_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();

        if ($event->qris_image && Storage::disk('public')->exists($event->qris_image)) {
            Storage::disk('public')->delete($event->qris_image);
        }

        $path = $request->file('qris_image')->store('qris', 'public');
        $event->update(['qris_image' => $path]);

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json(['message' => 'QRIS berhasil diupload!']);
        }

        return back()->with('status', 'QRIS berhasil diupload!');
    }

    public function storeProduct(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'points' => 'required|integer|min:0',
        ]);

        MerchandiseProduct::create([
            'event_id' => $event->id,
            'name' => $request->name,
            'price' => $request->price,
            'points' => $request->points,
            'is_active' => true,
        ]);

        return back()->with('status', 'Produk berhasil ditambahkan!');
    }

    public function updateProduct(Request $request, $slug, $id)
    {
        $product = MerchandiseProduct::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'points' => 'required|integer|min:0',
        ]);

        $product->update([
            'name' => $request->name,
            'price' => $request->price,
            'points' => $request->points,
        ]);

        return back()->with('status', 'Produk berhasil diupdate!');
    }

    public function destroyProduct($slug, $id)
    {
        $product = MerchandiseProduct::findOrFail($id);
        $product->delete();

        return back()->with('status', 'Produk berhasil dihapus!');
    }

    public function updateMaxPrice(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $request->validate([
            'max_merchandise_price' => 'required|integer|min:10000|max:100000000',
        ]);

        $event->update(['max_merchandise_price' => $request->max_merchandise_price]);

        return back()->with('status', 'Limit transaksi berhasil diperbarui!');
    }

    public function export($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $orders = MerchandiseOrder::where('event_id', $event->id)
            ->with(['user', 'contingent', 'purchases.product'])
            ->latest()
            ->get();

        $products = MerchandiseProduct::where('event_id', $event->id)
            ->where('is_active', true)
            ->with(['purchases' => function ($q) {
                $q->whereHas('order', fn($q) => $q->where('status', 'approved'));
            }])
            ->get();

        $categories = ['U12', 'U16', 'U19', 'Purna'];
        $categoryLabels = ['U12' => 'SD', 'U16' => 'SMP', 'U19' => 'SMA', 'Purna' => 'Purna'];

        $filename = 'transaksi_' . $slug . '_' . date('Y-m-d') . '.xlsx';

        $writer = new Writer();
        $writer->openToBrowser($filename);

        $headerStyle = new Style(
            fontBold: true,
            fontColor: Color::WHITE,
            backgroundColor: '8C6828',
            cellAlignment: CellAlignment::CENTER,
        );

        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Data Transaksi Merch');
        $sheet->setColumnWidthForRange(10, 1, 1);
        $sheet->setColumnWidthForRange(25, 2, 2);
        $sheet->setColumnWidthForRange(20, 3, 3);
        $sheet->setColumnWidthForRange(25, 4, 4);
        $sheet->setColumnWidthForRange(15, 5, 5);
        $sheet->setColumnWidthForRange(30, 6, 6);
        $sheet->setColumnWidthForRange(10, 7, 7);
        $sheet->setColumnWidthForRange(15, 8, 8);
        $sheet->setColumnWidthForRange(10, 9, 9);
        $sheet->setColumnWidthForRange(15, 10, 10);
        $sheet->setColumnWidthForRange(20, 11, 11);

        // ===================== SECTION 1: Sponsor Terbaik =====================
        $writer->addRow(Row::fromValuesWithStyle(['SPONSOR TERBAIK — PER KATEGORI'], $headerStyle));
        $writer->addRow(Row::fromValues(['Event:', $event->name]));
        $writer->addRow(Row::fromValues([]));

        foreach ($categories as $cat) {
            $label = $categoryLabels[$cat];
            $top = MerchandiseOrder::where('merchandise_orders.event_id', $event->id)
                ->where('merchandise_orders.status', 'approved')
                ->join('contingents', 'merchandise_orders.contingent_id', '=', 'contingents.id')
                ->where('contingents.category_type', $cat)
                ->selectRaw('contingents.school_name, SUM(merchandise_orders.total_points) as total_points, COUNT(merchandise_orders.id) as total_orders')
                ->groupBy('contingents.school_name')
                ->orderByDesc('total_points')
                ->get();

            $writer->addRow(Row::fromValuesWithStyle(['Kategori: ' . $label], $headerStyle));
            $writer->addRow(Row::fromValuesWithStyle(['Rank', 'Sekolah', 'Total Poin', 'Total Order'], $headerStyle));
            foreach ($top as $i => $t) {
                $writer->addRow(Row::fromValues([$i + 1, $t->school_name, (int) $t->total_points, (int) $t->total_orders]));
            }
            $writer->addRow(Row::fromValues([]));
        }

        // ===================== SECTION 2: PEMASUKAN PRODUK =====================
        $writer->addRow(Row::fromValuesWithStyle(['PEMASUKAN PRODUK'], $headerStyle));
        $writer->addRow(Row::fromValuesWithStyle(['Produk', 'Harga', 'Poin/pcs', 'Terjual', 'Pemasukan'], $headerStyle));
        $totalRevenue = 0;
        foreach ($products as $p) {
            $sold = (int) $p->purchases->sum('quantity');
            $revenue = (int) $p->purchases->sum('total_price');
            $totalRevenue += $revenue;
            $writer->addRow(Row::fromValues([$p->name, $p->price, $p->points, $sold, $revenue]));
        }
        $writer->addRow(Row::fromValuesWithStyle(['TOTAL PEMASUKAN', '', '', '', $totalRevenue], $headerStyle));
        $writer->addRow(Row::fromValues([]));

        // ===================== SECTION 3: SEMUA TRANSAKSI =====================
        $writer->addRow(Row::fromValuesWithStyle(['SEMUA TRANSAKSI'], $headerStyle));
        $writer->addRow(Row::fromValuesWithStyle([
            'ID', 'Pembeli', 'WA', 'Sekolah', 'Kategori', 'Produk', 'Jumlah',
            'Total Harga', 'Total Poin', 'Status', 'Waktu Pesan',
        ], $headerStyle));

        foreach ($orders as $o) {
            $items = $o->purchases->map(fn($p) => $p->product?->name . ' x' . $p->quantity)->implode('; ');
            $writer->addRow(Row::fromValues([
                $o->id,
                $o->user?->name ?? 'Unknown',
                $o->buyer_phone ?? '-',
                $o->contingent?->school_name ?? 'Unknown',
                $o->contingent?->category_type ?? '',
                $items,
                $o->purchases->sum('quantity'),
                $o->total_price,
                $o->total_points,
                $o->status,
                $o->created_at->format('d M Y H:i'),
            ]));
        }

        $writer->close();
    }

    public function updateMerchandiseWaContacts(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $request->validate([
            'merchandise_wa_contacts' => 'nullable|array',
            'merchandise_wa_contacts.*.name' => 'required|string|max:100',
            'merchandise_wa_contacts.*.number' => 'required|string|max:20',
        ]);

        $event->update([
            'merchandise_wa_contacts' => $request->merchandise_wa_contacts,
        ]);

        return back()->with('status', 'Kontak WA berhasil diperbarui!');
    }

    public function updateNotificationEmail(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $request->validate([
            'email' => 'nullable|email|max:255',
        ]);
        $event->update(['merchandise_notification_email' => $request->email]);
        return back()->with('status', 'Email notifikasi berhasil diperbarui!');
    }

    public function poll($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $pendingCount = MerchandiseOrder::where('event_id', $event->id)
            ->where('status', 'pending')
            ->whereNotNull('payment_proof')
            ->count();

        return response()->json([
            'pending_count' => $pendingCount,
        ]);
    }
}
