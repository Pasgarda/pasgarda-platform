<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('contingents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->string('school_name');
            $table->string('region');
            $table->enum('category_type', ['U12', 'U16', 'U19', 'Purna']);
            $table->string('logo_path')->nullable();
            $table->boolean('is_reguler')->default(false);
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'verified'])->default('pending');
            $table->string('coach_name');
            $table->string('coach_phone', 20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contingents');
    }
};
