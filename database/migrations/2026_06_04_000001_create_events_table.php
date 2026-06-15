<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('date_start');
            $table->date('date_end');
            $table->string('venue');
            $table->enum('status', ['draft', 'active', 'archived'])->default('draft');
            $table->integer('max_tickets_per_user')->default(15);
            $table->enum('leaderboard_status', ['draft', 'published'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
