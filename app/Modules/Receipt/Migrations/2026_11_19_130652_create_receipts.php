<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->uuid('receipt_id')->primary();

            $table->uuid('invoice_id')->index();
            $table->uuid('applicant_id')->index();

            // relative path: finance/receipt/{receipt_id}.pdf
            $table->string('receipt_pdf')->nullable();

            $table->timestamps();

            $table->index(['invoice_id', 'applicant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
