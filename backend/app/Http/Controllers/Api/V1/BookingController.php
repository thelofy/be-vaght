<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBookingRequest;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Salon;
use App\Models\Service;
use App\Services\SlotAvailabilityService;
use Carbon\Carbon;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function __construct(
        protected SlotAvailabilityService $slotService
    ) {}

    /**
     * Get salon details and its active services.
     */
    public function show(string $slug): JsonResponse
    {
        $salon = Salon::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $salon) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Salon not found or inactive.',
            ], 404);
        }

        $services = $salon->services()
            ->where('is_active', true)
            ->get()
            ->map(function (Service $service) {
                return [
                    'id' => $service->id,
                    'title' => $service->title,
                    'duration_minutes' => $service->duration_minutes,
                    'price' => $service->show_price ? $service->price : null,
                    'show_price' => $service->show_price,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'salon' => [
                    'id' => $salon->id,
                    'name' => $salon->name,
                    'slug' => $salon->slug,
                    'phone' => $salon->phone,
                    'address' => $salon->address,
                    'opening_time' => $salon->opening_time,
                    'closing_time' => $salon->closing_time,
                    'slot_interval_minutes' => $salon->slot_interval_minutes,
                ],
                'services' => $services,
            ],
            'message' => 'Salon details retrieved successfully.',
        ]);
    }

    /**
     * Return available slots for a given date and service.
     */
    public function slots(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'service_id' => ['required', 'integer'],
            'user_id' => ['nullable', 'integer'],
        ]);

        $salon = Salon::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $salon) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Salon not found.',
            ], 404);
        }

        $service = $salon->services()
            ->where('id', $request->input('service_id'))
            ->where('is_active', true)
            ->first();

        if (! $service) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Service not found or inactive for this salon.',
            ], 404);
        }

        $userId = $request->filled('user_id') ? (int) $request->input('user_id') : null;

        $availableSlots = $this->slotService->getAvailableSlots(
            salon: $salon,
            service: $service,
            date: (string) $request->input('date'),
            userId: $userId
        );

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $request->input('date'),
                'service_id' => $service->id,
                'duration_minutes' => $service->duration_minutes,
                'slots' => $availableSlots,
            ],
            'message' => 'Available slots retrieved successfully.',
        ]);
    }

    /**
     * Book an appointment with transaction and lock protection.
     */
    public function book(StoreBookingRequest $request, string $slug): JsonResponse
    {
        $salon = Salon::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $salon) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Salon not found.',
            ], 404);
        }

        $validated = $request->validated();
        $service = $salon->services()->findOrFail($validated['service_id']);

        $startsAt = Carbon::createFromFormat('Y-m-d H:i', "{$validated['date']} {$validated['start_time']}");
        $endsAt = $startsAt->copy()->addMinutes($service->duration_minutes);

        // Verify slot is strictly within salon opening and closing hours
        $opening = Carbon::parse($salon->opening_time);
        $closing = Carbon::parse($salon->closing_time);
        $salonOpen = $startsAt->copy()->setTime($opening->hour, $opening->minute, $opening->second);
        $salonClose = $startsAt->copy()->setTime($closing->hour, $closing->minute, $closing->second);

        if ($startsAt->lt($salonOpen) || $endsAt->gt($salonClose)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'The requested appointment is outside salon operating hours.',
            ], 422);
        }

        if ($startsAt->isPast()) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Cannot book appointments in the past.',
            ], 422);
        }

        $userId = ! empty($validated['user_id']) ? (int) $validated['user_id'] : null;

        try {
            $appointment = DB::transaction(function () use ($salon, $service, $startsAt, $endsAt, $userId, $validated) {
                // Check collision under transaction lock to prevent race condition double bookings
                $hasCollision = $this->slotService->hasCollision(
                    salon: $salon,
                    startsAt: $startsAt,
                    endsAt: $endsAt,
                    userId: $userId,
                    lockForUpdate: true
                );

                if ($hasCollision) {
                    throw new DomainException('The selected slot is no longer available.');
                }

                // Upsert customer (phone is unique per salon)
                $customer = Customer::updateOrCreate(
                    [
                        'salon_id' => $salon->id,
                        'phone' => $validated['customer_phone'],
                    ],
                    [
                        'name' => $validated['customer_name'],
                        'birth_date' => $validated['customer_birth_date'] ?? null,
                    ]
                );

                // Create confirmed appointment
                return Appointment::create([
                    'salon_id' => $salon->id,
                    'service_id' => $service->id,
                    'customer_id' => $customer->id,
                    'user_id' => $userId,
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                    'status' => AppointmentStatus::CONFIRMED,
                    'barber_notes' => $validated['notes'] ?? null,
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $appointment->load([
                    'service:id,title,duration_minutes,price,show_price',
                    'customer:id,name,phone',
                ]),
                'message' => 'Appointment booked successfully.',
            ], 201);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => $e->getMessage(),
            ], 409);
        }
    }
}
