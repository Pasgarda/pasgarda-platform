<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('wa_contact_zahra')->nullable()->after('ticket_sale_status');
            $table->string('wa_contact_tegar')->nullable()->after('wa_contact_zahra');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['wa_contact_zahra', 'wa_contact_tegar']);
        });
    }
};
