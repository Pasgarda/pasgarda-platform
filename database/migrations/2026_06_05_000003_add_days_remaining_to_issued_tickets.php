<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->integer('days_remaining')->default(1)->after('vote_tokens_remaining');
            $table->integer('coupon_tokens_remaining')->default(0)->after('days_remaining');
        });
    }

    public function down(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->dropColumn('days_remaining');
            $table->dropColumn('coupon_tokens_remaining');
        });
    }
};
