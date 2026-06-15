<?php

use App\Http\Controllers\PublicController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\TicketCheckoutController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\TicketController;
use App\Http\Controllers\Admin\MerchandiseController as AdminMerchandiseController;
use App\Http\Controllers\Admin\TestimonialController as AdminTestimonialController;
use App\Http\Controllers\Admin\ScoreController;
use App\Http\Controllers\Admin\BroadcasterController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\DataExportController;
use App\Http\Controllers\Admin\RecapController;
use App\Http\Controllers\Admin\ControlRoomController;
use App\Http\Controllers\TestimonialController;
use App\Http\Controllers\MerchandiseController;
use App\Http\Controllers\ScoreTokenController;
use App\Http\Controllers\Api\LiveCountController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// ================= PUBLIC ROUTES =================
Route::get('/', [PublicController::class, 'index']);
Route::get('/faq', [PublicController::class, 'faq']);
Route::get('/news/{news}', [PublicController::class, 'showNews']);
Route::get('/events/{slug}', [EventController::class, 'show']);
Route::get('/api/events/{slug}/live-counts', [LiveCountController::class, 'voteCounts']);
Route::get('/events/{slug}/tickets', [TicketCheckoutController::class, 'showTickets']);
Route::get('/events/{slug}/merchandise', [MerchandiseController::class, 'showBuy']);
Route::get('/events/{slug}/rekap', [ScoreTokenController::class, 'showPortal']);
Route::get('/events/{slug}/rekap/verify', [ScoreTokenController::class, 'redirectVerify']);
Route::post('/events/{slug}/rekap/verify', [ScoreTokenController::class, 'verifyToken']);
Route::get('/events/{slug}/rekap/export', [ScoreTokenController::class, 'exportPdf']);
Route::get('/events/{slug}/leaderboard', [EventController::class, 'showLeaderboard']);
Route::get('/events/{slug}/leaderboard/vote', [EventController::class, 'showLeaderboardVote']);
Route::get('/events/{slug}/leaderboard/vote/full', [EventController::class, 'showLeaderboardVoteFull']);
Route::get('/events/{slug}/leaderboard/supporter', [EventController::class, 'showLeaderboardSupporter']);
Route::get('/events/{slug}/leaderboard/supporter/full', [EventController::class, 'showLeaderboardSupporterFull']);
Route::get('/events/{slug}/leaderboard/instagram', [EventController::class, 'showLeaderboardInstagram']);
Route::get('/events/{slug}/leaderboard/rekap', [EventController::class, 'showLeaderboardRekap']);
Route::get('/events/{slug}/leaderboard/rekap/juri/{contingent}', [EventController::class, 'showJuriDetail']);
Route::get('/events/{slug}/leaderboard/final', [EventController::class, 'showLeaderboardFinal']);
Route::get('/events/{slug}/leaderboard/final/juri/{contingent}', [EventController::class, 'showJuriDetailFinal']);
Route::get('/events/{slug}/leaderboard/juara', [EventController::class, 'showLeaderboardJuara']);

// ================= AUTHENTICATION =================
Route::middleware(['guest'])->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/auth/forgot-password/send', [AuthController::class, 'sendForgotPasswordOtp'])->middleware('throttle:3,1');
    Route::post('/auth/forgot-password/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
    Route::post('/auth/forgot-password/reset', [AuthController::class, 'resetPasswordWithOtp'])->middleware('throttle:5,1');

    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);
});

// ================= PUBLIC USER ACTIONS (REQUIRES AUTH) =================
Route::middleware(['auth'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/events/{slug}/tickets/checkout', [TicketCheckoutController::class, 'checkout'])->middleware('throttle:10,1');
    Route::get('/events/{slug}/myscore', [ScoreController::class, 'showContingentPrivatePortal']);
    Route::post('/events/{slug}/merchandise/buy', [MerchandiseController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/merchandise-orders', [MerchandiseController::class, 'history'])->name('merchandise.history');
    Route::get('/merchandise-orders/{id}', [MerchandiseController::class, 'showOrderDetail'])->name('merchandise.order.detail');
    Route::post('/merchandise-orders/{id}/upload-proof', [MerchandiseController::class, 'uploadPaymentProof'])->middleware('throttle:5,1');
    Route::get('/my-tickets', [TicketCheckoutController::class, 'myTickets']);
    Route::get('/orders/{id}', [TicketCheckoutController::class, 'showOrderDetail'])->name('order.detail');
    Route::post('/orders/{id}/upload-proof', [TicketCheckoutController::class, 'uploadPaymentProof'])->middleware('throttle:5,1');
    Route::delete('/orders/{id}', [TicketCheckoutController::class, 'cancelOrder'])->middleware('throttle:10,1');
    Route::post('/api/tickets/vote-online', [TicketCheckoutController::class, 'voteOnline'])->middleware('throttle:30,1');
    Route::post('/api/vote-pooled', [TicketCheckoutController::class, 'votePooled'])->middleware('throttle:30,1');

    // Profile (avatar upload, edit data, change password)
    Route::get('/profile', [AuthController::class, 'showProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'updateAvatar'])->middleware('throttle:5,1');
    Route::put('/profile/update', [AuthController::class, 'updateProfile'])->middleware('throttle:10,1');
    Route::post('/profile/password', [AuthController::class, 'updatePassword'])->middleware('throttle:5,1');

    // Testimonials
    Route::get('/testimonials', [TestimonialController::class, 'myTestimonial']);
    Route::post('/testimonials', [TestimonialController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/testimonials/{id}', [TestimonialController::class, 'update'])->middleware('throttle:10,1');
});

// ================= PUBLIC TICKET DETAIL (QR SCAN) =================
Route::get('/tickets/{qrHash}', [TicketController::class, 'showTicketDetail']);

// ================= GATE SCANNER, VOTE ALLOCATION, SUPPORTER & WEBHOOKS =================
Route::post('/api/tickets/scan', [TicketController::class, 'scanTicket'])->middleware('throttle:60,1');
Route::post('/api/tickets/checkin', [TicketController::class, 'checkIn'])->middleware('throttle:60,1');
Route::post('/api/tickets/bulk-checkin', [TicketController::class, 'bulkCheckin'])->middleware('throttle:20,1');
Route::post('/api/tickets/allocate-votes', [TicketController::class, 'allocateVotes'])->middleware('throttle:30,1');
Route::post('/api/tickets/bulk-allocate-votes', [TicketController::class, 'bulkAllocateVotes'])->middleware('throttle:20,1');
Route::post('/api/tickets/claim-coupon', [TicketController::class, 'claimCoupon'])->middleware('throttle:30,1');
Route::post('/api/tickets/bulk-claim-coupon', [TicketController::class, 'bulkClaimCoupon'])->middleware('throttle:20,1');
Route::post('/api/tickets/claim-sharing', [TicketController::class, 'claimSharing'])->middleware('throttle:30,1');
Route::post('/api/tickets/cancel-ots-order', [TicketController::class, 'cancelOtsOrder'])->middleware('throttle:20,1');

// ================= ADMIN MODULES =================
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    
    // Redirect to active event dashboard automatically
    Route::get('/dashboard', function () {
        $user = request()->user();
        $activeEvent = \App\Models\Event::where('status', 'active')->first();
        if (!$activeEvent) {
            $activeEvent = \App\Models\Event::first();
        }
        if ($activeEvent) {
            return redirect("/admin/events/{$activeEvent->slug}");
        }
        return inertia('Admin/NoEvent', [
            'message' => 'Belum ada event. Jalankan `php artisan db:seed` untuk membuat event demo.',
        ]);
    });

    Route::get('/events/{slug}', [AdminDashboardController::class, 'index']);
    Route::get('/events/{slug}/recap', [RecapController::class, 'index']);
    Route::get('/events/{slug}/recap/export', [RecapController::class, 'exportExcel']);
    
    // Role Configuration
    Route::get('/events/{slug}/role-config', [\App\Http\Controllers\Admin\RoleConfigController::class, 'index']);
    Route::post('/events/{slug}/role-config', [\App\Http\Controllers\Admin\RoleConfigController::class, 'update']);
    
    // Configurations Settings
    Route::post('/events/{slug}/settings/update', function (Request $request, $slug) {
        $controller = app(AdminDashboardController::class);
        if (request()->has('leaderboard_status')) {
            $controller->toggleLeaderboard(request(), $slug);
        }
        if (request()->has('max_tickets_per_user')) {
            $controller->updateTicketLimit(request(), $slug);
        }
        if (request()->has('online_ticket_limit')) {
            $response = $controller->updateOnlineTicketLimit(request(), $slug);
            if ($response->getStatusCode() === 422) {
                return $response;
            }
        }
        if (request()->has('ticket_sale_status')) {
            $controller->toggleTicketSale(request(), $slug);
        }
        if (request()->has('gate_status')) {
            $controller->updateGateSettings(request(), $slug);
        }
        return back()->with('status', 'Pengaturan berhasil diperbarui!');
    });

    Route::get('/events/{slug}/ots', [TicketController::class, 'showOtsPanel']);
    Route::get('/events/{slug}/ots/poll', [TicketController::class, 'pollOtsPanel']);
    Route::get('/events/{slug}/payments', [TicketController::class, 'showPayments']);
    Route::get('/events/{slug}/payments/poll', [TicketController::class, 'pollPayments']);
    Route::get('/events/{slug}/payments/export', [TicketController::class, 'exportPaymentsCsv']);
    Route::post('/events/{slug}/payments/contacts', [TicketController::class, 'updateWaContacts']);
    Route::post('/events/{slug}/payments/notification-email', [TicketController::class, 'updateNotificationEmail']);

    // Voting & Supporter control
    Route::post('/events/{slug}/toggle-final-tab', [AdminDashboardController::class, 'toggleFinalTab']);
    Route::post('/events/{slug}/toggle-voting-day1', [AdminDashboardController::class, 'toggleVotingDay1']);
    Route::post('/events/{slug}/toggle-voting-day2', [AdminDashboardController::class, 'toggleVotingDay2']);
    Route::post('/events/{slug}/toggle-supporter', [AdminDashboardController::class, 'toggleSupporter']);
    Route::post('/events/{slug}/toggle-sponsor-voting', [AdminDashboardController::class, 'toggleSponsorVoting']);
    Route::get('/events/{slug}/platform/tickets', [TicketController::class, 'showAllTickets']);
    Route::get('/events/{slug}/tickets/scan-history', [TicketController::class, 'showScanHistory']);
    Route::get('/events/{slug}/ots/export', [TicketController::class, 'exportOtsCsv']);
    Route::post('/events/{slug}/ots/generate', [TicketController::class, 'generateOtsTicket']);
    Route::post('/events/{slug}/ots/tickets/{id}/delete', [TicketController::class, 'deleteTicket']);
    Route::post('/events/{slug}/orders/{id}/approve', [TicketController::class, 'approveOrder']);
    Route::post('/events/{slug}/orders/{id}/reject', [TicketController::class, 'rejectOrder']);
    Route::get('/events/{slug}/ots/orders', [TicketController::class, 'showAllOrders']);
    Route::get('/events/{slug}/ots/orders/{orderId}', [TicketController::class, 'showOrderDetail']);
    Route::post('/events/{slug}/ots/seed-demo', [TicketController::class, 'seedDemoData']);
    Route::post('/events/{slug}/ots/clear-online', [TicketController::class, 'clearOnlineData']);

    // Scoring Engine — rekap page (first round)
    Route::get('/events/{slug}/scores/rekap', [ScoreController::class, 'showRekap']);
    Route::get('/events/{slug}/scores/rekap/export', [ScoreController::class, 'exportRekapExcel']);
    Route::get('/events/{slug}/scores/rekap/export/{contingentId}', [ScoreController::class, 'exportContingentDetail']);
    Route::get('/events/{slug}/scores/rekap/export/{contingentId}/pdf', [ScoreController::class, 'exportContingentDetailPdf']);
    Route::post('/events/{slug}/scores/jury', [ScoreController::class, 'storeJuryScore']);
    Route::post('/events/{slug}/scores/penalty', [ScoreController::class, 'updateGlobalPenalty']);
    Route::post('/events/{slug}/scores/kostum-penalty', [ScoreController::class, 'updateKostumPenalty']);
    Route::post('/events/{slug}/scores/makeup-penalty', [ScoreController::class, 'updateMakeupPenalty']);
    Route::post('/events/{slug}/scores/first-round/fill-demo', [ScoreController::class, 'fillDemoFirstRound']);
    Route::post('/events/{slug}/scores/reset', [ScoreController::class, 'resetScores']);
    Route::post('/events/{slug}/scores/reset-contingent', [ScoreController::class, 'resetContingentScores']);
    Route::post('/events/{slug}/scores/toggle-lock', [ScoreController::class, 'toggleLock']);

    // Scoring Engine — final round
    Route::get('/events/{slug}/scores/final', [ScoreController::class, 'showFinal']);
    Route::get('/events/{slug}/scores/final/export', [ScoreController::class, 'exportFinalExcel']);
    Route::post('/events/{slug}/scores/final-round', [ScoreController::class, 'storeFinalRoundScore']);
    Route::post('/events/{slug}/scores/final-round/fill-demo', [ScoreController::class, 'fillDemoFinalRound']);
    Route::post('/events/{slug}/scores/final-round/reset', [ScoreController::class, 'resetFinalRoundScores']);
    Route::post('/events/{slug}/reset-live-data', [ScoreController::class, 'resetLiveData']);
    Route::get('/events/{slug}/backup-db', [ScoreController::class, 'backupDatabase']);

    // Token Rekap
    Route::get('/events/{slug}/score-tokens', [ScoreTokenController::class, 'showAdmin']);
    Route::post('/events/{slug}/score-tokens/generate', [ScoreTokenController::class, 'generate']);
    Route::post('/events/{slug}/score-tokens/generate-all', [ScoreTokenController::class, 'generateAll']);
    Route::post('/events/{slug}/score-tokens/revoke/{id}', [ScoreTokenController::class, 'revoke']);

    // Scoring Engine — score tables
    Route::get('/events/{slug}/scores/daftar-nilai', [ScoreController::class, 'showDaftarNilai']);
    Route::get('/events/{slug}/scores/daftar-juara', [ScoreController::class, 'showDaftarJuara']);
    Route::get('/events/{slug}/scores/daftar-juara/export', [ScoreController::class, 'exportDaftarJuaraExcel']);

    // Scoring Engine — votes
    Route::post('/events/{slug}/scores/votes/fill-demo', [ScoreController::class, 'fillDemoVotes']);
    Route::post('/events/{slug}/scores/votes/reset', [ScoreController::class, 'resetVotes']);
    Route::post('/events/{slug}/scores/votes/reset-all', [ScoreController::class, 'resetAllVotes']);
    Route::post('/events/{slug}/supporter/reset-all', [ScoreController::class, 'resetAllSupporters']);

    // Merchandise Sponsor (Best Sponsor module)
    Route::get('/events/{slug}/merchandise', [AdminMerchandiseController::class, 'index']);
    Route::post('/events/{slug}/merchandise/{id}/approve', [AdminMerchandiseController::class, 'approve']);
    Route::post('/events/{slug}/merchandise/{id}/reject', [AdminMerchandiseController::class, 'reject']);
    Route::post('/events/{slug}/merchandise/qris-upload', [AdminMerchandiseController::class, 'uploadQris']);
    Route::post('/events/{slug}/merchandise/products', [AdminMerchandiseController::class, 'storeProduct']);
    Route::put('/events/{slug}/merchandise/products/{id}', [AdminMerchandiseController::class, 'updateProduct']);
    Route::delete('/events/{slug}/merchandise/products/{id}', [AdminMerchandiseController::class, 'destroyProduct']);
    Route::post('/events/{slug}/merchandise/update-max-price', [AdminMerchandiseController::class, 'updateMaxPrice']);
    Route::get('/events/{slug}/merchandise/export', [AdminMerchandiseController::class, 'export']);
    Route::post('/events/{slug}/merchandise/contacts', [AdminMerchandiseController::class, 'updateMerchandiseWaContacts']);
    Route::post('/events/{slug}/merchandise/notification-email', [AdminMerchandiseController::class, 'updateNotificationEmail']);
    Route::get('/events/{slug}/merchandise/poll', [AdminMerchandiseController::class, 'poll']);

    // Instagram Likes Manager
    Route::get('/events/{slug}/social-media', [AdminDashboardController::class, 'showSocialMediaPanel']);
    Route::post('/events/{slug}/social-media', [AdminDashboardController::class, 'storeSocialMediaLikes']);

    // Email Broadcast
    Route::get('/events/{slug}/broadcast', [BroadcasterController::class, 'showBroadcastForm']);
    Route::post('/events/{slug}/broadcast', [BroadcasterController::class, 'sendBroadcast']);

    // Testimonial Moderation
    Route::post('/events/{slug}/testimonials/{id}/toggle', [AdminTestimonialController::class, 'toggleStatus']);
    Route::delete('/events/{slug}/testimonials/{id}', [AdminTestimonialController::class, 'destroy']);

    // Platform Control Room (Excel Export)
    Route::get('/events/{slug}/export', [DataExportController::class, 'exportAll']);

    // Platform Control Room (Super Admin)
    Route::get('/events/{slug}/control-room', [ControlRoomController::class, 'index']);
    Route::match(['GET', 'POST'], '/events/{slug}/control-room/verify-pin', [ControlRoomController::class, 'verifyPin']);
    Route::post('/events/{slug}/control-room/reset', [ControlRoomController::class, 'reset']);
    Route::post('/events/{slug}/control-room/reset-item', [ControlRoomController::class, 'resetItem']);
    Route::get('/events/{slug}/control-room/download', [ControlRoomController::class, 'downloadDatabase']);

    // Event Content consolidated panel
    Route::get('/events/{slug}/content', [\App\Http\Controllers\Admin\EventContentController::class, 'index']);
    Route::post('/events/{slug}/content', [\App\Http\Controllers\Admin\EventContentController::class, 'update']);

    // News CRUD (scoped to event for auth check)
    Route::post('/events/{slug}/news', [\App\Http\Controllers\Admin\NewsController::class, 'store']);
    Route::put('/events/{slug}/news/{id}', [\App\Http\Controllers\Admin\NewsController::class, 'update']);
    Route::delete('/events/{slug}/news/{id}', [\App\Http\Controllers\Admin\NewsController::class, 'destroy']);

    // Hall of Fame CRUD (scoped to event for auth check)
    Route::post('/events/{slug}/hall-of-fame', [\App\Http\Controllers\Admin\HallOfFameController::class, 'store']);
    Route::put('/events/{slug}/hall-of-fame/{id}', [\App\Http\Controllers\Admin\HallOfFameController::class, 'update']);
    Route::delete('/events/{slug}/hall-of-fame/{id}', [\App\Http\Controllers\Admin\HallOfFameController::class, 'destroy']);

    // Event Schedule CRUD (scoped to event for auth check)
    Route::post('/events/{slug}/schedule', [\App\Http\Controllers\Admin\EventScheduleController::class, 'store']);
    Route::put('/events/{slug}/schedule/{id}', [\App\Http\Controllers\Admin\EventScheduleController::class, 'update']);
    Route::delete('/events/{slug}/schedule/{id}', [\App\Http\Controllers\Admin\EventScheduleController::class, 'destroy']);

    // Contingents CRUD
    Route::get('/events/{slug}/contingents', [\App\Http\Controllers\Admin\ContingentCrudController::class, 'index']);
    Route::post('/events/{slug}/contingents', [\App\Http\Controllers\Admin\ContingentCrudController::class, 'store']);
    Route::post('/events/{slug}/contingents/{id}/update', [\App\Http\Controllers\Admin\ContingentCrudController::class, 'update']);
    Route::delete('/events/{slug}/contingents/{id}', [\App\Http\Controllers\Admin\ContingentCrudController::class, 'destroy']);

});

// ================= USER MANAGEMENT =================
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users/{id}/role', [UserController::class, 'updateRole']);
});
