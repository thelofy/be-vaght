<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Salon;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $salon = Salon::create([
            'name' => 'Aron Barbershop',
            'slug' => 'aron',
            'phone' => '09120000000',
            'address' => 'Tehran, Valiasr St.',
            'opening_time' => '09:00',
            'closing_time' => '21:00',
            'slot_interval_minutes' => 30,
            'is_active' => true,
        ]);

        User::create([
            'salon_id' => $salon->id,
            'name' => 'Aron (Owner)',
            'phone' => '09121111111',
            'password' => Hash::make('password'),
            'role' => UserRole::OWNER,
        ]);

        User::create([
            'salon_id' => $salon->id,
            'name' => 'Reza (Barber)',
            'phone' => '09122222222',
            'password' => Hash::make('password'),
            'role' => UserRole::BARBER,
        ]);
    }
}
