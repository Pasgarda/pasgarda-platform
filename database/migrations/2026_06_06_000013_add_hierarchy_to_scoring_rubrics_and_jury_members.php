<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update scoring_rubrics table
        Schema::table('scoring_rubrics', function (Blueprint $table) {
            $table->string('round')->default('rekap')->after('event_id');
            $table->unsignedBigInteger('parent_id')->nullable()->after('round');
            $table->string('code')->nullable()->after('name');

            $table->foreign('parent_id')->references('id')->on('scoring_rubrics')->cascadeOnDelete();
        });

        // 2. Update jury_members table
        Schema::table('jury_members', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
        });

        Schema::table('jury_members', function (Blueprint $table) {
            $table->dropUnique(['event_id', 'jury_type', 'jury_number']);
        });

        Schema::table('jury_members', function (Blueprint $table) {
            $table->string('round')->default('rekap')->after('event_id');
            $table->unique(['event_id', 'round', 'jury_type', 'jury_number'], 'jury_members_round_unique');
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });

        // 3. Update jury_scores table
        Schema::table('jury_scores', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->dropForeign(['contingent_id']);
        });

        Schema::table('jury_scores', function (Blueprint $table) {
            $table->dropUnique(['event_id', 'contingent_id', 'jury_type', 'jury_number']);
        });

        Schema::table('jury_scores', function (Blueprint $table) {
            $table->string('round')->default('rekap')->after('event_id');
            $table->unique(['event_id', 'round', 'contingent_id', 'jury_type', 'jury_number'], 'jury_scores_round_unique');
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->foreign('contingent_id')->references('id')->on('contingents')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        // Revert jury_scores
        Schema::table('jury_scores', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->dropForeign(['contingent_id']);
        });

        Schema::table('jury_scores', function (Blueprint $table) {
            $table->dropUnique('jury_scores_round_unique');
        });

        Schema::table('jury_scores', function (Blueprint $table) {
            $table->unique(['event_id', 'contingent_id', 'jury_type', 'jury_number']);
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->foreign('contingent_id')->references('id')->on('contingents')->cascadeOnDelete();
            $table->dropColumn('round');
        });

        // Revert jury_members
        Schema::table('jury_members', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
        });

        Schema::table('jury_members', function (Blueprint $table) {
            $table->dropUnique('jury_members_round_unique');
        });

        Schema::table('jury_members', function (Blueprint $table) {
            $table->unique(['event_id', 'jury_type', 'jury_number']);
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->dropColumn('round');
        });

        // Revert scoring_rubrics
        Schema::table('scoring_rubrics', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['round', 'parent_id', 'code']);
        });
    }
};
