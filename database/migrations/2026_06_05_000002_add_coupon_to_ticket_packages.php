<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ticket_packages', function (Blueprint $table) {
            $table->integer('coupon_allowance')->default(0)->after('vote_allowance');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_packages', function (Blueprint $table) {
            $table->dropColumn('coupon_allowance');
        });
    }
};
