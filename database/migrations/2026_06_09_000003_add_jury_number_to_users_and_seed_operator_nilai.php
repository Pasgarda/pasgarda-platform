<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'jury_number')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedTinyInteger('jury_number')->nullable()->after('role');
            });
        }

        $password = Hash::make('password');
        $now = now();

        $accounts = [
            ['name' => 'Operator Nilai 1', 'email' => 'nilai1@pasgarda.com', 'jury_number' => 1],
            ['name' => 'Operator Nilai 2', 'email' => 'nilai2@pasgarda.com', 'jury_number' => 2],
            ['name' => 'Operator Nilai 3', 'email' => 'nilai3@pasgarda.com', 'jury_number' => 3],
            ['name' => 'Master Monitor', 'email' => 'nilai4@pasgarda.com', 'jury_number' => null],
        ];

        foreach ($accounts as $acc) {
            DB::table('users')->updateOrInsert(
                ['email' => $acc['email']],
                [
                    'name' => $acc['name'],
                    'role' => 'operator_nilai',
                    'jury_number' => $acc['jury_number'],
                    'password' => $password,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    public function down(): void
    {
        DB::table('users')->whereIn('email', [
            'nilai1@pasgarda.com', 'nilai2@pasgarda.com',
            'nilai3@pasgarda.com', 'nilai4@pasgarda.com',
        ])->delete();

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('jury_number');
        });
    }
};
