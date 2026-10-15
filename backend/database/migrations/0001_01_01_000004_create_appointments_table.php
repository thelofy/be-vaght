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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salon_id')->constrained('salons')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->dateTime('starts_at')->index();
            $table->dateTime('ends_at')->index();
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('confirmed');
            $table->text('barber_notes')->nullable();
            $table->timestamps();

            // Composite indexes for fast schedule lookups and slot conflict prevention
            $table->index(['salon_id', 'starts_at']);
            $table->index(['salon_id', 'status']);
            $table->index(['user_id', 'starts_at']);
            $table->index(['customer_id', 'starts_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
