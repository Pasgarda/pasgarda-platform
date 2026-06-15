<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('issued_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('ticket_package_id')->constrained('ticket_packages');
            $table->string('unique_qr_hash')->unique();
            $table->string('buyer_name');
            $table->string('buyer_email')->nullable();
            $table->boolean('check_in_status')->default(false);
            $table->timestamp('checked_in_at')->nullable();
            $table->integer('vote_tokens_remaining');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issued_tickets');
    }
};
