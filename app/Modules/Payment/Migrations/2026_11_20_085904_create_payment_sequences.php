<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('scope')->unique();          // e.g. 'default'
            $table->unsignedBigInteger('last_value')->default(0);
            $table->timestamps();
        });

        DB::table('payment_sequences')->insert([
            'scope'      => 'default',
            'last_value' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_sequences');
    }
};
