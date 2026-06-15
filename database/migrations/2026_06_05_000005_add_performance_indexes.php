<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['event_id', 'payment_status', 'payment_method'], 'idx_orders_event_paystat_method');
            $table->index(['user_id', 'event_id', 'payment_status'], 'idx_orders_user_event_paystat');
        });

        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->index(['order_id', 'check_in_status'], 'idx_issued_tickets_order_checkin');
            $table->index('check_in_status', 'idx_issued_tickets_checkin');
        });

        Schema::table('vote_logs', function (Blueprint $table) {
            $table->index(['issued_ticket_id', 'created_at'], 'idx_votelogs_ticket_created');
            $table->index(['contingent_id', 'event_id'], 'idx_votelogs_contingent_event');
            $table->index(['event_id', 'created_at'], 'idx_votelogs_event_created');
        });

        Schema::table('supporter_logs', function (Blueprint $table) {
            $table->index(['issued_ticket_id', 'created_at'], 'idx_supporterlogs_ticket_created');
            $table->index(['contingent_id', 'event_id'], 'idx_supporterlogs_contingent_event');
            $table->index(['event_id', 'created_at'], 'idx_supporterlogs_event_created');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_event_paystat_method');
            $table->dropIndex('idx_orders_user_event_paystat');
        });

        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->dropIndex('idx_issued_tickets_order_checkin');
            $table->dropIndex('idx_issued_tickets_checkin');
        });

        Schema::table('vote_logs', function (Blueprint $table) {
            $table->dropIndex('idx_votelogs_ticket_created');
            $table->dropIndex('idx_votelogs_contingent_event');
            $table->dropIndex('idx_votelogs_event_created');
        });

        Schema::table('supporter_logs', function (Blueprint $table) {
            $table->dropIndex('idx_supporterlogs_ticket_created');
            $table->dropIndex('idx_supporterlogs_contingent_event');
            $table->dropIndex('idx_supporterlogs_event_created');
        });
    }
};
