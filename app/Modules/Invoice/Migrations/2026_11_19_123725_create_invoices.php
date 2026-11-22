<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Applicant reference (applications.id)
            $table->uuid('applicant_id')->index();

            $table->string('invoice_number')->unique();
            $table->decimal('total', 15, 2)->default(0);

            // active | not active
            $table->enum('status', ['active', 'not active'])->default('active');

            $table->date('invoice_date');
            $table->string('invoice_pdf')->nullable();          // relative path: finance/invoices/{id}.pdf
            $table->string('membership_period')->nullable(); // days
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->uuid('confirmed_by')->nullable()->index();  // system_users.id

            // Confirmed | Pending (note: spec spells "pendding"; normalised to "Pending")
            $table->enum('payment_status', ['Confirmed', 'Pending'])->default('Pending');

            $table->timestamps();

            $table->index('payment_status');
            $table->index('invoice_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
