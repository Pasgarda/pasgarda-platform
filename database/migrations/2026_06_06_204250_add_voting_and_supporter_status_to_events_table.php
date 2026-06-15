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
            $table->enum('voting_status', ['active', 'stopped'])->default('active')->after('leaderboard_status');
            $table->enum('supporter_status', ['active', 'stopped'])->default('active')->after('voting_status');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['voting_status', 'supporter_status']);
        });
    }
};
