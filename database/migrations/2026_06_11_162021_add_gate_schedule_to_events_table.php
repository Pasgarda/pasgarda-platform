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
            $table->string('gate_status')->default('open')->after('ticket_sale_status');
            $table->dateTime('gate_open_at')->nullable()->after('gate_status');
            $table->dateTime('gate_close_at')->nullable()->after('gate_open_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['gate_status', 'gate_open_at', 'gate_close_at']);
        });
    }
};
