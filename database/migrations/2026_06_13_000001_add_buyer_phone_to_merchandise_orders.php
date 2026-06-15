<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchandise_orders', function (Blueprint $table) {
            $table->string('buyer_phone', 20)->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('merchandise_orders', function (Blueprint $table) {
            $table->dropColumn('buyer_phone');
        });
    }
};
