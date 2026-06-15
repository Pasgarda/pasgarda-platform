<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->integer('sharing_tokens_remaining')->default(0)->after('coupon_tokens_remaining');
        });
    }

    public function down(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->dropColumn('sharing_tokens_remaining');
        });
    }
};
