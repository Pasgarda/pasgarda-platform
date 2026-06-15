<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('event_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->string('key'); // agenda, judges, banthal_prize, useful_links
            $table->json('value');
            $table->timestamps();

            $table->unique(['event_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_contents');
    }
};
