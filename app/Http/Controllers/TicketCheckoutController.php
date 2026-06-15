<?php

namespace App\Http\Controllers;

use App\Models\Contingent;
use App\Models\Event;
use App\Models\Order;
use App\Models\IssuedTicket;
use App\Models\Score;
use App\Models\Testimonial;
use App\Models\TicketPackage;
use App\Models\VoteLog;
use App\Jobs\SendEmailJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
class TicketCheckoutController extends Controller
{
    public function showTickets($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $packages = TicketPackage::where('event_id', $event->id)
            ->where('is_active', true)
            ->where('type', 'online')
            ->orderBy("price", "desc")->get();

        $onlineSold = IssuedTicket::whereHas('order', function ($q) use ($event) {
            $q->where('event_id', $event->id)
              ->where('payment_method', '!=', 'OTS')
              ->where(function ($query) {
                  $query->where('payment_status', 'paid')
                        ->orWhere(function ($sub) {
                            $sub->where('payment_status', 'pending')
                                ->whereNotNull('payment_proof');
                        });
              });
        })->count();

        $onlineLimit = $event->online_ticket_limit ?? 700;
        $isSoldOut = $onlineSold >= $onlineLimit;

        $otsPackages = TicketPackage::where('event_id', $event->id)
            ->where('is_active', true)
            ->where('type', 'ots')
            ->get(['name', 'price', 'validity_days', 'vote_allowance', 'coupon_allowance']);

        $contingents = Contingent::where('event_id', $event->id)
            ->where('status', 'verified')
            ->orderBy('category_type')
            ->orderBy('sort_order')
            ->get(['id', 'school_name', 'region', 'category_type']);

        return Inertia::render('Event/Tickets', [
            'event' => $event,
            'packages' => $packages,
            'maxLimit' => $event->max_tickets_per_user,
            'isSoldOut' => $isSoldOut,
            'onlineLimit' => $onlineLimit,
            'onlineSold' => $onlineSold,
            'otsPackages' => $otsPackages,
            'contingents' => $contingents,
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }

    public function checkout(Request $request, $slug)
    {
        $request->validate([
            'quantities' => 'required|array',
            'buyer_name' => 'required|string|max:255',
            'buyer_email' => 'required|email|max:255',
            'contingent_id' => 'required|exists:contingents,id',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        // 0. Block checkout if ticket sale is closed
        if ($event->ticket_sale_status === 'closed') {
            return back()->withErrors([
                'quantities' => 'Pembelian tiket sedang ditutup oleh penyelenggara.',
            ]);
        }

        // 0. Block coach role from purchasing spectator tickets
        if ($user->role === 'coach') {
            return back()->withErrors([
                'quantities' => 'Pelatih/Peserta terdaftar tidak diperbolehkan membeli tiket penonton.',
            ]);
        }

        // 0b. Check voting status per day
        $contingent = Contingent::findOrFail($request->contingent_id);
        $isDay1 = in_array($contingent->category_type, ['U16', 'Purna']);
        $isDay2 = in_array($contingent->category_type, ['U12', 'U19']);
        if ($isDay1 && $event->voting_day_1_status === 'stopped') {
            return back()->withErrors(['contingent_id' => 'Voting untuk kategori Hari ke-1 (SMP & Purna) telah ditutup.']);
        }
        if ($isDay2 && $event->voting_day_2_status === 'stopped') {
            return back()->withErrors(['contingent_id' => 'Voting untuk kategori Hari ke-2 (SD & SMA) telah ditutup.']);
        }

        // 1. Calculate requested total ticket quantity
        $requestedQty = 0;
        $packagesData = [];
        foreach ($request->quantities as $packageId => $qty) {
            if ($qty <= 0) continue;
            $requestedQty += $qty;
            $packagesData[$packageId] = $qty;
        }

        if ($requestedQty <= 0) {
            return back()->withErrors(['quantities' => 'Harap pilih minimal 1 tiket untuk dibeli.']);
        }

        // 2. Validate maximum limit per order
        if ($requestedQty > $event->max_tickets_per_user) {
            return back()->withErrors([
                'quantities' => "Maksimal {$event->max_tickets_per_user} tiket dalam 1 kali pembelian.",
            ]);
        }

        // 2b. Check online ticket limit
        $onlineSold = IssuedTicket::whereHas('order', function ($q) use ($event) {
            $q->where('event_id', $event->id)
              ->where('payment_method', '!=', 'OTS')
              ->where(function ($query) {
                  $query->where('payment_status', 'paid')
                        ->orWhere(function ($sub) {
                            $sub->where('payment_status', 'pending')
                                ->whereNotNull('payment_proof');
                        });
              });
        })->count();

        $onlineLimit = $event->online_ticket_limit ?? 700;

        if ($onlineSold + $requestedQty > $onlineLimit) {
            $remaining = max(0, $onlineLimit - $onlineSold);
            return back()->withErrors([
                'quantities' => "Tiket online terbatas. Tersedia {$remaining} tiket lagi dari kuota {$onlineLimit}. Beli di lokasi (OTS) untuk paket Gold/Platinum.",
            ]);
        }

        // 3. Validate packages: active, online only, stock available, and calculate price
        $totalPrice = 0;
        $validatedPackages = [];
        foreach ($packagesData as $packageId => $qty) {
            $package = TicketPackage::where('id', $packageId)
                ->where('event_id', $event->id)
                ->where('is_active', true)
                ->where('type', 'online')
                ->first();

            if (!$package) {
                return back()->withErrors(['quantities' => "Paket tiket tidak valid atau tidak aktif."]);
            }

            // Stock check (null = unlimited)
            if ($package->stock !== null && $package->stock < $qty) {
                $sisa = $package->stock;
                return back()->withErrors([
                    'quantities' => "Stok paket {$package->name} tidak mencukupi. Tersedia {$sisa} tiket.",
                ]);
            }

            $totalPrice += $package->price * $qty;
            $validatedPackages[] = ['package' => $package, 'qty' => $qty];
        }

        // 4. Idempotency: prevent duplicate submission within 30 seconds
        $recentOrder = Order::where('user_id', $user->id)
            ->where('event_id', $event->id)
            ->where('contingent_id', $request->contingent_id)
            ->where('total_price', $totalPrice)
            ->where('created_at', '>=', now()->subSeconds(30))
            ->whereIn('payment_status', ['pending', 'paid'])
            ->first();

        if ($recentOrder) {
            return response()->json([
                'success' => true,
                'order_id' => $recentOrder->midtrans_transaction_id,
                'db_order_id' => $recentOrder->id,
                'message' => 'Pesanan sudah ada. Silakan lanjutkan pembayaran.',
            ]);
        }

        // 5. Create order with retry on ID collision
        $maxAttempts = 3;
        $orderCreated = false;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $orderId = 'ORD-' . strtoupper(Str::random(10));

            try {
                DB::transaction(function () use ($user, $event, $orderId, $totalPrice, $request, $validatedPackages) {
                    // Decrement stock atomically (only for limited-stock packages)
                    foreach ($validatedPackages as $vp) {
                        $package = $vp['package'];
                        $qty = $vp['qty'];
                        if ($package->stock !== null) {
                            $affected = TicketPackage::where('id', $package->id)
                                ->where('stock', '>=', $qty)
                                ->decrement('stock', $qty);
                            if (!$affected) {
                                throw new \RuntimeException("Stok paket {$package->name} habis.");
                            }
                        }
                    }

                    $order = Order::create([
                        'user_id' => $user->id,
                        'event_id' => $event->id,
                        'midtrans_transaction_id' => $orderId,
                        'total_price' => $totalPrice,
                        'payment_status' => 'pending',
                        'payment_method' => 'qris',
                        'contingent_id' => $request->contingent_id,
                        'expires_at' => now()->addHour(),
                    ]);

                    foreach ($validatedPackages as $vp) {
                        $package = $vp['package'];
                        $qty = $vp['qty'];

                        for ($i = 0; $i < $qty; $i++) {
                            $ticket = IssuedTicket::create([
                                'order_id' => $order->id,
                                'ticket_package_id' => $package->id,
                                'unique_qr_hash' => 'TKT-' . Str::random(24),
                                'buyer_name' => $request->buyer_name,
                                'buyer_email' => $request->buyer_email,
                                'check_in_status' => false,
                                'vote_tokens_remaining' => $package->vote_allowance,
                                'days_remaining' => $package->validity_days,
                                'coupon_tokens_remaining' => $package->coupon_allowance,
                                'sharing_tokens_remaining' => $package->sharing_allowance,
                                'supporter_tokens_remaining' => 0,
                                'supporter_contingent_id' => $request->contingent_id,
                            ]);

                            // Vote & Supporter records will be created on admin approval
                        }
                    }
                });
  
                $orderCreated = true;
                break;
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() !== '23000' || $attempt >= $maxAttempts) {
                    throw $e;
                }
                // Collision — retry with new ID
            }
        }

        if (!$orderCreated) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat pesanan. Silakan coba lagi.',
            ], 500);
        }

        $dbOrder = Order::where('midtrans_transaction_id', $orderId)->first();

        return response()->json([
            'success' => true,
            'order_id' => $orderId,
            'db_order_id' => $dbOrder?->id,
            'message' => 'Checkout berhasil! Silakan scan QRIS dan unggah bukti pembayaran.',
        ]);
    }

    private function handleMockCheckout($event, $user, $quantities, $totalPrice, $buyerName, $buyerEmail)
    {
        // Build validated packages list
        $validatedPackages = [];
        foreach ($quantities as $packageId => $qty) {
            if ($qty <= 0) continue;
            $package = TicketPackage::where('id', $packageId)
                ->where('event_id', $event->id)
                ->where('is_active', true)
                ->first();
            if (!$package) continue;
            $validatedPackages[] = ['package' => $package, 'qty' => $qty];
        }

        $maxAttempts = 3;
        $orderCreated = false;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $orderId = 'MOCK-' . strtoupper(Str::random(10));

            try {
                DB::transaction(function () use ($user, $event, $orderId, $totalPrice, $validatedPackages, $buyerName, $buyerEmail) {
                    // Decrement stock atomically
                    foreach ($validatedPackages as $vp) {
                        $package = $vp['package'];
                        $qty = $vp['qty'];
                        if ($package->stock !== null) {
                            TicketPackage::where('id', $package->id)
                                ->where('stock', '>=', $qty)
                                ->decrement('stock', $qty);
                        }
                    }

                    $order = Order::create([
                        'user_id' => $user->id,
                        'event_id' => $event->id,
                        'midtrans_transaction_id' => $orderId,
                        'total_price' => $totalPrice,
                        'payment_status' => 'paid',
                        'payment_method' => 'simulation_mock',
                    ]);

                    foreach ($validatedPackages as $vp) {
                        $package = $vp['package'];
                        $qty = $vp['qty'];

                        for ($i = 0; $i < $qty; $i++) {
                            IssuedTicket::create([
                                'order_id' => $order->id,
                                'ticket_package_id' => $package->id,
                                'unique_qr_hash' => 'TKT-' . Str::random(24),
                                'buyer_name' => $buyerName,
                                'buyer_email' => $buyerEmail,
                                'check_in_status' => false,
                                'vote_tokens_remaining' => $package->vote_allowance,
                                'days_remaining' => $package->validity_days,
                                'coupon_tokens_remaining' => $package->coupon_allowance,
                                'sharing_tokens_remaining' => $package->sharing_allowance,
                                'supporter_tokens_remaining' => 0,
                            ]);
                        }
                    }
                });
  
                $orderCreated = true;
                break;
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() !== '23000' || $attempt >= $maxAttempts) {
                    throw $e;
                }
            }
        }

        return response()->json([
            'mock_success' => $orderCreated,
            'order_id' => $orderId ?? null,
            'message' => $orderCreated
                ? 'Simulasi Pembayaran Berhasil! Tiket Anda telah diterbitkan.'
                : 'Gagal membuat pesanan. Silakan coba lagi.',
        ]);
    }

    public function myTickets()
    {
        $user = Auth::user();
        $activeEvent = Event::where('status', 'active')->first();

        // Fetch ALL orders for the compact order list
        $allOrders = Order::where('user_id', $user->id)
            ->with(['event', 'issuedTickets.ticketPackage'])
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
                    'total_price' => (float) $order->total_price,
                    'payment_status' => $order->payment_status,
                    'payment_proof' => $order->payment_proof,
                    'rejected_reason' => $order->rejected_reason,
                    'created_at' => $order->created_at->format('d M Y H:i'),
                    'event_name' => $order->event?->name ?? 'Event',
                    'event_slug' => $order->event?->slug ?? '',
                    'tickets_summary' => $ticketCounts,
                    'total_tickets' => $order->issuedTickets->count(),
                ];
            });

        $tickets = IssuedTicket::whereHas('order', function ($q) use ($user) {
            $q->where('user_id', $user->id)->where('payment_status', 'paid');
        })
            ->with(['ticketPackage', 'order.event'])
            ->latest()
            ->get();

        // Group by event for display
        $groupedTickets = $tickets->groupBy(fn ($t) => $t->order->event_id);

        // Fetch user's testimonial if exists
        $testimonial = Testimonial::where('user_id', $user->id)->first();

        // Preload contingents per event for vote modal
        $eventIds = $groupedTickets->keys();
        $contingentsByEvent = Contingent::whereIn('event_id', $eventIds)
            ->where('status', 'verified')
            ->orderBy('sort_order')
            ->get(['id', 'event_id', 'school_name', 'region', 'category_type'])
            ->groupBy('event_id');

        return Inertia::render('Event/MyTickets', [
            'activeEvent' => $activeEvent,
            'allOrders' => $allOrders,
            'testimonial' => $testimonial ? [
                'id' => $testimonial->id,
                'rating' => $testimonial->rating,
                'message' => $testimonial->message,
                'status' => $testimonial->status,
            ] : null,
            'groupedTickets' => $groupedTickets->map(fn ($tix, $eventId) => [
                'event' => [
                    'id' => $tix->first()->order->event->id,
                    'name' => $tix->first()->order->event->name,
                    'slug' => $tix->first()->order->event->slug,
                    'date_start' => $tix->first()->order->event->date_start->format('d M Y'),
                    'date_end' => $tix->first()->order->event->date_end->format('d M Y'),
                    'venue' => $tix->first()->order->event->venue,
                ],
                'tickets' => $tix->map(fn ($t) => [
                    'id' => $t->id,
                    'order_id' => $t->order->id,
                    'order_created_at' => $t->order->created_at->format('d M Y H:i'),
                    'unique_qr_hash' => $t->unique_qr_hash,
                    'buyer_name' => $t->buyer_name,
                    'package_name' => $t->ticketPackage?->name ?? '-',
                    'check_in_status' => $t->check_in_status,
                    'checked_in_at' => $t->checked_in_at?->format('d M Y H:i'),
                    'days_remaining' => $t->days_remaining,
                    'validity_days' => $t->ticketPackage?->validity_days ?? 0,
                    'vote_tokens_remaining' => $t->vote_tokens_remaining,
                    'coupon_tokens_remaining' => $t->coupon_tokens_remaining,
                    'sharing_tokens_remaining' => $t->sharing_tokens_remaining,
                    'supporter_tokens_remaining' => $t->supporter_tokens_remaining,
                    'created_at' => $t->created_at->format('d M Y'),
                ]),
            ])->values(),
            'contingentsByEvent' => $contingentsByEvent->map(fn ($c, $eventId) => [
                'event_id' => (int) $eventId,
                'contingents' => $c->map(fn ($con) => [
                    'id' => $con->id,
                    'school_name' => $con->school_name,
                    'region' => $con->region,
                    'category_type' => $con->category_type,
                ])->values(),
            ])->values(),
        ]);
    }

    public function showOrderDetail($id)
    {
        $user = Auth::user();
        $order = Order::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['event', 'issuedTickets.ticketPackage'])
            ->firstOrFail();

        // Auto-cancel expired orders that haven't uploaded proof
        if ($order->payment_status === 'pending' && !$order->payment_proof && $order->expires_at && now()->greaterThan($order->expires_at)) {
            DB::transaction(function () use ($order) {
                $ticketsByPackage = $order->issuedTickets->groupBy('ticket_package_id');
                foreach ($ticketsByPackage as $packageId => $tickets) {
                    TicketPackage::where('id', $packageId)->increment('stock', $tickets->count());
                }
                $order->update(['payment_status' => 'failed', 'rejected_reason' => 'Pesanan dibatalkan karena melebihi batas waktu pembayaran.']);
            });
        }

        $ticketsSummary = $order->issuedTickets->groupBy('ticket_package_id')->map(function ($tix) {
            return [
                'package_name' => $tix->first()->ticketPackage?->name ?? 'Tiket',
                'quantity' => $tix->count(),
                'price' => $tix->first()->ticketPackage?->price ?? 0,
                'vote_allowance' => $tix->first()->ticketPackage?->vote_allowance ?? 0,
                'validity_days' => $tix->first()->ticketPackage?->validity_days ?? 0,
                'coupon_allowance' => $tix->first()->ticketPackage?->coupon_allowance ?? 0,
                'sharing_allowance' => $tix->first()->ticketPackage?->sharing_allowance ?? 0,
            ];
        })->values();

        $tickets = $order->issuedTickets->map(fn ($t) => [
            'id' => $t->id,
            'unique_qr_hash' => $t->unique_qr_hash,
            'buyer_name' => $t->buyer_name,
            'package_name' => $t->ticketPackage?->name ?? '-',
            'check_in_status' => $t->check_in_status,
            'days_remaining' => $t->days_remaining,
            'vote_tokens_remaining' => $t->vote_tokens_remaining,
        ]);

        return Inertia::render('Event/OrderPayment', [
            'order' => [
                'id' => $order->id,
                'order_id' => $order->midtrans_transaction_id,
                'total_price' => (float) $order->total_price,
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                'payment_proof' => $order->payment_proof,
                'rejected_reason' => $order->rejected_reason,
                'expires_at' => $order->expires_at?->toIso8601String(),
                'created_at' => $order->created_at->format('d M Y H:i'),
                'tickets_summary' => $ticketsSummary,
                'total_tickets' => $order->issuedTickets->count(),
            ],
            'tickets' => $tickets,
            'event' => $order->event ? [
                'id' => $order->event->id,
                'name' => $order->event->name,
                'slug' => $order->event->slug,
                'date_start' => $order->event->date_start->format('d M Y'),
                'date_end' => $order->event->date_end->format('d M Y'),
                'venue' => $order->event->venue,
                'wa_contacts' => $order->event->wa_contacts,
            ] : null,
        ]);
    }

    public function uploadPaymentProof(Request $request, $orderId)
    {
        $request->validate([
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);

        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Order ini sudah berstatus Lunas.'], 422);
        }

        try {
            if ($order->payment_proof && Storage::disk('public')->exists($order->payment_proof)) {
                Storage::disk('public')->delete($order->payment_proof);
            }

            $uploadedFile = $request->file('payment_proof');
            $tempPath = $uploadedFile->path();
            $mime = $uploadedFile->getMimeType();

            try {
                switch ($mime) {
                    case 'image/jpeg':
                    case 'image/jpg':
                        $src = @imagecreatefromjpeg($tempPath);
                        break;
                    case 'image/png':
                        $src = @imagecreatefrompng($tempPath);
                        break;
                    case 'image/webp':
                        $src = @imagecreatefromwebp($tempPath);
                        break;
                    default:
                        throw new \Exception('Format gambar tidak didukung.');
                }

                if (!$src) {
                    throw new \Exception('Gagal membaca file gambar.');
                }

                $webpPath = 'payment_proofs/' . uniqid('proof_') . '.webp';
                $storagePath = storage_path('app/public/' . $webpPath);
                $dir = dirname($storagePath);
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }

                imagewebp($src, $storagePath, 80);
                imagedestroy($src);

                $path = $webpPath;
            } catch (\Exception $e) {
                Log::error('WebP conversion failed: ' . $e->getMessage());
                $path = $uploadedFile->store('payment_proofs', 'public');
                if (!$path) {
                    return response()->json(['message' => 'Gagal menyimpan file. Periksa izin folder storage.'], 500);
                }
            }

            $order->update([
                'payment_proof' => $path,
                'payment_status' => 'pending',
                'rejected_reason' => null,
            ]);

            // Notify admin
            if ($order->event && $order->event->ticket_notification_email) {
                try {
                    $subject = "Bukti Pembayaran Tiket Baru - {$order->midtrans_transaction_id}";
                    $body = "Halo Admin,\n\nSebuah pembayaran tiket baru telah diunggah dan menunggu verifikasi.\n\nOrder ID: {$order->midtrans_transaction_id}\nNama: {$order->user->name}\nEmail: {$order->user->email}\nTotal: Rp " . number_format($order->total_price, 0, ',', '.') . "\n\nSilakan verifikasi di panel admin.";
                    dispatch(new SendEmailJob($order->event->ticket_notification_email, $subject, $body));
                } catch (\Exception $e) {
                    Log::error("Failed to dispatch admin notification for ticket proof: " . $e->getMessage());
                }
            }

            return response()->json(['success' => true, 'message' => 'Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.']);
        } catch (\Exception $e) {
            Log::error('Upload payment proof failed: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal mengunggah bukti transfer. Coba file dengan ukuran lebih kecil atau format berbeda.'], 500);
        }
    }

    public function cancelOrder($id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Tidak dapat membatalkan pesanan yang sudah lunas.'], 422);
        }

        if ($order->payment_proof) {
            return response()->json(['message' => 'Tidak dapat membatalkan pesanan yang sudah diunggah bukti pembayarannya. Hubungi admin.'], 422);
        }

        DB::transaction(function () use ($order) {
            $order->load('issuedTickets');
            $ticketsByPackage = $order->issuedTickets->groupBy('ticket_package_id');
            foreach ($ticketsByPackage as $packageId => $tickets) {
                TicketPackage::where('id', $packageId)->increment('stock', $tickets->count());
            }
            $order->issuedTickets()->delete();
            if ($order->payment_proof && Storage::disk('public')->exists($order->payment_proof)) {
                Storage::disk('public')->delete($order->payment_proof);
            }
            $order->delete();
        });

        return response()->json(['success' => true]);
    }

    public function voteOnline(Request $request)
    {
        $request->validate([
            'ticket_id' => 'required|exists:issued_tickets,id',
            'allocations' => 'nullable|array|min:1',
            'allocations.*.contingent_id' => 'required_with:allocations|exists:contingents,id',
            'allocations.*.votes' => 'required_with:allocations|integer|min:1',
            'contingent_id' => 'required_without:allocations|exists:contingents,id',
        ]);

        $user = Auth::user();
        $ticket = IssuedTicket::with('order.event')->findOrFail($request->ticket_id);

        if ($ticket->order->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Tiket ini bukan milik Anda.'], 403);
        }

        if ($ticket->order->payment_status !== 'paid') {
            return response()->json(['success' => false, 'message' => 'Tiket belum dibayar.'], 400);
        }

        // If single contingent_id provided (all-in), allocate all remaining tokens
        if ($request->contingent_id) {
            $contingentId = $request->contingent_id;
            $totalVotesRequested = $ticket->vote_tokens_remaining;

            // Self-Voting Prevention
            $ownContingent = Contingent::where('id', $contingentId)
                ->where(function ($query) use ($user) {
                    $query->where('coach_email', $user->email)
                          ->orWhere('coach_name', $user->name);
                })
                ->exists();

            if ($ownContingent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pencegahan Self-Voting: Anda dilarang memberikan suara untuk sekolah/kontingen Anda sendiri.',
                ], 403);
            }

            if ($totalVotesRequested <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada token suara yang tersedia.',
                ], 400);
            }

            $event = $ticket->order->event;

            // Check voting day status
            $contingent = Contingent::findOrFail($contingentId);
            $isDay1 = in_array($contingent->category_type, ['U16', 'Purna']);
            $isDay2 = in_array($contingent->category_type, ['U12', 'U19']);
            if ($isDay1 && $event->voting_day_1_status === 'stopped') {
                return response()->json(['success' => false, 'message' => 'Voting untuk kategori Hari ke-1 (SMP & Purna) telah ditutup.'], 403);
            }
            if ($isDay2 && $event->voting_day_2_status === 'stopped') {
                return response()->json(['success' => false, 'message' => 'Voting untuk kategori Hari ke-2 (SD & SMA) telah ditutup.'], 403);
            }

            DB::transaction(function () use ($event, $ticket, $contingentId, $totalVotesRequested) {
                $ticket->decrement('vote_tokens_remaining', $totalVotesRequested);

                $voteData = [];
                $now = now();
                for ($i = 0; $i < $totalVotesRequested; $i++) {
                    $voteData[] = [
                        'event_id' => $event->id,
                        'issued_ticket_id' => $ticket->id,
                        'contingent_id' => $contingentId,
                        'created_at' => $now,
                    ];
                }
                VoteLog::insert($voteData);

                Score::recalculateVotingBonuses($event->id);
            });

            return response()->json([
                'success' => true,
                'vote_tokens_remaining' => $ticket->fresh()->vote_tokens_remaining,
                'message' => "{$totalVotesRequested} suara berhasil diberikan!",
            ]);
        }

        // Legacy: multi-allocation array (still supported)
        // Self-Voting Prevention
        $contingentIds = collect($request->allocations)->pluck('contingent_id');
        $ownContingent = Contingent::whereIn('id', $contingentIds)
            ->where(function ($query) use ($user) {
                $query->where('coach_email', $user->email)
                      ->orWhere('coach_name', $user->name);
            })
            ->exists();

        if ($ownContingent) {
            return response()->json([
                'success' => false,
                'message' => 'Pencegahan Self-Voting: Anda dilarang memberikan suara untuk sekolah/kontingen Anda sendiri.',
            ], 403);
        }

        $totalVotesRequested = collect($request->allocations)->sum('votes');

        if ($totalVotesRequested > $ticket->vote_tokens_remaining) {
            return response()->json([
                'success' => false,
                'message' => "Suara tidak mencukupi. Dibutuhkan {$totalVotesRequested}, tersedia {$ticket->vote_tokens_remaining}.",
            ], 400);
        }

        $event = $ticket->order->event;

        // Check voting day status for each allocation
        $allocContingents = Contingent::whereIn('id', $contingentIds)->pluck('category_type', 'id');
        foreach ($request->allocations as $allocation) {
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

        DB::transaction(function () use ($event, $ticket, $request, $totalVotesRequested) {
            $ticket->decrement('vote_tokens_remaining', $totalVotesRequested);

            $voteData = [];
            $now = now();
            foreach ($request->allocations as $allocation) {
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

            Score::recalculateVotingBonuses($event->id);
        });

        return response()->json([
            'success' => true,
            'vote_tokens_remaining' => $ticket->fresh()->vote_tokens_remaining,
            'message' => "{$totalVotesRequested} suara berhasil diberikan!",
        ]);
    }

    public function showVotePage($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        // Aggregate total vote tokens from all PAID tickets of this user for this event
        $userTickets = IssuedTicket::whereHas('order', function ($q) use ($user, $event) {
            $q->where('user_id', $user->id)
              ->where('event_id', $event->id)
              ->where('payment_status', 'paid');
        })->get(['id', 'vote_tokens_remaining', 'ticket_package_id']);

        $totalVotes = $userTickets->sum('vote_tokens_remaining');

        // Get verified contingents
        $contingents = Contingent::where('event_id', $event->id)
            ->where('status', 'verified')
            ->orderBy('sort_order')
            ->get(['id', 'school_name', 'region', 'category_type']);

        // Which contingents the current user voted for
        $votedContingentIds = [];
        if (auth()->check()) {
            $votedContingentIds = \App\Models\VoteLog::whereHas('issuedTicket.order', function ($q) use ($user, $event) {
                $q->where('user_id', $user->id)->where('event_id', $event->id);
            })->pluck('contingent_id')->unique()->values()->toArray();
        }

        return Inertia::render('Event/VotePage', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'slug' => $event->slug,
                'voting_status' => $event->voting_status,
            ],
            'totalVotes' => $totalVotes,
            'ticketIds' => $userTickets->pluck('id')->values(),
            'votedContingentIds' => $votedContingentIds,
            'contingents' => $contingents->map(fn ($c) => [
                'id' => $c->id,
                'school_name' => $c->school_name,
                'region' => $c->region,
                'category_type' => $c->category_type,
            ])->values(),
            'auth' => ['user' => auth()->user()],
        ]);
    }

    public function votePooled(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'contingent_id' => 'required|exists:contingents,id',
            'votes' => 'required|integer|min:1',
        ]);

        $user = Auth::user();
        $eventId = $request->event_id;
        $contingentId = $request->contingent_id;
        $votesRequested = $request->votes;

        // Check voting day status
        $event = \App\Models\Event::find($eventId);
        $contingent = Contingent::findOrFail($contingentId);
        $isDay1 = in_array($contingent->category_type, ['U16', 'Purna']);
        $isDay2 = in_array($contingent->category_type, ['U12', 'U19']);
        if ($isDay1 && $event && $event->voting_day_1_status === 'stopped') {
            return response()->json([
                'success' => false,
                'message' => 'Voting untuk kategori Hari ke-1 (SMP & Purna) telah ditutup.',
            ], 403);
        }
        if ($isDay2 && $event && $event->voting_day_2_status === 'stopped') {
            return response()->json([
                'success' => false,
                'message' => 'Voting untuk kategori Hari ke-2 (SD & SMA) telah ditutup.',
            ], 403);
        }

        // Self-voting prevention
        $ownContingent = Contingent::where('id', $contingentId)
            ->where(function ($query) use ($user) {
                $query->where('coach_email', $user->email)
                      ->orWhere('coach_name', $user->name);
            })
            ->exists();

        if ($ownContingent) {
            return response()->json([
                'success' => false,
                'message' => 'Pencegahan Self-Voting: Anda dilarang memberikan suara untuk kontingen Anda sendiri.',
            ], 403);
        }

        // Get all paid tickets with remaining tokens, ordered by id
        $tickets = IssuedTicket::whereHas('order', function ($q) use ($user, $eventId) {
            $q->where('user_id', $user->id)
              ->where('event_id', $eventId)
              ->where('payment_status', 'paid');
        })->where('vote_tokens_remaining', '>', 0)
          ->orderBy('id')
          ->get();

        $totalAvailable = $tickets->sum('vote_tokens_remaining');

        if ($votesRequested > $totalAvailable) {
            return response()->json([
                'success' => false,
                'message' => "Suara tidak mencukupi. Diminta {$votesRequested}, tersedia {$totalAvailable}.",
            ], 400);
        }

        DB::transaction(function () use ($tickets, $contingentId, $votesRequested, $eventId) {
            $remaining = $votesRequested;
            $voteData = [];
            $now = now();

            foreach ($tickets as $ticket) {
                if ($remaining <= 0) break;

                $drain = min($remaining, $ticket->vote_tokens_remaining);
                $ticket->decrement('vote_tokens_remaining', $drain);
                $remaining -= $drain;

                for ($i = 0; $i < $drain; $i++) {
                    $voteData[] = [
                        'event_id' => $eventId,
                        'issued_ticket_id' => $ticket->id,
                        'contingent_id' => $contingentId,
                        'created_at' => $now,
                    ];
                }
            }

            if ($voteData) {
                VoteLog::insert($voteData);
            }

            Score::recalculateVotingBonuses($eventId);
        });

        // Recalculate total remaining
        $newTotal = IssuedTicket::whereHas('order', function ($q) use ($user, $eventId) {
            $q->where('user_id', $user->id)
              ->where('event_id', $eventId)
              ->where('payment_status', 'paid');
        })->sum('vote_tokens_remaining');

        return response()->json([
            'success' => true,
            'total_remaining' => $newTotal,
            'message' => "{$votesRequested} suara berhasil diberikan!",
        ]);
    }
}
