<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Salon;
use App\Models\Service;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class SlotAvailabilityService
{
    /**
     * Generate available time slots for a specific salon, service, and date.
     *
     * @return list<string>
     */
    public function getAvailableSlots(
        Salon $salon,
        Service $service,
        CarbonInterface|string $date,
        ?int $userId = null
    ): array {
        $targetDate = $date instanceof CarbonInterface ? $date->copy()->startOfDay() : Carbon::parse($date)->startOfDay();

        $opening = Carbon::parse($salon->opening_time);
        $closing = Carbon::parse($salon->closing_time);

        $salonStart = $targetDate->copy()->setTime($opening->hour, $opening->minute, $opening->second);
        $salonEnd = $targetDate->copy()->setTime($closing->hour, $closing->minute, $closing->second);

        $stepMinutes = $salon->slot_interval_minutes > 0 ? (int) $salon->slot_interval_minutes : 30;
        $serviceDuration = $service->duration_minutes > 0 ? (int) $service->duration_minutes : 30;

        $appointmentsQuery = Appointment::query()
            ->where('salon_id', $salon->id)
            ->where('status', '!=', AppointmentStatus::CANCELLED)
            ->whereDate('starts_at', $targetDate->toDateString());

        if ($userId !== null) {
            $appointmentsQuery->where(function ($q) use ($userId) {
                $q->whereNull('user_id')->orWhere('user_id', $userId);
            });
        }

        $existingAppointments = $appointmentsQuery->get(['starts_at', 'ends_at']);

        $availableSlots = [];
        $currentSlot = $salonStart->copy();
        $now = Carbon::now();

        while ($currentSlot->copy()->addMinutes($serviceDuration)->lte($salonEnd)) {
            $slotStart = $currentSlot->copy();
            $slotEnd = $slotStart->copy()->addMinutes($serviceDuration);

            // Skip past slots for today
            if ($targetDate->isToday() && $slotStart->lte($now)) {
                $currentSlot->addMinutes($stepMinutes);
                continue;
            }

            // Check collision: slotStart < appointment.ends_at && slotEnd > appointment.starts_at
            $hasCollision = $existingAppointments->contains(function (Appointment $appointment) use ($slotStart, $slotEnd) {
                return $slotStart->lt($appointment->ends_at) && $slotEnd->gt($appointment->starts_at);
            });

            if (! $hasCollision) {
                $availableSlots[] = $slotStart->format('H:i');
            }

            $currentSlot->addMinutes($stepMinutes);
        }

        return $availableSlots;
    }

    /**
     * Check if a proposed interval has any conflicting booking.
     */
    public function hasCollision(
        Salon $salon,
        CarbonInterface $startsAt,
        CarbonInterface $endsAt,
        ?int $userId = null,
        bool $lockForUpdate = false
    ): bool {
        $query = Appointment::query()
            ->where('salon_id', $salon->id)
            ->where('status', '!=', AppointmentStatus::CANCELLED)
            ->where(function ($q) use ($startsAt, $endsAt) {
                $q->where('starts_at', '<', $endsAt)
                    ->where('ends_at', '>', $startsAt);
            });

        if ($userId !== null) {
            $query->where(function ($q) use ($userId) {
                $q->whereNull('user_id')->orWhere('user_id', $userId);
            });
        }

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->exists();
    }
}
