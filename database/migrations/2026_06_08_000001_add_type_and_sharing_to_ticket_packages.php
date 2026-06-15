<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_packages', function (Blueprint $table) {
            $table->string('type')->default('online')->after('event_id');
            $table->integer('sharing_allowance')->default(0)->after('coupon_allowance');
        });

        DB::table('ticket_packages')
            ->where('name', 'Silver')
            ->update(['type' => 'online', 'sharing_allowance' => 1, 'coupon_allowance' => 0]);

        DB::table('ticket_packages')
            ->where('name', 'Gold')
            ->update(['type' => 'ots', 'coupon_allowance' => 1]);

        DB::table('ticket_packages')
            ->where('name', 'Platinum')
            ->update(['type' => 'ots', 'vote_allowance' => 3, 'coupon_allowance' => 2]);

        $silverOts = DB::table('ticket_packages')
            ->where('name', 'Silver')
            ->where('type', 'online')
            ->get();

        foreach ($silverOts as $pkg) {
            $exists = DB::table('ticket_packages')
                ->where('event_id', $pkg->event_id)
                ->where('name', 'Silver')
                ->where('type', 'ots')
                ->exists();

            if (!$exists) {
                DB::table('ticket_packages')->insert([
                    'event_id' => $pkg->event_id,
                    'type' => 'ots',
                    'name' => 'Silver',
                    'price' => $pkg->price,
                    'validity_days' => $pkg->validity_days,
                    'vote_allowance' => $pkg->vote_allowance,
                    'coupon_allowance' => 1,
                    'sharing_allowance' => 0,
                    'stock' => null,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('ticket_packages')
            ->where('type', 'ots')
            ->where('name', 'Silver')
            ->whereNull('sharing_allowance')
            ->delete();

        DB::table('ticket_packages')
            ->where('name', 'Silver')
            ->update(['type' => 'online', 'sharing_allowance' => 0]);

        DB::table('ticket_packages')
            ->where('name', 'Gold')
            ->update(['type' => 'online']);

        DB::table('ticket_packages')
            ->where('name', 'Platinum')
            ->update(['type' => 'online', 'vote_allowance' => 2, 'coupon_allowance' => 1]);

        Schema::table('ticket_packages', function (Blueprint $table) {
            $table->dropColumn(['type', 'sharing_allowance']);
        });
    }
};
