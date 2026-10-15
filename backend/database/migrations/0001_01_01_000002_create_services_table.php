<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salon_id')->constrained('salons')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->unsignedBigInteger('price')->default(0);
            $table->boolean('show_price')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['salon_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
