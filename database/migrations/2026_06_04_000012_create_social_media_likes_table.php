<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('social_media_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contingent_id')->constrained('contingents')->onDelete('cascade');
            $table->integer('likes_count_reels')->default(0);
            $table->integer('likes_count_posts')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_media_likes');
    }
};
