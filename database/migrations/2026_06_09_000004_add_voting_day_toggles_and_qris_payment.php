<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'voting_day_1_status')) {
                $table->enum('voting_day_1_status', ['active', 'stopped'])->default('active')->after('supporter_status');
            }
            if (!Schema::hasColumn('events', 'voting_day_2_status')) {
                $table->enum('voting_day_2_status', ['active', 'stopped'])->default('active')->after('voting_day_1_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['voting_day_1_status', 'voting_day_2_status']);
        });
    }
};
