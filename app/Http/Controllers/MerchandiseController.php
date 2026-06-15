<?php

namespace App\Http\Controllers;

use App\Models\Contingent;
use App\Models\Event;
use App\Models\MerchandiseOrder;
use App\Models\MerchandiseProduct;
use App\Models\MerchandisePurchase;
use App\Jobs\SendEmailJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MerchandiseController extends Controller
{
    public function showBuy($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $user = auth()->user();

        $products = MerchandiseProduct::where('event_id', $event->id)
            ->where('is_active', true)
            ->get();

        $contingents = Contingent::where('event_id', $event->id)
            ->where('status', 'verified')
            ->orderBy('category_type')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'school_name' => $c->school_name,
                'category_type' => $c->category_type,
            ]);

        $myOrders = [];
        if ($user) {
            $myOrders = MerchandiseOrder::where('event_id', $event->id)
                ->where('user_id', $user->id)
                ->with(['purchases.product', 'contingent'])
                ->latest()
                ->get()
                ->map(fn($o) => [
                    'id' => $o->id,
                    'total_price' => $o->total_price,
                    'total_points' => $o->total_points,
                    'status' => $o->status,
                    'payment_proof' => $o->payment_proof,
                    'rejection_reason' => $o->rejection_reason,
                    'school_name' => $o->contingent?->school_name ?? '',
                    'items' => $o->purchases->map(fn($p) => [
                        'product_name' => $p->product?->name ?? '',
                        'quantity' => $p->quantity,
                    ]),
                    'created_at' => $o->created_at->format('d M H:i'),
                ]);
        }

        return Inertia::render('Event/MerchandiseBuy', [
            'event' => $event,
            'products' => $products,
            'contingents' => $contingents,
            'myOrders' => $myOrders,
        ]);
    }

    public function store(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $user = auth()->user();

        if ($event->sponsor_voting_status === 'stopped') {
            return response()->json(['error' => 'Pembelian produk sponsor ditutup.'], 422);
        }

        $validated = $request->validate([
            'contingent_id' => 'required|exists:contingents,id',
            'buyer_phone' => 'required|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:merchandise_products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $contingent = Contingent::findOrFail($validated['contingent_id']);
        if ($contingent->event_id !== $event->id) {
            return response()->json(['error' => 'Kontingen tidak valid.'], 422);
        }

        $totalPrice = 0;
        $totalPoints = 0;
        $lineItems = [];

        foreach ($validated['items'] as $item) {
            $product = MerchandiseProduct::findOrFail($item['product_id']);
            if ($product->event_id !== $event->id) {
                return response()->json(['error' => 'Produk tidak valid.'], 422);
            }
            $qty = (int) $item['quantity'];
            $price = $product->price * $qty;
            $points = $product->points * $qty;

            if (($totalPrice + $price) > $event->max_merchandise_price) {
                return response()->json(['error' => 'Maksimal Rp ' . number_format($event->max_merchandise_price, 0, ',', '.') . ' dalam 1 kali transaksi.'], 422);
            }

            $lineItems[] = [
                'product' => $product,
                'quantity' => $qty,
                'price' => $price,
                'points' => $points,
            ];
            $totalPrice += $price;
            $totalPoints += $points;
        }

        $order = MerchandiseOrder::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'buyer_phone' => $validated['buyer_phone'],
            'contingent_id' => $contingent->id,
            'total_price' => $totalPrice,
            'total_points' => $totalPoints,
            'status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);

        foreach ($lineItems as $li) {
            MerchandisePurchase::create([
                'event_id' => $event->id,
                'user_id' => $user->id,
                'contingent_id' => $contingent->id,
                'product_id' => $li['product']->id,
                'merchandise_order_id' => $order->id,
                'quantity' => $li['quantity'],
                'total_price' => $li['price'],
                'total_points' => $li['points'],
                'status' => 'pending',
            ]);
        }

        return response()->json([
            'redirect' => route('merchandise.order.detail', ['id' => $order->id]),
            'message' => 'Pesanan berhasil dibuat! Silakan upload bukti pembayaran.',
        ]);
    }

    public function history()
    {
        $orders = MerchandiseOrder::with(['purchases.product', 'contingent', 'event'])
            ->where('user_id', Auth::id())
            ->latest()
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'event' => ['slug' => $o->event->slug, 'name' => $o->event->name],
                'school_name' => $o->contingent?->school_name ?? '',
                'total_price' => $o->total_price,
                'total_points' => $o->total_points,
                'status' => $o->status,
                'items_count' => $o->purchases->sum('quantity'),
                'created_at' => $o->created_at->format('d M Y H:i'),
            ]);

        return Inertia::render('Event/MerchandiseHistory', [
            'orders' => $orders,
        ]);
    }

    public function showOrderDetail($id)
    {
        $order = MerchandiseOrder::with(['purchases.product', 'contingent', 'event'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Auto-cancel expired orders that haven't uploaded proof
        if ($order->status === 'pending' && !$order->payment_proof && $order->expires_at && now()->greaterThan($order->expires_at)) {
            $order->update(['status' => 'rejected', 'rejection_reason' => 'Pesanan dibatalkan karena melebihi batas waktu pembayaran.']);
        }

        return Inertia::render('Event/MerchandiseOrderDetail', [
            'event' => [
                'slug' => $order->event->slug,
                'name' => $order->event->name,
            ],
            'order' => [
                'id' => $order->id,
                'event' => [
                    'slug' => $order->event->slug,
                    'name' => $order->event->name,
                    'date_start' => $order->event->date_start->format('d M Y'),
                    'date_end' => $order->event->date_end->format('d M Y'),
                'venue' => $order->event->venue,
                'merchandise_wa_contacts' => $order->event->merchandise_wa_contacts ?? [],
            ],
                'school_name' => $order->contingent?->school_name ?? '',
                'total_price' => $order->total_price,
                'total_points' => $order->total_points,
                'status' => $order->status,
                'payment_proof' => $order->payment_proof,
                'rejection_reason' => $order->rejection_reason,
                'expires_at' => $order->expires_at?->toIso8601String(),
                'qris_image' => $order->event->qris_image,
                'items' => $order->purchases->map(fn($p) => [
                    'product_name' => $p->product?->name ?? '',
                    'quantity' => $p->quantity,
                    'total_price' => $p->total_price,
                ]),
                'created_at' => $order->created_at->format('d M Y H:i'),
            ],
        ]);
    }

    public function uploadPaymentProof(Request $request, $id)
    {
        $request->validate([
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);

        $order = MerchandiseOrder::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Pesanan sudah diproses.'], 422);
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

                $webpPath = 'payment_proofs/merch_' . uniqid() . '.webp';
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

            $order->update(['payment_proof' => $path]);

            // Notify admin
            $merchEvent = Event::find($order->event_id);
            if ($merchEvent && $merchEvent->merchandise_notification_email) {
                try {
                    $subject = "Bukti Pembayaran Merchandise Baru - #{$order->id}";
                    $body = "Halo Admin,\n\nSebuah pembayaran merchandise baru telah diunggah dan menunggu verifikasi.\n\nOrder ID: #{$order->id}\nNama: {$order->user->name}\nEmail: {$order->user->email}\n\nSilakan verifikasi di panel admin.";
                    dispatch(new SendEmailJob($merchEvent->merchandise_notification_email, $subject, $body));
                } catch (\Exception $e) {
                    Log::error("Failed to dispatch admin notification for merch proof: " . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Bukti pembayaran berhasil diupload!',
                'payment_proof' => $path,
            ]);
        } catch (\Exception $e) {
            Log::error('Upload payment proof failed: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal mengupload bukti pembayaran.'], 500);
        }
    }
}
