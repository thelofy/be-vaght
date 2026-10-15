"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  fetchSalon,
  fetchAvailableSlots,
  submitBooking,
  Salon,
  Service,
  Appointment,
} from "@/lib/api";
import { getNextDays } from "@/lib/formatters";
import { SalonHeader } from "./SalonHeader";
import { StepIndicator } from "./StepIndicator";
import { ServiceSelection } from "./ServiceSelection";
import { SlotPicker } from "./SlotPicker";
import { CustomerForm } from "./CustomerForm";
import { SuccessModal } from "./SuccessModal";
import { Scissors, AlertCircle, Loader2 } from "lucide-react";

interface BookingClientProps {
  slug: string;
}

export function BookingClient({ slug }: BookingClientProps) {
  // Page level state
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Booking Flow State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Dates & Slots
  const days = useMemo(() => getNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState<string>(days[0]?.date || "");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Submission & Conflict State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [completedAppointment, setCompletedAppointment] = useState<Appointment | null>(null);

  // 1. Fetch Salon metadata on initial load
  useEffect(() => {
    let isMounted = true;

    async function loadSalon() {
      setIsLoadingInitial(true);
      setInitialError(null);

      try {
        const data = await fetchSalon(slug);
        if (isMounted) {
          setSalon(data.salon);
          setServices(data.services);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات سالن";
          setInitialError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    }

    loadSalon();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // 2. Fetch available slots when Service or Date changes
  useEffect(() => {
    if (!selectedService || !selectedDate || currentStep < 2) return;

    let isMounted = true;

    async function loadSlots() {
      setIsLoadingSlots(true);
      setSelectedSlot(null); // Reset selection on change

      try {
        const availableSlots = await fetchAvailableSlots(
          slug,
          selectedDate,
          selectedService!.id
        );
        if (isMounted) {
          setSlots(availableSlots);
        }
      } catch {
        if (isMounted) {
          setSlots([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [slug, selectedService, selectedDate, currentStep]);

  // Step access control
  const maxAccessibleStep: 1 | 2 | 3 = useMemo(() => {
    if (!selectedService) return 1;
    if (!selectedSlot) return 2;
    return 3;
  }, [selectedService, selectedSlot]);

  // Handle Booking submission
  const handleBookingSubmit = async (customerData: {
    customer_name: string;
    customer_phone: string;
    customer_birth_date?: string;
    notes?: string;
  }) => {
    if (!selectedService || !selectedSlot) return;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const appointment = await submitBooking(slug, {
        service_id: selectedService.id,
        date: selectedDate,
        start_time: selectedSlot,
        customer_name: customerData.customer_name,
        customer_phone: customerData.customer_phone,
        customer_birth_date: customerData.customer_birth_date,
        notes: customerData.notes,
      });

      setCompletedAppointment(appointment);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      if (errorObj?.status === 409) {
        setBookingError("این زمان لحظاتی پیش رزرو شد، لطفاً زمان دیگری انتخاب کنید.");
        // Reload slots to reflect newly occupied slot
        if (selectedService) {
          setIsLoadingSlots(true);
          try {
            const reloadedSlots = await fetchAvailableSlots(
              slug,
              selectedDate,
              selectedService.id
            );
            setSlots(reloadedSlots);
          } finally {
            setIsLoadingSlots(false);
          }
        }
        setCurrentStep(2);
      } else {
        setBookingError(
          errorObj?.message || "متأسفانه مشکلی در ثبت نوبت رخ داد. لطفاً مجدداً تلاش فرمایید."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCompletedAppointment(null);
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedSlot(null);
    setBookingError(null);
  };

  // Loading Screen
  if (isLoadingInitial) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-4 max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
            <Scissors className="w-7 h-7 animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <p className="text-sm text-slate-300 font-medium">در حال دریافت اطلاعات سالن...</p>
        </div>
      </main>
    );
  }

  // 404 / Error Screen
  if (initialError || !salon) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl flex flex-col items-center gap-4 max-w-md w-full border-rose-500/20 bg-rose-500/[0.02]">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">سالن مورد نظر یافت نشد</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            آدرس وارد شده معتبر نیست یا ممکن است این سالن در حال حاضر غیرفعال باشد.
          </p>
          <a
            href="/"
            className="mt-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors"
          >
            بازگشت به صفحه اصلی
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col justify-between">
      <div>
        {/* Salon Branding Header */}
        <SalonHeader salon={salon} />

        {/* 3-Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
          maxAccessibleStep={maxAccessibleStep}
        />

        {/* Dynamic Step Content */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 relative">
          {currentStep === 1 && (
            <ServiceSelection
              services={services}
              selectedService={selectedService}
              onSelectService={(s) => setSelectedService(s)}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && selectedService && (
            <SlotPicker
              service={selectedService}
              days={days}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={(s) => setSelectedSlot(s)}
              isLoadingSlots={isLoadingSlots}
              onBack={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && selectedService && selectedSlot && (
            <CustomerForm
              service={selectedService}
              date={selectedDate}
              slot={selectedSlot}
              onSubmit={handleBookingSubmit}
              onBack={() => setCurrentStep(2)}
              isSubmitting={isSubmitting}
              errorMessage={bookingError}
            />
          )}
        </div>
      </div>

      {/* Success Receipt Modal */}
      {completedAppointment && (
        <SuccessModal
          appointment={completedAppointment}
          salon={salon}
          onReset={handleReset}
        />
      )}

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-xs text-slate-500 py-4">
        <span>قدرت گرفته از سامانه رزرو آنلاین </span>
        <span className="text-amber-400 font-bold">به وقت (BeVaght)</span>
      </footer>
    </main>
  );
}
