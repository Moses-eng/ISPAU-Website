<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('title', 180);
            $table->string('slug', 140)->unique();
            $table->string('category', 80);
            $table->string('author', 120);

            // Activity-specific fields
            $table->string('organiser', 180)->nullable();
            $table->string('location', 240)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('date_note', 240)->nullable();
            $table->string('registration_url', 2048)->nullable();

            $table->text('summary')->nullable();
            $table->longText('body'); // Rich text JSON document

            $table->string('image')->nullable();
            $table->string('image_url')->nullable();
            $table->string('image_alt')->nullable();
            $table->string('image_credit')->nullable();

            $table->string('seo_title', 180)->nullable();
            $table->string('seo_description', 320)->nullable();

            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('category');
            $table->index('author');
            $table->index('starts_at');
            $table->index('ends_at');
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
