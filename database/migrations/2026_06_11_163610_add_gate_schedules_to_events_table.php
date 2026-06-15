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
            $table->json('gate_schedules')->nullable()->after('gate_status');
            $table->dropColumn(['gate_open_at', 'gate_close_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('gate_schedules');
            $table->dateTime('gate_open_at')->nullable()->after('gate_status');
            $table->dateTime('gate_close_at')->nullable()->after('gate_open_at');
        });
    }
};
