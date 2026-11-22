<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('payment_id')->primary();
            $table->string('payment_no')->nullable();

            $table->uuid('invoice_id')->index();
            $table->uuid('applicant_id')->index();

            // system_users.id — must be a finance_admin (enforced by FinanceAdminRule)
            $table->uuid('created_by')->nullable()->index();

            $table->decimal('amount', 15, 2)->default(0);

            // active | not active
            $table->enum('status', ['active', 'not active'])->default('active');

            $table->string('period')->nullable();                 // e.g. "days"
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference')->nullable()->index();

            $table->timestamps();

            $table->index('status');
            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};


