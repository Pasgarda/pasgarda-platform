<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::create('users_temp', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email');
                $table->enum('role', ['super_admin', 'admin', 'operator_gate', 'operator_nilai', 'spectator', 'coach'])->default('spectator');
                $table->string('google_id')->nullable();
                $table->string('otp_code', 6)->nullable();
                $table->timestamp('otp_expires_at')->nullable();
                $table->timestamps();
            });
            DB::statement('INSERT INTO users_temp SELECT * FROM users');
            Schema::drop('users');
            Schema::rename('users_temp', 'users');
            Schema::table('users', function (Blueprint $table) {
                $table->unique('email', 'users_email_unique');
                $table->index('google_id', 'users_google_id_index');
            });
        } else {
            // Step 1: add new values alongside old ones
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','committee','operator','spectator','coach','admin','operator_gate','operator_nilai') NOT NULL DEFAULT 'spectator'");
            // Step 2: migrate old roles to new
            DB::table('users')->where('role', 'committee')->update(['role' => 'admin']);
            DB::table('users')->where('role', 'operator')->update(['role' => 'operator_gate']);
            // Step 3: remove old values
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','operator_gate','operator_nilai','spectator','coach') NOT NULL DEFAULT 'spectator'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::create('users_temp', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email');
                $table->enum('role', ['super_admin', 'committee', 'operator', 'spectator', 'coach'])->default('spectator');
                $table->string('google_id')->nullable();
                $table->string('otp_code', 6)->nullable();
                $table->timestamps();
            });
            DB::statement('INSERT INTO users_temp SELECT * FROM users');
            Schema::drop('users');
            Schema::rename('users_temp', 'users');
            Schema::table('users', function (Blueprint $table) {
                $table->unique('email', 'users_email_unique');
                $table->index('google_id', 'users_google_id_index');
            });
        } else {
            // Step 1: add old values alongside new
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','operator_gate','operator_nilai','spectator','coach','committee','operator') NOT NULL DEFAULT 'spectator'");
            // Step 2: reverse mapping
            DB::table('users')->whereIn('role', ['admin', 'operator_gate', 'operator_nilai'])->update(['role' => 'spectator']);
            // Step 3: remove new values
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','committee','operator','spectator','coach') NOT NULL DEFAULT 'spectator'");
        }
    }
};
