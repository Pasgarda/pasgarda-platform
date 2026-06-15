<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('jury_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('contingent_id')->constrained('contingents')->onDelete('cascade');
            $table->string('jury_type'); // 'pbb', 'vafor', 'makeup_kostum'
            $table->integer('jury_number'); // 1, 2, 3
            
            // Total score components
            $table->decimal('pbb_score', 8, 2)->default(0.00);
            $table->decimal('danton_score', 8, 2)->default(0.00);
            $table->decimal('vafor_score', 8, 2)->default(0.00);
            $table->decimal('kostum_score', 8, 2)->default(0.00);
            $table->decimal('makeup_score', 8, 2)->default(0.00);
            $table->decimal('penalties_score', 8, 2)->default(0.00);
            $table->decimal('total_score', 8, 2)->default(0.00);
            
            // JSON detailed item scores
            $table->json('pbb_details')->nullable();
            $table->json('danton_details')->nullable();
            $table->json('variasi_details')->nullable();
            $table->json('formasi_details')->nullable();
            $table->json('danton_vafor_details')->nullable();
            $table->json('kostum_details')->nullable();
            $table->json('makeup_details')->nullable();
            
            $table->timestamps();

            // Unique key: only one entry per event, contingent, jury_type, and jury number
            $table->unique(['event_id', 'contingent_id', 'jury_type', 'jury_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jury_scores');
    }
};
