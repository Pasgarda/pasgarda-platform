<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Contingent;
use App\Models\Order;
use App\Models\IssuedTicket;
use App\Models\TicketPackage;
use App\Models\User;
use App\Models\RolePermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasgardaFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_checkout_blocks_coach_self_purchase()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20',
            'name' => 'GARDA 55 VOL 20',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);

        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => 'SMP Negeri 1 Samarinda',
            'region' => 'Samarinda',
            'category_type' => 'U16',
            'coach_name' => 'Budi Setiawan',
            'coach_phone' => '081234567890',
        ]);

        // User with coach role cannot buy tickets
        $user = User::create([
            'name' => 'Budi Setiawan',
            'email' => 'coach1@pasgarda.com',
            'role' => 'coach',
        ]);

        $package = TicketPackage::create([
            'event_id' => $event->id,
            'name' => 'Silver',
            'price' => 25000.00,
            'validity_days' => 1,
            'vote_allowance' => 1,
        ]);

        $response = $this->actingAs($user)
            ->post("/events/{$event->slug}/tickets/checkout", [
                'quantities' => [$package->id => 1],
                'buyer_name' => 'Budi',
                'buyer_email' => 'coach1@pasgarda.com',
                'contingent_id' => $contingent->id,
            ]);

        $response->assertSessionHasErrors('quantities');
    }

    public function test_ticket_limit_enforced()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20',
            'name' => 'GARDA 55 VOL 20',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
            'max_tickets_per_user' => 15,
        ]);

        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => 'SMA Negeri 1',
            'region' => 'Samarinda',
            'category_type' => 'U19',
            'coach_name' => 'Pelatih',
            'coach_phone' => '081234567890',
        ]);

        $package = TicketPackage::create([
            'event_id' => $event->id,
            'name' => 'Silver',
            'price' => 25000.00,
            'validity_days' => 1,
            'vote_allowance' => 1,
        ]);

        $user = User::create([
            'name' => 'Spectator User',
            'email' => 'user@pasgarda.com',
            'role' => 'spectator',
        ]);

        // Act: purchase 16 tickets (limit is 15)
        $response = $this->actingAs($user)
            ->post("/events/{$event->slug}/tickets/checkout", [
                'quantities' => [
                    $package->id => 16
                ],
                'buyer_name' => 'Spectator User',
                'buyer_email' => 'user@pasgarda.com',
                'contingent_id' => $contingent->id,
            ]);

        // Assert: redirect back with validation errors
        $response->assertSessionHasErrors('quantities');
    }

    public function test_contingent_vote_bonus_calculation()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20',
            'name' => 'GARDA 55 VOL 20',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);

        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => 'SMP Negeri 1 Samarinda',
            'region' => 'Samarinda',
            'category_type' => 'U16',
            'coach_name' => 'Agus',
            'coach_phone' => '081234567890',
        ]);

        $package = TicketPackage::create([
            'event_id' => $event->id,
            'name' => 'Silver',
            'price' => 25000.00,
            'validity_days' => 1,
            'vote_allowance' => 1,
        ]);

        $user = User::create([
            'name' => 'Spectator User',
            'email' => 'user@pasgarda.com',
            'role' => 'spectator',
        ]);

        // Issue 1 paid ticket to this user
        $order = Order::create([
            'user_id' => $user->id,
            'event_id' => $event->id,
            'midtrans_transaction_id' => 'ORD-TEST1234',
            'total_price' => 25000.00,
            'payment_status' => 'paid',
        ]);

        $ticket = IssuedTicket::create([
            'order_id' => $order->id,
            'ticket_package_id' => $package->id,
            'unique_qr_hash' => 'TKT-VOTE-TEST',
            'buyer_name' => 'Spectator User',
            'buyer_email' => 'user@pasgarda.com',
            'check_in_status' => false,
            'vote_tokens_remaining' => 1,
        ]);

        // Set up scores first (PBB: 100, Danton: 100)
        $score = \App\Models\Score::create([
            'event_id' => $event->id,
            'contingent_id' => $contingent->id,
            'pbb_score' => 100,
            'danton_score' => 100,
            'vafor_score' => 100,
            'grand_total' => 300,
        ]);

        $this->assertEquals(300, (int) $score->grand_total);

        // Cast a vote to generate voting bonus (for final round, not grand_total)
        $this->actingAs($user)->post('/api/vote-pooled', [
            'event_id' => $event->id,
            'contingent_id' => $contingent->id,
            'votes' => 1,
        ]);

        // Create final round score directly (bypasses jury submission flow for this test)
        $finalRound = \App\Models\ScoreFinalRound::create([
            'event_id' => $event->id,
            'contingent_id' => $contingent->id,
            'score_juri_1' => 200,
            'score_juri_2' => 200,
            'penalties' => 10,
        ]);

        // Recalculate voting bonuses
        \App\Models\Score::recalculateVotingBonuses($event->id);

        // Verify final round score has voting bonus (1% of 100+100 = 2)
        $finalRound->refresh();
        $this->assertEquals(200, $finalRound->score_juri_1);
        $this->assertEquals(200, $finalRound->score_juri_2);
        $this->assertEquals(10, $finalRound->penalties);
        $this->assertEquals(2, $finalRound->voting_bonus);
        $this->assertEquals(390, $finalRound->total_score); // 200 + 200 - 10 (voting bonus tidak ikut)
    }

    public function test_jury_scores_calculation_and_aggregation()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20',
            'name' => 'GARDA 55 VOL 20',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);

        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => 'SMP Negeri 1 Samarinda',
            'region' => 'Samarinda',
            'category_type' => 'U16',
            'coach_name' => 'Agus',
            'coach_phone' => '081234567890',
        ]);

        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@pasgarda.com',
            'role' => 'super_admin',
        ]);

        // 1. Submit PBB Juri 1 Score (Haryoto)
        $response1 = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/scores/jury", [
                'contingent_id' => $contingent->id,
                'jury_type' => 'pbb',
                'jury_number' => 1,
                'pbb_details' => ['pbb_04' => 200],
                'danton_details' => ['dn_01' => 80],
            ]);
        $response1->assertStatus(302); // Redirect back

        // 2. Submit PBB Juri 2 Score (Muhammad Dhon)
        $response2 = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/scores/jury", [
                'contingent_id' => $contingent->id,
                'jury_type' => 'pbb',
                'jury_number' => 2,
                'pbb_details' => ['pbb_04' => 210],
                'danton_details' => ['dn_01' => 85],
            ]);
        $response2->assertStatus(302);

        // 3. Submit VAFOR Juri 1 Score (Bahari Pradana)
        $response3 = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/scores/jury", [
                'contingent_id' => $contingent->id,
                'jury_type' => 'vafor',
                'jury_number' => 1,
                'variasi_details' => ['vr_01' => 45],
                'formasi_details' => ['fm_01' => 40],
                'danton_vafor_details' => ['dv_01' => 30],
            ]);
        $response3->assertStatus(302);

        // 4. Submit MAKEUP & KOSTUM Juri 1 Score (Mutiara Kinanti Alfida)
        $response4 = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/scores/jury", [
                'contingent_id' => $contingent->id,
                'jury_type' => 'makeup_kostum',
                'jury_number' => 1,
                'makeup_details' => ['mk_01' => 30],
                'kostum_details' => ['ks_01' => 30],
            ]);
        $response4->assertStatus(302);

        // 5. Submit Global Penalty (integer format)
        $responsePenalty = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/scores/penalty", [
                'contingent_id' => $contingent->id,
                'penalties' => 15,
            ]);
        $responsePenalty->assertStatus(302);

        // Verify Jury Scores exist in DB
        $this->assertDatabaseHas('jury_scores', [
            'contingent_id' => $contingent->id,
            'jury_type' => 'pbb',
            'jury_number' => 1,
            'total_score' => 280,
            'variasi_score' => 0,
            'formasi_score' => 0,
            'danton_vafor_score' => 0,
        ]);

        $this->assertDatabaseHas('jury_scores', [
            'contingent_id' => $contingent->id,
            'jury_type' => 'pbb',
            'jury_number' => 2,
            'total_score' => 295,
            'variasi_score' => 0,
            'formasi_score' => 0,
            'danton_vafor_score' => 0,
        ]);

        $this->assertDatabaseHas('jury_scores', [
            'contingent_id' => $contingent->id,
            'jury_type' => 'vafor',
            'jury_number' => 1,
            'total_score' => 115,
            'variasi_score' => 45,
            'formasi_score' => 40,
            'danton_vafor_score' => 30,
        ]);

        $this->assertDatabaseHas('jury_scores', [
            'contingent_id' => $contingent->id,
            'jury_type' => 'makeup_kostum',
            'jury_number' => 1,
            'total_score' => 60,
        ]);

        // Verify Aggregated Score in scores table
        $score = \App\Models\Score::where('contingent_id', $contingent->id)->first();
        $this->assertNotNull($score);

        // PBB: 200 + 210 = 410
        $this->assertEquals(410, (int) $score->pbb_score);
        // Danton: 80 + 85 = 165
        $this->assertEquals(165, (int) $score->danton_score);
        // Variasi: 45 (only Juri 1 Vafor submitted)
        $this->assertEquals(45, (int) $score->variasi_score);
        // Formasi: 40
        $this->assertEquals(40, (int) $score->formasi_score);
        // Danton Vafor: 30
        $this->assertEquals(30, (int) $score->danton_vafor_score);
        // Kostum: 30
        $this->assertEquals(30, (int) $score->kostum_score);
        // Makeup: 30
        $this->assertEquals(30, (int) $score->makeup_score);
        // Penalties: 15 (global penalty)
        $this->assertEquals(15, (int) $score->penalties_score);
        // Voting bonus: 0 in Rekap (first round)
        $this->assertEquals(0, (int) $score->nilai_kontingen_bonus);
        // Grand Total: 410 + 165 + 45 + 40 + 30 + 30 + 30 - 15 = 735
        $this->assertEquals(735, (int) $score->grand_total);
    }

    public function test_fill_final_round_demo()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol21',
            'name' => 'GARDA 55 VOL 21',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => 'SMKN 1 Jakarta',
            'coach_name' => 'Coach Budi',
            'coach_phone' => '081234567890',
            'region' => 'Jakarta',
            'category_type' => 'U16',
        ]);

        // Create first round score for voting bonus calculation dependency
        \App\Models\Score::create([
            'event_id' => $event->id,
            'contingent_id' => $contingent->id,
            'pbb_score' => 100,
            'danton_score' => 100,
            'vafor_score' => 100,
            'kostum_score' => 50,
            'makeup_score' => 50,
            'grand_total' => 300,
        ]);

        $admin = User::create([
            'name' => 'Admin User 2',
            'email' => 'admin2@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/scores/final-round/fill-demo", [
                'contingent_id' => $contingent->id,
            ]);

        $response->assertStatus(302);
        
        $this->assertDatabaseHas('scores_final_round', [
            'contingent_id' => $contingent->id,
        ]);

        $finalScore = \App\Models\ScoreFinalRound::where('contingent_id', $contingent->id)->first();
        $this->assertNotNull($finalScore);
        
        // Assert that all jury details were seeded (should not be null)
        $this->assertNotNull($finalScore->juri_1_pbb_details);
        $this->assertNotNull($finalScore->juri_2_pbb_details);
        $this->assertNotNull($finalScore->juri_3_pbb_details);
        $this->assertNotNull($finalScore->juri_1_variasi_details);
        $this->assertNotNull($finalScore->juri_2_variasi_details);
    }

    public function test_store_final_round_penalty()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol22',
            'name' => 'GARDA 55 VOL 22',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => 'SMKN 1 Jakarta',
            'coach_name' => 'Coach Budi',
            'coach_phone' => '081234567890',
            'region' => 'Jakarta',
            'category_type' => 'U16',
        ]);

        $finalRound = \App\Models\ScoreFinalRound::create([
            'event_id' => $event->id,
            'contingent_id' => $contingent->id,
            'pbb_score' => 150,
            'danton_score' => 50,
            'vafor_score' => 100,
            'penalties' => 10,
            'total_score' => 290,
        ]);

        $admin = User::create([
            'name' => 'Admin User 3',
            'email' => 'admin3@pasgarda.com',
            'role' => 'admin',
        ]);

        // Submit penalty update via post
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/scores/final-round", [
                'contingent_id' => $contingent->id,
                'jury_type' => 'penalty',
                'penalties' => 25,
            ]);

        $response->assertStatus(302);

        $this->assertDatabaseHas('scores_final_round', [
            'contingent_id' => $contingent->id,
            'penalties' => 25,
            'total_score' => 275, // 150 + 50 + 100 - 25 = 275
        ]);
    }

    public function test_super_admin_news_crud()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20-news-test',
            'name' => 'News Test Event',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        RolePermission::seedDefaults($event->id);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $spectator = User::create([
            'name' => 'Spectator',
            'email' => 'spectator@pasgarda.com',
            'role' => 'spectator',
        ]);

        // Spectator block
        $this->actingAs($spectator)
            ->post("/admin/events/{$event->slug}/news", [
                'title' => 'Title 1',
                'category' => 'Announcement',
                'summary' => 'Summary 1',
                'date' => '2026-06-05',
            ])->assertStatus(403);

        // Admin success create
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/news", [
                'title' => 'New News Title',
                'category' => 'Announcement',
                'summary' => 'This is a news summary.',
                'date' => '2026-06-05',
            ]);
        $response->assertStatus(302);
        $this->assertDatabaseHas('news', ['title' => 'New News Title']);

        $news = \App\Models\News::first();

        // Admin success update
        $response = $this->actingAs($admin)
            ->put("/admin/events/{$event->slug}/news/{$news->id}", [
                'title' => 'Updated News Title',
                'category' => 'Announcement',
                'summary' => 'Updated summary.',
                'date' => '2026-06-06',
            ]);
        $response->assertStatus(302);
        $this->assertDatabaseHas('news', ['title' => 'Updated News Title']);

        // Admin success delete
        $response = $this->actingAs($admin)
            ->delete("/admin/events/{$event->slug}/news/{$news->id}");
        $response->assertStatus(302);
        $this->assertDatabaseMissing('news', ['id' => $news->id]);
    }

    public function test_super_admin_hall_of_fame_crud()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20-hof-test',
            'name' => 'HOF Test Event',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        RolePermission::seedDefaults($event->id);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/hall-of-fame", [
                'year' => 2025,
                'event_name' => 'LPBB Vol 19',
                'champion' => 'SMA 1',
                'runner_up' => 'SMA 2',
                'best_commander' => 'Danton A',
                'favorite' => 'SMA 3',
            ]);
        $response->assertStatus(302);
        $this->assertDatabaseHas('hall_of_fames', ['year' => 2025]);

        $hof = \App\Models\HallOfFame::first();

        $response = $this->actingAs($admin)
            ->put("/admin/events/{$event->slug}/hall-of-fame/{$hof->id}", [
                'year' => 2025,
                'event_name' => 'LPBB Vol 19 Edited',
                'champion' => 'SMA 1 E',
                'runner_up' => 'SMA 2 E',
                'best_commander' => 'Danton A E',
                'favorite' => 'SMA 3 E',
            ]);
        $response->assertStatus(302);
        $this->assertDatabaseHas('hall_of_fames', ['event_name' => 'LPBB Vol 19 Edited']);

        $response = $this->actingAs($admin)
            ->delete("/admin/events/{$event->slug}/hall-of-fame/{$hof->id}");
        $response->assertStatus(302);
        $this->assertDatabaseMissing('hall_of_fames', ['id' => $hof->id]);
    }

    public function test_super_admin_event_schedule_crud()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20-sched-test',
            'name' => 'GARDA 55 VOL 20',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        RolePermission::seedDefaults($event->id);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/schedule", [
                'day_type' => 'Day 1',
                'date_string' => 'Sabtu, 20 Juni 2026',
                'categories' => ['U16', 'U19'],
                'timeline' => [
                    ['time' => '08:00 - 08:30', 'activity' => 'Opening Ceremony'],
                ],
            ]);
        $response->assertStatus(302);
        $this->assertDatabaseHas('event_schedules', ['day_type' => 'Day 1']);

        $schedule = \App\Models\EventSchedule::first();

        $response = $this->actingAs($admin)
            ->put("/admin/events/{$event->slug}/schedule/{$schedule->id}", [
                'day_type' => 'Day 1 Updated',
                'date_string' => 'Sabtu, 20 Juni 2026',
                'categories' => ['U16'],
                'timeline' => [
                    ['time' => '08:00 - 08:45', 'activity' => 'Opening Ceremony & Intro'],
                ],
            ]);
        $response->assertStatus(302);
        $this->assertDatabaseHas('event_schedules', ['day_type' => 'Day 1 Updated']);

        $response = $this->actingAs($admin)
            ->delete("/admin/events/{$event->slug}/schedule/{$schedule->id}");
        $response->assertStatus(302);
        $this->assertDatabaseMissing('event_schedules', ['id' => $schedule->id]);
    }

    public function test_super_admin_contingent_crud()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20',
            'name' => 'GARDA 55 VOL 20',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/contingents", [
                'school_name' => 'SMA Negeri 5 Samarinda',
                'region' => 'Samarinda',
                'category_type' => 'U19',
                'is_reguler' => true,
                'status' => 'verified',
                'coach_name' => 'Coach A',
                'coach_phone' => '08122334455',
                'description' => 'Great school',
            ]);
        $response->assertStatus(302);
        $this->assertDatabaseHas('contingents', ['school_name' => 'SMA Negeri 5 Samarinda']);

        $contingent = Contingent::first();

        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/contingents/{$contingent->id}/update", [
                'school_name' => 'SMA Negeri 5 Samarinda Updated',
                'region' => 'Samarinda',
                'category_type' => 'U19',
                'is_reguler' => true,
                'status' => 'verified',
                'coach_name' => 'Coach A',
                'coach_phone' => '08122334455',
                'description' => 'Great school updated',
            ]);
        $response->assertStatus(302);
        $this->assertDatabaseHas('contingents', ['school_name' => 'SMA Negeri 5 Samarinda Updated']);

        $response = $this->actingAs($admin)
            ->delete("/admin/events/{$event->slug}/contingents/{$contingent->id}");
        $response->assertStatus(302);
        $this->assertDatabaseMissing('contingents', ['id' => $contingent->id]);
    }

    public function test_spectator_access_myscore_unconnected()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20',
            'name' => 'GARDA 55 VOL 20',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);

        $spectator = User::create([
            'name' => 'Spectator',
            'email' => 'spectator@pasgarda.com',
            'role' => 'spectator',
        ]);

        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => 'SMP Negeri 1 Samarinda',
            'region' => 'Samarinda',
            'category_type' => 'U16',
            'coach_name' => 'Budi Setiawan',
            'coach_phone' => '081234567890',
        ]);

        $response = $this->actingAs($spectator)
            ->get("/events/{$event->slug}/myscore");

        $response->assertStatus(200);
        $response->assertInertia(function ($page) {
            $page->component('Event/MyScore')
                ->where('contingent', null)
                ->has('allContingents', 1);
        });
    }

    public function test_broadcast_email_options()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $event = Event::create([
            'slug' => 'lpbb-vol20-broadcast',
            'name' => 'GARDA 55 VOL 20 Broadcast',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);

        // Create a coach user
        $coach = User::create([
            'name' => 'Coach Budi',
            'email' => 'coach_budi@pasgarda.com',
            'role' => 'coach',
        ]);

        $response = $this->actingAs($admin)
            ->get("/admin/events/{$event->slug}/broadcast");

        $response->assertStatus(200);
        $response->assertInertia(function ($page) {
            $page->component('Admin/EmailBroadcast')
                ->has('visitorCount')
                ->has('coachCount');
        });

        // Send to only coach
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/broadcast", [
                'subject' => 'Broadcast Coach Only',
                'message_body' => 'Message to coaches.',
                'target_type' => 'coach',
            ]);

        $response->assertStatus(302);
        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\BulkBroadcastJob::class);
    }

    public function test_automated_score_notification_to_coach()
    {
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $event = Event::create([
            'slug' => 'lpbb-vol20-scores',
            'name' => 'GARDA 55 VOL 20 Scores',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);

        $coach = User::create([
            'name' => 'Coach Andi',
            'email' => 'coach_andi@pasgarda.com',
            'role' => 'coach',
        ]);

        $contingent = Contingent::create([
            'event_id' => $event->id,
            'school_name' => 'SMA Negeri 2 Samarinda',
            'region' => 'Samarinda',
            'category_type' => 'U19',
            'coach_name' => 'Coach Andi',
            'coach_phone' => '081234567891',
        ]);

        // Submit 6 jury scores first
        for ($i = 1; $i <= 3; $i++) {
            \App\Models\JuryScore::create([
                'event_id' => $event->id,
                'contingent_id' => $contingent->id,
                'jury_type' => 'pbb',
                'jury_number' => $i,
                'pbb_score' => 50,
                'total_score' => 50,
            ]);
        }
        for ($i = 1; $i <= 2; $i++) {
            \App\Models\JuryScore::create([
                'event_id' => $event->id,
                'contingent_id' => $contingent->id,
                'jury_type' => 'vafor',
                'jury_number' => $i,
                'vafor_score' => 60,
                'total_score' => 60,
            ]);
        }
        \App\Models\JuryScore::create([
            'event_id' => $event->id,
            'contingent_id' => $contingent->id,
            'jury_type' => 'makeup_kostum',
            'jury_number' => 1,
            'kostum_score' => 70,
            'total_score' => 70,
        ]);

        // Submit the 7th score through the endpoint
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/scores/jury", [
                'contingent_id' => $contingent->id,
                'jury_type' => 'makeup_kostum',
                'jury_number' => 2,
                'makeup_details' => [10, 20, 30],
                'kostum_details' => [10, 20, 30],
            ]);

        $response->assertStatus(302);

        // Assert that the database now shows coach_notified_at as populated
        $score = \App\Models\Score::where('event_id', $event->id)
            ->where('contingent_id', $contingent->id)
            ->first();
        $this->assertNotNull($score);
        $this->assertNotNull($score->coach_notified_at);
    }

    public function test_user_testimonial_flow_and_admin_moderation()
    {
        $event = Event::create([
            'slug' => 'lpbb-vol20-testimonials',
            'name' => 'GARDA 55 VOL 20 Testimonials',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        RolePermission::seedDefaults($event->id);

        $user = User::create([
            'name' => 'Buyer Spectator',
            'email' => 'buyer@pasgarda.com',
            'role' => 'spectator',
        ]);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@pasgarda.com',
            'role' => 'super_admin',
        ]);

        // Submit testimonial without ticket should fail with JSON error
        $response = $this->actingAs($user)
            ->post('/testimonials', [
                'rating' => 5,
                'message' => 'Luar biasa sekali!',
            ]);
        $response->assertStatus(422);
        $response->assertJson(['message' => 'Hanya pengguna yang sudah membeli tiket yang dapat memberikan testimoni.']);

        // Create ticket package, paid order, and ticket
        $package = \App\Models\TicketPackage::create([
            'event_id' => $event->id,
            'name' => 'VIP',
            'price' => 50000.00,
            'validity_days' => 1,
            'vote_allowance' => 1,
        ]);

        $order = \App\Models\Order::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'total_price' => 50000,
            'payment_status' => 'paid',
            'order_id' => 'ORDER-123',
            'midtrans_transaction_id' => 'TX-123',
        ]);

        \App\Models\IssuedTicket::create([
            'order_id' => $order->id,
            'ticket_package_id' => $package->id,
            'package_name' => 'VIP',
            'price' => 50000,
            'buyer_name' => 'Buyer Spectator',
            'buyer_email' => 'buyer@pasgarda.com',
            'unique_qr_hash' => 'HASH123',
            'check_in_status' => false,
            'vote_tokens_remaining' => 1,
        ]);

        // Submit testimonial with ticket should succeed
        $response = $this->actingAs($user)
            ->post('/testimonials', [
                'rating' => 5,
                'message' => 'Luar biasa sekali!',
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('testimonials', [
            'user_id' => $user->id,
            'rating' => 5,
            'message' => 'Luar biasa sekali!',
            'status' => 'pending',
        ]);

        $testimonial = \App\Models\Testimonial::first();

        // Duplicated submit should fail with JSON error
        $response = $this->actingAs($user)
            ->post('/testimonials', [
                'rating' => 4,
                'message' => 'Ulangi lagi.',
            ]);
        $response->assertStatus(422);
        $response->assertJson(['message' => 'Anda sudah mengirim testimoni. Anda bisa mengeditnya.']);

        // Update testimonial should succeed
        $response = $this->actingAs($user)
            ->put("/testimonials/{$testimonial->id}", [
                'rating' => 4,
                'message' => 'Keren banget!',
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('testimonials', [
            'id' => $testimonial->id,
            'rating' => 4,
            'message' => 'Keren banget!',
        ]);

        // Check admin dashboard / page
        $response = $this->actingAs($admin)
            ->get("/admin/events/{$event->slug}/content");
        $response->assertStatus(200);
        $response->assertInertia(function ($page) {
            $page->component('Admin/EventContent')
                ->has('event')
                ->has('testimonials');
        });

        // Toggle status as admin
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/testimonials/{$testimonial->id}/toggle");
        $response->assertStatus(302);
        $this->assertDatabaseHas('testimonials', [
            'id' => $testimonial->id,
            'status' => 'enabled',
        ]);

        // Delete as admin
        $response = $this->actingAs($admin)
            ->delete("/admin/events/{$event->slug}/testimonials/{$testimonial->id}");
        $response->assertStatus(302);
        $this->assertDatabaseMissing('testimonials', [
            'id' => $testimonial->id,
        ]);
    }

    public function test_admin_can_update_event_contents_and_upload_judges_photos()
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $event = Event::create([
            'slug' => 'lpbb-vol20-content-test',
            'name' => 'GARDA 55 VOL 20 Content Test',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        RolePermission::seedDefaults($event->id);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super-content@pasgarda.com',
            'role' => 'super_admin',
        ]);

        // Create initial content to test cleanup/updating
        \App\Models\EventContent::create([
            'event_id' => $event->id,
            'key' => 'agenda',
            'value' => [['time' => '08:00', 'activity' => 'Opening']]
        ]);

        $file = \Illuminate\Http\UploadedFile::fake()->image('juri_test.png');

        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/content", [
                'judges' => [
                    [
                        'name' => 'Juri Keren',
                        'role' => 'Ketua Juri',
                        'image_file' => $file,
                    ]
                ],
                'banthal_prize' => [
                    [
                        'type' => 'category',
                        'label' => 'Juara Umum',
                        'items' => [['title' => 'Piala Bergilir']]
                    ]
                ]
            ]);

        $response->assertStatus(302);

        // Verify agenda is deleted/cleaned up
        $this->assertDatabaseMissing('event_contents', [
            'event_id' => $event->id,
            'key' => 'agenda',
        ]);

        // Verify judges are saved and file is stored
        $judgesContent = \App\Models\EventContent::where('event_id', $event->id)
            ->where('key', 'judges')
            ->first();

        $this->assertNotNull($judgesContent);
        $judgesArray = $judgesContent->value;
        $this->assertCount(1, $judgesArray);
        $this->assertEquals('Juri Keren', $judgesArray[0]['name']);
        $this->assertStringStartsWith('/storage/judges/', $judgesArray[0]['image_url']);
        
        $filePath = str_replace('/storage/', '', $judgesArray[0]['image_url']);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($filePath);
    }

    public function test_admin_can_manage_event_sponsors_and_convert_to_webp()
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $event = Event::create([
            'slug' => 'lpbb-vol20-sponsors-test',
            'name' => 'GARDA 55 VOL 20 Sponsors Test',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        RolePermission::seedDefaults($event->id);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super-sponsors@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $file = \Illuminate\Http\UploadedFile::fake()->image('sponsor_logo.png');

        // Store sponsor upload
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/content", [
                'sponsors' => [
                    [
                        'file' => $file,
                    ]
                ]
            ]);

        $response->assertStatus(302);

        // Verify sponsors are saved and file is stored as WebP
        $sponsorsContent = \App\Models\EventContent::where('event_id', $event->id)
            ->where('key', 'sponsors')
            ->first();

        $this->assertNotNull($sponsorsContent);
        $sponsorsArray = $sponsorsContent->value;
        $this->assertCount(1, $sponsorsArray);
        $this->assertStringStartsWith('/storage/sponsors/', $sponsorsArray[0]);
        $this->assertStringEndsWith('.webp', $sponsorsArray[0]);

        $filePath = str_replace('/storage/', '', $sponsorsArray[0]);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($filePath);

        // Clear/delete sponsors
        $responseDelete = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/content", [
                'sponsors' => []
            ]);

        $responseDelete->assertStatus(302);
        $this->assertDatabaseMissing('event_contents', [
            'event_id' => $event->id,
            'key' => 'sponsors',
        ]);
    }

    public function test_admin_can_manage_news_with_cover_image_upload_and_removal()
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $event = Event::create([
            'slug' => 'lpbb-vol20-news-test',
            'name' => 'GARDA 55 VOL 20 News Test',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        RolePermission::seedDefaults($event->id);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super-news@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $file = \Illuminate\Http\UploadedFile::fake()->image('cover.jpg');

        // 1. Store news with cover image
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/news", [
                'title' => 'Berita Baru',
                'category' => 'Announcement',
                'summary' => 'Ringkasan berita baru.',
                'date' => '11 Jun 2026',
                'image_file' => $file,
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('news', [
            'title' => 'Berita Baru',
            'category' => 'Announcement',
            'summary' => 'Ringkasan berita baru.',
            'date' => '11 Jun 2026',
        ]);

        $news = \App\Models\News::where('title', 'Berita Baru')->first();
        $this->assertNotNull($news->image_url);
        $this->assertStringStartsWith('/storage/news/', $news->image_url);

        $filePath = str_replace('/storage/', '', $news->image_url);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($filePath);

        // 2. Update news with another cover image
        $newFile = \Illuminate\Http\UploadedFile::fake()->image('cover2.jpg');
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/news/{$news->id}", [
                '_method' => 'PUT',
                'title' => 'Berita Diperbarui',
                'category' => 'Competition',
                'summary' => 'Ringkasan diperbarui.',
                'date' => '12 Jun 2026',
                'image_file' => $newFile,
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('news', [
            'id' => $news->id,
            'title' => 'Berita Diperbarui',
            'category' => 'Competition',
        ]);

        $news->refresh();
        $this->assertStringStartsWith('/storage/news/', $news->image_url);
        $newFilePath = str_replace('/storage/', '', $news->image_url);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($newFilePath);
        // Old file should be deleted
        \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($filePath);

        // 3. Remove cover image
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/news/{$news->id}", [
                '_method' => 'PUT',
                'title' => 'Berita Diperbarui',
                'category' => 'Competition',
                'summary' => 'Ringkasan diperbarui.',
                'date' => '12 Jun 2026',
                'remove_cover' => true,
            ]);

        $response->assertStatus(302);
        $news->refresh();
        $this->assertNull($news->image_url);
        \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($newFilePath);
    }

    public function test_admin_can_manage_sliders_with_webp_conversion_and_removal()
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $event = Event::create([
            'slug' => 'lpbb-vol20-slider-test',
            'name' => 'GARDA 55 VOL 20 Slider Test',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);
        RolePermission::seedDefaults($event->id);

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'super-slider@pasgarda.com',
            'role' => 'super_admin',
        ]);

        $file1 = \Illuminate\Http\UploadedFile::fake()->image('home1.jpg');
        $file2 = \Illuminate\Http\UploadedFile::fake()->image('event1.png');

        // 1. Upload new slider photos
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/content", [
                'home_slider' => [
                    [
                        'url' => '',
                        'file' => $file1,
                    ]
                ],
                'event_slider' => [
                    [
                        'url' => '',
                        'file' => $file2,
                    ]
                ]
            ]);

        $response->assertStatus(302);

        // Verify sliders are created and converted to WebP
        $homeSliderContent = \App\Models\EventContent::where('event_id', $event->id)
            ->where('key', 'home_slider')
            ->first();
        $this->assertNotNull($homeSliderContent);
        $this->assertCount(1, $homeSliderContent->value);
        $this->assertStringStartsWith('/storage/slider/home/', $homeSliderContent->value[0]);
        $this->assertStringEndsWith('.webp', $homeSliderContent->value[0]);

        $eventSliderContent = \App\Models\EventContent::where('event_id', $event->id)
            ->where('key', 'event_slider')
            ->first();
        $this->assertNotNull($eventSliderContent);
        $this->assertCount(1, $eventSliderContent->value);
        $this->assertStringStartsWith('/storage/slider/event/', $eventSliderContent->value[0]);
        $this->assertStringEndsWith('.webp', $eventSliderContent->value[0]);

        // Assert files actually exist in public disk
        $homePath = str_replace('/storage/', '', $homeSliderContent->value[0]);
        $eventPath = str_replace('/storage/', '', $eventSliderContent->value[0]);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($homePath);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($eventPath);

        // 2. Remove slider items
        $response = $this->actingAs($admin)
            ->post("/admin/events/{$event->slug}/content", [
                'home_slider' => [],
                'event_slider' => []
            ]);
        $response->assertStatus(302);

        // Verify keys are deleted when empty
        $this->assertDatabaseMissing('event_contents', [
            'event_id' => $event->id,
            'key' => 'home_slider',
        ]);
        $this->assertDatabaseMissing('event_contents', [
            'event_id' => $event->id,
            'key' => 'event_slider',
        ]);
    }
}
