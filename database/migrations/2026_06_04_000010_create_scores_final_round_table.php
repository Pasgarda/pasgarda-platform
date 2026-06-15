<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('scores_final_round', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('contingent_id')->constrained('contingents')->onDelete('cascade');
            $table->decimal('score_juri_1', 8, 2)->default(0.00);
            $table->decimal('score_juri_2', 8, 2)->default(0.00);
            $table->decimal('penalties', 8, 2)->default(0.00);
            $table->decimal('voting_bonus', 8, 2)->default(0.00);
            $table->decimal('total_score', 10, 2)->default(0.00);
            
            // Juri 1 details
            $table->json('juri_1_pbb_details')->nullable();
            $table->json('juri_1_danton_details')->nullable();
            $table->json('juri_1_variasi_details')->nullable();
            $table->json('juri_1_formasi_details')->nullable();
            $table->json('juri_1_danton_vafor_details')->nullable();
            
            // Juri 2 details
            $table->json('juri_2_pbb_details')->nullable();
            $table->json('juri_2_danton_details')->nullable();
            $table->json('juri_2_variasi_details')->nullable();
            $table->json('juri_2_formasi_details')->nullable();
            $table->json('juri_2_danton_vafor_details')->nullable();
            
            $table->timestamps();

            $table->unique(['event_id', 'contingent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scores_final_round');
    }
};
