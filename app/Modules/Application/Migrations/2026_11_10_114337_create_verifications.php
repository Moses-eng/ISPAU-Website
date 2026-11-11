<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('application_id');
            $table->uuid('reviewer_id');
            $table->string('reviewer_name');
            $table->uuid('assigned_by');
            $table->string('assigned_by_name')->nullable();

            // One column per checklist item, snapshot of the dialog fields
            $table->string('registration_result');      // Verified | Clarification needed | Not applicable
            $table->text('registration_note');
            $table->string('authority_result');
            $table->text('authority_note');
            $table->string('regulatory_result');
            $table->text('regulatory_note');

            $table->enum('status', [
                'Recorded',
                'Superseded',
            ])->default('Recorded');

            $table->timestamp('recorded_at')->useCurrent();

            $table->timestamps();

            $table->foreign('application_id')
                ->references('id')->on('applications')
                ->cascadeOnDelete();

            $table->index('application_id');
            $table->index('reviewer_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verifications');
    }
};
