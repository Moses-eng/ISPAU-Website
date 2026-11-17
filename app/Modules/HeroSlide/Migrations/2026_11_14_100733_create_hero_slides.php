<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_slides', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('src');                          // relative path: images/heroSlide/{id}/image.jpg
            $table->string('description');                  // accessibility alt text
            $table->string('caption');
            $table->string('credit')->nullable();           // photographer / source
            $table->unsignedInteger('sort_order')->default(0);
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();

            $table->index('status');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_slides');
    }
};
