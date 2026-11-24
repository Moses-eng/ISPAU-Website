<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('subscription_id')->index();

            // 30_days | 14_days | 7_days | 1_day | expired
            $table->string('reminder_type');

            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->unique(['subscription_id', 'reminder_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_reminders');
    }
};
