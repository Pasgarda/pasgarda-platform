<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jury_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('jury_type'); // pbb, vafor, makeup_kostum
            $table->integer('jury_number'); // 1, 2, or 3
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['event_id', 'jury_type', 'jury_number']);
            $table->index(['event_id', 'jury_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jury_members');
    }
};
