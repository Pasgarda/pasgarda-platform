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
                $table->enum('role', ['super_admin', 'admin', 'operator_gate', 'operator_nilai', 'operator_produk', 'spectator', 'coach'])->default('spectator');
                $table->string('google_id')->nullable();
                $table->string('otp_code', 6)->nullable();
                $table->timestamp('otp_expires_at')->nullable();
                $table->string('password')->nullable();
                $table->string('avatar')->nullable();
                $table->string('phone', 20)->nullable();
                $table->unsignedTinyInteger('jury_number')->nullable();
                $table->timestamp('last_login_at')->nullable();
                $table->rememberToken();
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
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','operator_gate','operator_nilai','operator_produk','spectator','coach') NOT NULL DEFAULT 'spectator'");
        }
    }

    public function down(): void
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
                $table->string('password')->nullable();
                $table->string('avatar')->nullable();
                $table->string('phone', 20)->nullable();
                $table->unsignedTinyInteger('jury_number')->nullable();
                $table->timestamp('last_login_at')->nullable();
                $table->rememberToken();
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
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin','operator_gate','operator_nilai','spectator','coach') NOT NULL DEFAULT 'spectator'");
        }
    }
};
