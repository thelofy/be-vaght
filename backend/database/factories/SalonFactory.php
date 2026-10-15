<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Salon>
 */
class SalonFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company() . ' Barbershop';

        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(100, 999),
            'phone' => fake()->numerify('09#########'),
            'address' => fake()->address(),
            'opening_time' => '09:00',
            'closing_time' => '21:00',
            'slot_interval_minutes' => 30,
            'is_active' => true,
        ];
    }
}
