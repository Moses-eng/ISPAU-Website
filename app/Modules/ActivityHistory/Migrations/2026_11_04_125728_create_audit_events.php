<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_events', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('session_id')->index();
            $table->uuid('actor_id')->index();
            $table->string('actor_name');
            $table->string('actor_kind')->default('staff');

            $table->json('roles');                 // array of StaffRole
            $table->timestamp('occurred_at')->index();

            $table->string('kind');                // login|logout|view|change|download|account
            $table->string('area');                // membership|finance|overview|reports|administration|session
            $table->string('summary');

            $table->string('section')->nullable();
            $table->uuid('record_id')->nullable();
            $table->string('organisation')->nullable();
            $table->uuid('organisation_id')->nullable();

            $table->string('filename')->nullable();
            $table->unsignedInteger('record_count')->nullable();

            $table->json('changed_fields')->nullable();
            $table->json('transitions')->nullable();

            $table->timestamps();

            $table->index(['actor_id', 'occurred_at']);
            $table->index(['area', 'occurred_at']);
            $table->index(['kind', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_events');
    }
};
