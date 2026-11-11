<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clarifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('application_id');
            $table->uuid('reviewer_id');                // staff user raising the request
            $table->string('reviewer_name');            // snapshot for display
            $table->uuid('assigned_by');                // who formally assigned (usually same admin)
            $table->string('assigned_by_name')->nullable();

            // What is being asked
            $table->string('subject');
            $table->text('message');
            $table->json('items')->nullable();           // optional checklist of required items

            // Applicant's consolidated response
            $table->text('response')->nullable();
            $table->timestamp('responded_at')->nullable();

            // Workflow
            $table->enum('status', [
                'Open',
                'Responded',
                'Accepted',
                'Rejected',
                'Closed',
            ])->default('Open');

            $table->timestamp('requested_at')->useCurrent();

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
        Schema::dropIfExists('clarifications');
    }
};
