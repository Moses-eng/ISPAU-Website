<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->string('otp_code_hash')->nullable()->after('password');
            $table->timestamp('otp_requested_at')->nullable()->after('otp_code_hash');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_requested_at');
            $table->unsignedTinyInteger('otp_attempts')->default(0)->after('otp_expires_at');
            $table->timestamp('last_login_at')->nullable()->after('otp_attempts');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'otp_code_hash',
                'otp_requested_at',
                'otp_expires_at',
                'otp_attempts',
                'last_login_at',
                'last_login_ip',
            ]);
        });
    }
};
