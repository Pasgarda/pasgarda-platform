<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CleanDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("Clearing all demo/mock transactional and contingent data...");

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Clear mock scores and scoring details
        DB::table('jury_scores')->truncate();
        DB::table('scores')->truncate();
        DB::table('scores_final_round')->truncate();
        if (Schema::hasTable('score_pbb_details')) {
            DB::table('score_pbb_details')->truncate();
        }

        // Clear mock tickets, orders, and votes
        DB::table('vote_logs')->truncate();
        DB::table('supporter_logs')->truncate();
        DB::table('issued_tickets')->truncate();
        DB::table('orders')->truncate();

        // Clear mock merchandise logs
        DB::table('merchandise_sales')->truncate();
        DB::table('merchandise_purchases')->truncate();
        if (Schema::hasTable('merchandise_orders')) {
            DB::table('merchandise_orders')->truncate();
        }

        // Clear mock social interactions & testimonials
        DB::table('social_media_likes')->truncate();
        DB::table('testimonials')->truncate();
        if (Schema::hasTable('visitor_counts')) {
            DB::table('visitor_counts')->truncate();
        }
        if (Schema::hasTable('activity_logs')) {
            DB::table('activity_logs')->truncate();
        }

        // Clear mock contingents (the 56 seeded schools)
        DB::table('contingents')->truncate();

        // Delete coach users and demo voters
        DB::table('users')->where('role', 'coach')->delete();
        DB::table('users')->where('email', 'like', 'demo_voter_%')->delete();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info("Demo data cleared successfully! System is clean and ready for real data.");
    }
}

