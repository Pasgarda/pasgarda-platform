<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('scores_final_round', function (Blueprint $table) {
            $table->decimal('pbb_score', 8, 2)->default(0.00)->after('contingent_id');
            $table->decimal('danton_score', 8, 2)->default(0.00)->after('pbb_score');
            $table->decimal('vafor_score', 8, 2)->default(0.00)->after('danton_score');
            
            $table->json('juri_3_pbb_details')->nullable()->after('juri_2_danton_vafor_details');
            $table->json('juri_3_danton_details')->nullable()->after('juri_3_pbb_details');
        });
    }

    public function down(): void
    {
        Schema::table('scores_final_round', function (Blueprint $table) {
            $table->dropColumn([
                'pbb_score',
                'danton_score',
                'vafor_score',
                'juri_3_pbb_details',
                'juri_3_danton_details',
            ]);
        });
    }
};
