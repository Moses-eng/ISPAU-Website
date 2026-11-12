<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // ---- Organisation identity ----
            $table->string('legal_name')->nullable();
            $table->string('trading_name')->nullable();
            $table->string('entity_type')->nullable();
            $table->string('registration_country')->default('Uganda');
            $table->string('registration_reference')->nullable();
            $table->string('business_email')->unique();
            $table->string('business_phone', 30)->nullable();
            $table->string('website')->nullable();

            // ---- Account Credentials ----
            $table->string('password')->nullable();

            // ---- Addresses (text for multiline) ----
            $table->text('registered_address')->nullable();
            $table->text('uganda_address')->nullable();

            // ---- Profile / classification ----
            $table->string('category')->nullable();
            $table->string('operational_status')->nullable();
            $table->string('requested_tier')->nullable();
            $table->string('customer_facing')->default('No');

            // ---- Compliance ----
            $table->string('pdpo_status')->nullable();
            $table->string('licence_relevant')->nullable();

            // ---- Applicant / representative ----
            $table->string('applicant_name')->nullable();
            $table->string('applicant_role')->nullable();
            $table->string('applicant_email')->nullable();
            $table->string('applicant_phone', 30)->nullable();
            $table->string('representative_name')->nullable();
            $table->string('representative_role')->nullable();
            $table->string('representative_email')->nullable();
            $table->string('representative_phone', 30)->nullable();

            // ---- Billing ----
            $table->string('billing_email')->nullable();
            $table->string('billing_contact')->nullable();
            $table->text('invoice_address')->nullable();

            // ---- JSON blocks ----
            $table->json('organisation_details')->nullable();
            $table->json('compliance_details')->nullable();
            $table->json('applicant_details')->nullable();
            $table->json('billing_details')->nullable();
            $table->json('profile_optional')->nullable();
            $table->json('restrictions')->nullable();
            $table->json('declarations')->nullable();
            $table->json('attachments')->nullable();

            // ---- Status ----
            $table->enum('status', [
                'Draft',
                'Submitted',
                'Under review',
                'Clarification needed',
                'Decision pending',
                'Approved awaiting payment',
                'Active',
                'Deferred',
                'Declined',
            ])->default('Submitted');

            $table->timestamps();

            $table->index('status');
            $table->index('business_email');
            $table->index('requested_tier');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};

