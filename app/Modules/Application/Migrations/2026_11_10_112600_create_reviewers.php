<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviewers', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('application_id');
            $table->uuid('reviewer_id');          // the staff user assigned
            $table->string('reviewer_name');      // denormalised snapshot for display
            $table->uuid('assigned_by');          // admin user id
            $table->string('assigned_by_name')->nullable();

            $table->enum('status', [
                'Assigned',
                'In review',
                'Completed',
                'Withdrawn',
            ])->default('Assigned');

            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->foreign('application_id')
                ->references('id')->on('applications')
                ->cascadeOnDelete();

            $table->index('application_id');
            $table->index('reviewer_id');
            $table->index('status');

            // Prevent the same reviewer being assigned twice concurrently
            $table->unique(['application_id', 'reviewer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviewers');
    }
};
