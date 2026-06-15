<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchandise_purchases', function (Blueprint $table) {
            $table->foreignId('merchandise_order_id')->nullable()->constrained('merchandise_orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('merchandise_purchases', function (Blueprint $table) {
            $table->dropForeign(['merchandise_order_id']);
            $table->dropColumn('merchandise_order_id');
        });
    }
};
