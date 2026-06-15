<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hall_of_fames', function (Blueprint $table) {
            $table->id();
            $table->integer('year');
            $table->string('event_name');
            $table->string('champion');
            $table->string('runner_up');
            $table->string('best_commander');
            $table->string('favorite');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hall_of_fames');
    }
};
