<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('ticket_notification_email')->nullable()->after('gate_schedules');
            $table->string('merchandise_notification_email')->nullable()->after('ticket_notification_email');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['ticket_notification_email', 'merchandise_notification_email']);
        });
    }
};
