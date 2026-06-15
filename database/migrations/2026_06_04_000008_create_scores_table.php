<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('contingent_id')->constrained('contingents')->onDelete('cascade');
            $table->decimal('pbb_score', 8, 2)->default(0.00);
            $table->decimal('danton_score', 8, 2)->default(0.00);
            $table->decimal('vafor_score', 8, 2)->default(0.00);
            $table->decimal('kostum_score', 8, 2)->default(0.00);
            $table->decimal('makeup_score', 8, 2)->default(0.00);
            $table->decimal('penalties_score', 8, 2)->default(0.00);
            $table->decimal('nilai_kontingen_bonus', 8, 2)->default(0.00);
            $table->decimal('grand_total', 10, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scores');
    }
};
