<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->integer('supporter_tokens_remaining')->default(0)->after('coupon_tokens_remaining');
        });

        DB::statement('UPDATE issued_tickets SET supporter_tokens_remaining = days_remaining');
    }

    public function down(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->dropColumn('supporter_tokens_remaining');
        });
    }
};
