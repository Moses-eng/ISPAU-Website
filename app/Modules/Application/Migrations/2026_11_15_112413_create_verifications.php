<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('application_id');
            $table->uuid('reviewer_id');
            $table->string('reviewer_name');
            $table->uuid('assigned_by');
            $table->string('assigned_by_name')->nullable();

            $table->string('registration_result');
            $table->json('registration_note');
            $table->string('authority_result');
            $table->json('authority_note');
            $table->string('regulatory_result');
            $table->json('regulatory_note');

            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();

            $table->foreign('application_id')
                ->references('id')->on('applications')
                ->cascadeOnDelete();

            $table->index('application_id');
            $table->index('reviewer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_verifications');
    }
};
