<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Salon;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    protected Salon $salon;
    protected Service $classicService;
    protected Service $vipService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->salon = Salon::create([
            'name' => 'سالن آرون',
            'slug' => 'aron',
            'phone' => '02188889999',
            'address' => 'تهران، ولیعصر',
            'opening_time' => '10:00',
            'closing_time' => '22:00',
            'slot_interval_minutes' => 30,
            'is_active' => true,
        ]);

        $this->classicService = Service::create([
            'salon_id' => $this->salon->id,
            'title' => 'اصلاح کلاسیک',
            'duration_minutes' => 30,
            'price' => 250000,
            'show_price' => true,
            'is_active' => true,
        ]);

        $this->vipService = Service::create([
            'salon_id' => $this->salon->id,
            'title' => 'پکیج کامل VIP',
            'duration_minutes' => 60,
            'price' => 500000,
            'show_price' => false,
            'is_active' => true,
        ]);
    }

    public function test_can_retrieve_salon_and_services_with_hidden_prices(): void
    {
        $response = $this->getJson('/api/v1/salons/aron');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'salon' => [
                        'name' => 'سالن آرون',
                        'slug' => 'aron',
                    ],
                ],
                'message' => 'Salon details retrieved successfully.',
            ]);

        $services = $response->json('data.services');
        $this->assertCount(2, $services);

        $classic = collect($services)->firstWhere('title', 'اصلاح کلاسیک');
        $this->assertEquals(250000, $classic['price']);

        $vip = collect($services)->firstWhere('title', 'پکیج کامل VIP');
        $this->assertNull($vip['price']);
    }

    public function test_can_get_available_slots_excluding_booked_slots(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $customer = \App\Models\Customer::create([
            'salon_id' => $this->salon->id,
            'name' => 'تست مشتری',
            'phone' => '09121110000',
        ]);

        // Create an appointment at 11:00 to 11:30 tomorrow
        Appointment::create([
            'salon_id' => $this->salon->id,
            'service_id' => $this->classicService->id,
            'customer_id' => $customer->id,
            'starts_at' => Carbon::parse("$tomorrow 11:00"),
            'ends_at' => Carbon::parse("$tomorrow 11:30"),
            'status' => AppointmentStatus::CONFIRMED,
        ]);

        $response = $this->getJson("/api/v1/salons/aron/slots?date={$tomorrow}&service_id={$this->classicService->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $slots = $response->json('data.slots');

        $this->assertContains('10:00', $slots);
        $this->assertContains('10:30', $slots);
        // 11:00 must NOT be available because it is booked
        $this->assertNotContains('11:00', $slots);
        $this->assertContains('11:30', $slots);
    }

    public function test_can_successfully_book_appointment(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $payload = [
            'service_id' => $this->classicService->id,
            'date' => $tomorrow,
            'start_time' => '12:00',
            'customer_name' => 'محمد رضایی',
            'customer_phone' => '09121234567',
            'notes' => 'نوبت آنلاین اول',
        ];

        $response = $this->postJson('/api/v1/salons/aron/book', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'confirmed',
                    'customer' => [
                        'name' => 'محمد رضایی',
                        'phone' => '09121234567',
                    ],
                ],
                'message' => 'Appointment booked successfully.',
            ]);

        $this->assertDatabaseHas('customers', [
            'salon_id' => $this->salon->id,
            'phone' => '09121234567',
            'name' => 'محمد رضایی',
        ]);

        $this->assertDatabaseHas('appointments', [
            'salon_id' => $this->salon->id,
            'service_id' => $this->classicService->id,
            'status' => 'confirmed',
        ]);
    }

    public function test_prevents_double_booking_on_same_slot(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $payload = [
            'service_id' => $this->classicService->id,
            'date' => $tomorrow,
            'start_time' => '15:00',
            'customer_name' => 'کاربر اول',
            'customer_phone' => '09121112233',
        ];

        // First booking succeeds
        $firstResponse = $this->postJson('/api/v1/salons/aron/book', $payload);
        $firstResponse->assertStatus(201);

        // Second booking for same slot should be rejected
        $duplicatePayload = [
            'service_id' => $this->classicService->id,
            'date' => $tomorrow,
            'start_time' => '15:00',
            'customer_name' => 'کاربر دوم',
            'customer_phone' => '09129998877',
        ];

        $secondResponse = $this->postJson('/api/v1/salons/aron/book', $duplicatePayload);
        $secondResponse->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'The selected slot is no longer available.',
            ]);
    }
}
