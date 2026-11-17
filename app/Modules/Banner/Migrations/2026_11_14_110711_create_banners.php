<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banners', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('image');                    // relative: images/Banner/{id}/image.jpg
            $table->string('name');                     // internal label / alt base
            $table->string('description')->nullable();  // caption / accessibility text
            $table->string('page_name');                // e.g. home, membership, directory
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();

            $table->index('status');
            $table->index('page_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
