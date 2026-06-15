<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function ($table) {
            $table->json('wa_contacts')->nullable()->after('ticket_sale_status');
        });

        // Migrate existing data
        DB::table('events')->get()->each(function ($event) {
            $contacts = [];
            if ($event->wa_contact_zahra) {
                $contacts[] = ['name' => 'Zahra', 'phone' => $event->wa_contact_zahra];
            }
            if ($event->wa_contact_tegar) {
                $contacts[] = ['name' => 'Tegar', 'phone' => $event->wa_contact_tegar];
            }
            DB::table('events')->where('id', $event->id)->update([
                'wa_contacts' => json_encode($contacts),
            ]);
        });

        Schema::table('events', function ($table) {
            $table->dropColumn(['wa_contact_zahra', 'wa_contact_tegar']);
        });
    }

    public function down(): void
    {
        Schema::table('events', function ($table) {
            $table->string('wa_contact_zahra')->nullable()->after('ticket_sale_status');
            $table->string('wa_contact_tegar')->nullable()->after('wa_contact_zahra');
        });

        // Restore from wa_contacts (match by name)
        DB::statement("UPDATE events SET
            wa_contact_zahra = JSON_UNQUOTE(JSON_EXTRACT(wa_contacts, '$[0].phone')),
            wa_contact_tegar = JSON_UNQUOTE(JSON_EXTRACT(wa_contacts, '$[1].phone'))
        ");

        Schema::table('events', function ($table) {
            $table->dropColumn('wa_contacts');
        });
    }
};
