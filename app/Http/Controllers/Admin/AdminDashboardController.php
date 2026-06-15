<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Contingent;
use App\Models\Order;
use App\Models\IssuedTicket;
use App\Models\MerchandiseSale;
use App\Models\RolePermission;
use App\Models\SocialMediaLike;
use App\Models\VoteLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    private function getEventSettings(Event $event): array
    {
        $path = "settings/{$event->id}.json";
        if (!Storage::exists($path)) {
            return ['final_tab_status' => 'show'];
        }
        return json_decode(Storage::get($path), true) ?? ['final_tab_status' => 'show'];
    }

    private function saveEventSetting(Event $event, string $key, string $value): void
    {
        $path = "settings/{$event->id}.json";
        $settings = $this->getEventSettings($event);
        $settings[$key] = $value;
        Storage::put($path, json_encode($settings));
    }
    public function index($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        // 1. Core analytics (cached 60s)
        $cacheKey = "dashboard_stats_{$event->id}";
        $stats = Cache::remember($cacheKey, 60, function () use ($event) {
            $totalOrders = Order::where('event_id', $event->id)->where('payment_status', 'paid')->count();
            $ticketRevenue = Order::where('event_id', $event->id)->where('payment_status', 'paid')->sum('total_price');
            $merchRevenue = (float) DB::table('merchandise_orders')->where('event_id', $event->id)->where('status', 'approved')->sum('total_price');
            $totalRevenue = $ticketRevenue + $merchRevenue;
            $totalTicketsSold = IssuedTicket::whereHas('order', function ($q) use ($event) {
                $q->where('event_id', $event->id)->where('payment_status', 'paid');
            })->count();
            $totalOnlineTickets = IssuedTicket::whereHas('order', function ($q) use ($event) {
                $q->where('event_id', $event->id)->where('payment_method', 'not like', 'OTS%')->where('payment_status', 'paid');
            })->count();
            $totalOtsTickets = $totalTicketsSold - $totalOnlineTickets;
            $totalVotesCast = VoteLog::where('event_id', $event->id)->count();

            return compact(
                'totalOrders', 'totalRevenue', 'totalTicketsSold',
                'totalOnlineTickets', 'totalOtsTickets', 'totalVotesCast'
            );
        });

        extract($stats);

        // 2. Statistics charts/tables data
        $contingents = Contingent::where('event_id', $event->id)->orderBy('sort_order')->get();
        $recentOrders = Order::where('event_id', $event->id)
            ->with('user')
            ->latest()
            ->take(5)
            ->get();

        // Active admins (recently active, <5 min)
        $activeAdmins = User::whereIn('role', ['super_admin', 'admin', 'operator_gate', 'operator_nilai', 'operator_produk'])
            ->where('last_login_at', '>=', now()->subMinutes(5))
            ->orderBy('last_login_at', 'desc')
            ->get(['id', 'name', 'role', 'avatar', 'last_login_at']);

        // Seed default role permissions if not yet set
        if (!RolePermission::where('event_id', $event->id)->exists()) {
            RolePermission::seedDefaults($event->id);
        } else {
            RolePermission::ensureModulesExist($event->id);
        }
        $rolePermissions = RolePermission::getRolePermissions($event->id);

        $event->voting_day_1_status = $event->voting_day_1_status ?? 'active';
        $event->voting_day_2_status = $event->voting_day_2_status ?? 'active';

        $eventSettings = $this->getEventSettings($event);

        return Inertia::render('Admin/Dashboard', [
            'event' => $event,
            'finalTabStatus' => $eventSettings['final_tab_status'],
            'rolePermissions' => $rolePermissions,
            'stats' => [
                'total_orders' => $totalOrders,
                'total_revenue' => (float) $totalRevenue,
                'total_tickets_sold' => $totalTicketsSold,
                'total_online_tickets' => $totalOnlineTickets,
                'total_ots_tickets' => $totalOtsTickets,
                'total_votes_cast' => $totalVotesCast,
            ],
            'contingentsCount' => $contingents->count(),
            'recentOrders' => $recentOrders,
            'activeAdmins' => $activeAdmins,
        ]);
    }

    public function showMerchandisePanel($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $contingents = Contingent::where('event_id', $event->id)->orderBy('sort_order')->get();

        $sales = MerchandiseSale::where('event_id', $event->id)
            ->with('contingent')
            ->latest()
            ->get();

        $merchLeaderboard = MerchandiseSale::where('event_id', $event->id)
            ->selectRaw('contingent_id, SUM(qty) as total_qty')
            ->with('contingent')
            ->groupBy('contingent_id')
            ->get()
            ->filter(fn ($s) => $s->contingent)
            ->groupBy(fn ($s) => $s->contingent->category_type)
            ->map(fn ($items) => $items->sortByDesc('total_qty')->values());

        return Inertia::render('Admin/Merchandise', [
            'event' => $event,
            'contingents' => $contingents,
            'sales' => $sales,
            'merchLeaderboard' => $merchLeaderboard,
        ]);
    }

    public function storeMerchandise(Request $request, $slug)
    {
        $request->validate([
            'contingent_id' => 'required|exists:contingents,id',
            'buyer_name' => 'required|string|max:255',
            'qty' => 'required|integer|min:1',
            'total_price' => 'required|numeric|min:0',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();

        MerchandiseSale::create([
            'event_id' => $event->id,
            'contingent_id' => $request->contingent_id,
            'buyer_name' => $request->buyer_name,
            'qty' => $request->qty,
            'total_price' => $request->total_price,
        ]);

        return back()->with('status', 'Penjualan Merchandise offline berhasil dicatat!');
    }

    public function clearMerchandise($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        MerchandiseSale::where('event_id', $event->id)->delete();

        return back()->with('status', 'Semua riwayat penjualan merchandise berhasil dihapus!');
    }

    public function showSocialMediaPanel($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $contingents = Contingent::where('event_id', $event->id)
            ->with('socialMediaLike')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Admin/SocialMedia', [
            'event' => $event,
            'contingents' => $contingents,
        ]);
    }

    public function storeSocialMediaLikes(Request $request, $slug)
    {
        $request->validate([
            'contingent_id' => 'required|exists:contingents,id',
            'likes_count_reels' => 'required|integer|min:0',
            'likes_count_posts' => 'required|integer|min:0',
        ]);

        SocialMediaLike::updateOrCreate(
            ['contingent_id' => $request->contingent_id],
            [
                'likes_count_reels' => $request->likes_count_reels,
                'likes_count_posts' => $request->likes_count_posts,
            ]
        );

        return back()->with('status', 'Likes Instagram berhasil diperbarui!');
    }

    public function toggleLeaderboard(Request $request, $slug)
    {
        $request->validate([
            'leaderboard_status' => 'required|in:draft,published',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $event->update(['leaderboard_status' => $request->leaderboard_status]);

        return back()->with('status', 'Status rilis leaderboard utama berhasil diperbarui!');
    }



    public function toggleSupporter(Request $request, $slug)
    {
        $request->validate([
            'supporter_status' => 'required|in:active,stopped',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $event->update(['supporter_status' => $request->supporter_status]);

        $msg = $request->supporter_status === 'stopped' ? 'Supporter telah dihentikan!' : 'Supporter telah diaktifkan kembali!';
        return back()->with('status', $msg);
    }

    public function toggleVotingDay1(Request $request, $slug)
    {
        $request->validate(['status' => 'required|in:active,stopped']);
        $event = Event::where('slug', $slug)->firstOrFail();
        $event->update(['voting_day_1_status' => $request->status]);
        $msg = $request->status === 'stopped' ? 'Voting Hari ke-1 (SMP & Purna) dihentikan!' : 'Voting Hari ke-1 (SMP & Purna) diaktifkan!';
        return back()->with('status', $msg);
    }

    public function toggleVotingDay2(Request $request, $slug)
    {
        $request->validate(['status' => 'required|in:active,stopped']);
        $event = Event::where('slug', $slug)->firstOrFail();
        $event->update(['voting_day_2_status' => $request->status]);
        $msg = $request->status === 'stopped' ? 'Voting Hari ke-2 (SD & SMA) dihentikan!' : 'Voting Hari ke-2 (SD & SMA) diaktifkan!';
        return back()->with('status', $msg);
    }

    public function toggleSponsorVoting(Request $request, $slug)
    {
        $request->validate(['sponsor_voting_status' => 'required|in:active,stopped']);
        $event = Event::where('slug', $slug)->firstOrFail();
        $event->update(['sponsor_voting_status' => $request->sponsor_voting_status]);
        $msg = $request->sponsor_voting_status === 'stopped' ? 'Sponsor voting dihentikan!' : 'Sponsor voting diaktifkan!';
        return back()->with('status', $msg);
    }

    public function toggleTicketSale(Request $request, $slug)
    {
        $request->validate(['ticket_sale_status' => 'required|in:open,closed']);
        $event = Event::where('slug', $slug)->firstOrFail();
        $event->update(['ticket_sale_status' => $request->ticket_sale_status]);
        $msg = $request->ticket_sale_status === 'closed' ? 'Pembelian tiket ditutup!' : 'Pembelian tiket dibuka!';
        return back()->with('status', $msg);
    }

    public function updateTicketLimit(Request $request, $slug)
    {
        $request->validate([
            'max_tickets_per_user' => 'required|integer|min:1|max:100',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $event->update(['max_tickets_per_user' => $request->max_tickets_per_user]);

        return back()->with('status', 'Batas maksimal tiket per user berhasil diperbarui!');
    }

    public function updateOnlineTicketLimit(Request $request, $slug)
    {
        $request->validate([
            'online_ticket_limit' => 'required|integer|min:0|max:10000',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();

        $newLimit = (int) $request->online_ticket_limit;

        $soldOnline = IssuedTicket::whereHas('order', fn($q) => $q
            ->where('event_id', $event->id)
            ->where('payment_method', 'not like', 'OTS%')
            ->where('payment_status', 'paid')
        )->count();

        if ($newLimit < $soldOnline) {
            return response()->json([
                'errors' => [
                    'online_ticket_limit' => ["Tidak bisa menurunkan batas ke {$newLimit}. Tiket online sudah terjual {$soldOnline}."],
                ],
            ], 422);
        }

        $event->update(['online_ticket_limit' => $newLimit]);

        return response()->json(['status' => 'Batas tiket online berhasil diperbarui!']);
    }

    public function updateGateSettings(Request $request, $slug)
    {
        $request->validate([
            'gate_status' => 'required|in:open,closed,auto',
            'gate_schedules' => 'nullable|array',
            'gate_schedules.*.open_at' => 'required_with:gate_schedules|date',
            'gate_schedules.*.close_at' => 'required_with:gate_schedules|date|after_or_equal:gate_schedules.*.open_at',
        ]);

        $event = Event::where('slug', $slug)->firstOrFail();
        $event->update([
            'gate_status' => $request->gate_status,
            'gate_schedules' => $request->gate_schedules ?? [],
        ]);

        return back()->with('status', 'Pengaturan Scan Gate berhasil diperbarui!');
    }

    public function toggleFinalTab(Request $request, $slug)
    {
        $request->validate(['status' => 'required|in:show,hidden']);
        $event = Event::where('slug', $slug)->firstOrFail();
        $this->saveEventSetting($event, 'final_tab_status', $request->status);
        $msg = $request->status === 'show' ? 'Tab The Final ditampilkan!' : 'Tab The Final disembunyikan!';
        return back()->with('status', $msg);
    }
}
