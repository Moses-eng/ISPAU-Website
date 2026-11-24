<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applicant_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // applications.id
            $table->uuid('applicant_id')->index();

            // invoices.id
            $table->uuid('invoice_id')->index();

            // payments.payment_id
            $table->uuid('payment_id')->nullable()->index();

            $table->timestamp('payment_confirmed_at');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');

            // active | expired | cancelled
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');

            $table->timestamps();

            $table->index(['status', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicant_subscriptions');
    }
};
