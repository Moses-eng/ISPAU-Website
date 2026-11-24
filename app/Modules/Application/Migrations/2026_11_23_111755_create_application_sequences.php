<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_sequences', function (Blueprint $table) {
            $table->id();
            // scope allows independent sequences in the future (e.g. per-year)
            $table->string('scope')->unique();     // e.g. 'default' or '2026'
            $table->unsignedBigInteger('last_value')->default(0);
            $table->timestamps();
        });

        // Seed the default scope so the first create is safe
        DB::table('application_sequences')->insert([
            'scope'      => 'default',
            'last_value' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('application_sequences');
    }
};
