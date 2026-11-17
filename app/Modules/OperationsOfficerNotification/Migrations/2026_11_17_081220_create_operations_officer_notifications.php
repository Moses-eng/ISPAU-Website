<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operations_officer_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('applicant_id')->constrained('applications')->cascadeOnDelete();
            $table->string('applicant_name')->nullable();
            $table->string('applicant_email')->nullable();

            $table->string('title', 255);
            $table->text('message');
            $table->string('type', 20)->default('info');

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            $table->index('applicant_id');
            $table->index('is_read');
            $table->index(['applicant_id', 'is_read']);
            $table->index(['applicant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operations_officer_notifications');
    }
};
