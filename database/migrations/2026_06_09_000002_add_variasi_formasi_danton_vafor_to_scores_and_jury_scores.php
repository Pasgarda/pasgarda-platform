<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jury_scores', function (Blueprint $table) {
            $table->decimal('variasi_score', 8, 2)->default(0.00)->after('vafor_score');
            $table->decimal('formasi_score', 8, 2)->default(0.00)->after('variasi_score');
            $table->decimal('danton_vafor_score', 8, 2)->default(0.00)->after('formasi_score');
        });

        Schema::table('scores', function (Blueprint $table) {
            $table->decimal('variasi_score', 8, 2)->default(0.00)->after('vafor_score');
            $table->decimal('formasi_score', 8, 2)->default(0.00)->after('variasi_score');
            $table->decimal('danton_vafor_score', 8, 2)->default(0.00)->after('formasi_score');
        });
    }

    public function down(): void
    {
        Schema::table('jury_scores', function (Blueprint $table) {
            $table->dropColumn(['variasi_score', 'formasi_score', 'danton_vafor_score']);
        });

        Schema::table('scores', function (Blueprint $table) {
            $table->dropColumn(['variasi_score', 'formasi_score', 'danton_vafor_score']);
        });
    }
};
