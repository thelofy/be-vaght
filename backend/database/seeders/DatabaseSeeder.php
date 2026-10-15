<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Salon;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Salon "سالن آرون"
        $salon = Salon::create([
            'name' => 'سالن آرون',
            'slug' => 'aron',
            'phone' => '02188889999',
            'address' => 'تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲۰',
            'opening_time' => '10:00',
            'closing_time' => '22:00',
            'slot_interval_minutes' => 30,
            'is_active' => true,
        ]);

        // 2. Create Owner User
        $owner = User::create([
            'salon_id' => $salon->id,
            'name' => 'مدیریت آرون',
            'phone' => '09120000000',
            'password' => Hash::make('password'),
            'role' => UserRole::OWNER,
        ]);

        // 3. Create Standard Services
        $serviceClassic = Service::create([
            'salon_id' => $salon->id,
            'title' => 'اصلاح کلاسیک',
            'duration_minutes' => 30,
            'price' => 250000,
            'show_price' => true,
            'is_active' => true,
        ]);

        $serviceBeard = Service::create([
            'salon_id' => $salon->id,
            'title' => 'طراحی ریش و فید',
            'duration_minutes' => 20,
            'price' => 150000,
            'show_price' => true,
            'is_active' => true,
        ]);

        $serviceVip = Service::create([
            'salon_id' => $salon->id,
            'title' => 'پکیج کامل VIP',
            'duration_minutes' => 60,
            'price' => 500000,
            'show_price' => false,
            'is_active' => true,
        ]);

        // 4. Create Mock Customers
        $customer1 = Customer::create([
            'salon_id' => $salon->id,
            'name' => 'علی محمدی',
            'phone' => '09123456789',
            'birth_date' => '1995-04-12',
            'notes' => 'مشتری قدیمی و خوش‌حساب؛ به عطر گرم علاقه دارد و معمولاً درخواست کوتاهی سایه با شماره ۱ دارد.',
        ]);

        $customer2 = Customer::create([
            'salon_id' => $salon->id,
            'name' => 'سهراب سپهری',
            'phone' => '09129876543',
            'birth_date' => '1998-08-25',
            'notes' => 'پوست صورت بسیار حساسی دارد؛ حتماً از فوم قبل اصلاح و افترشیو ضدالتهاب بدون الکل استفاده شود.',
        ]);

        // 5. Create Mock Appointments for Today (11:00, 14:00, 17:00)
        $today = Carbon::today();

        // Appointment 1: 11:00 (30 mins - Classic Haircut)
        Appointment::create([
            'salon_id' => $salon->id,
            'service_id' => $serviceClassic->id,
            'customer_id' => $customer1->id,
            'user_id' => $owner->id,
            'starts_at' => $today->copy()->setTime(11, 0, 0),
            'ends_at' => $today->copy()->setTime(11, 30, 0),
            'status' => AppointmentStatus::CONFIRMED,
            'barber_notes' => 'رزرو اولیه ثبت شده از پنل عمومی.',
        ]);

        // Appointment 2: 14:00 (20 mins - Beard Styling & Fade)
        Appointment::create([
            'salon_id' => $salon->id,
            'service_id' => $serviceBeard->id,
            'customer_id' => $customer2->id,
            'user_id' => $owner->id,
            'starts_at' => $today->copy()->setTime(14, 0, 0),
            'ends_at' => $today->copy()->setTime(14, 20, 0),
            'status' => AppointmentStatus::CONFIRMED,
            'barber_notes' => 'هماهنگ شده به صورت تلفنی جهت اصلاح سریع.',
        ]);

        // Appointment 3: 17:00 (60 mins - VIP Full Package)
        Appointment::create([
            'salon_id' => $salon->id,
            'service_id' => $serviceVip->id,
            'customer_id' => $customer1->id,
            'user_id' => $owner->id,
            'starts_at' => $today->copy()->setTime(17, 0, 0),
            'ends_at' => $today->copy()->setTime(18, 0, 0),
            'status' => AppointmentStatus::CONFIRMED,
            'barber_notes' => 'پکیج VIP شامل پذیرایی و ماسک صورت.',
        ]);
    }
}
