<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('work_email');
            $table->string('organisation');
            $table->text('message');
            $table->string('enquiry_type');
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();

            $table->index('status');
            $table->index('work_email');
            $table->index('enquiry_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
