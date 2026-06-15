<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('score_pbb_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('score_id')->constrained('scores')->onDelete('cascade');
            $table->integer('movement_index');
            $table->decimal('score', 3, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('score_pbb_details');
    }
};
