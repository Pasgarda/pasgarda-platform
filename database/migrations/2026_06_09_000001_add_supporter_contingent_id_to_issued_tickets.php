<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->foreignId('supporter_contingent_id')
                ->nullable()
                ->after('sharing_tokens_remaining')
                ->constrained('contingents')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->dropForeign(['supporter_contingent_id']);
            $table->dropColumn('supporter_contingent_id');
        });
    }
};
