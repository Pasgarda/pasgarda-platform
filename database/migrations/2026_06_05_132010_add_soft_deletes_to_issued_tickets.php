<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->softDeletes();
            $table->string('deleted_reason')->nullable()->after('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::table('issued_tickets', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('deleted_reason');
        });
    }
};
