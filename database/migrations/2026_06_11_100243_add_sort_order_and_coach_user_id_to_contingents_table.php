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
        Schema::table('contingents', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('status');
            $table->foreignId('coach_user_id')->nullable()->constrained('users')->nullOnDelete()->after('coach_email');
        });
    }

    public function down(): void
    {
        Schema::table('contingents', function (Blueprint $table) {
            $table->dropForeign(['coach_user_id']);
            $table->dropColumn(['sort_order', 'coach_user_id']);
        });
    }
};
