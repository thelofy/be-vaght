"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  fetchSalonBySlug,
  fetchAvailableSlots,
  createBooking,
  Salon,
  Service,
  Slot,
  BookingResponse,
  ApiError,
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
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Booking Flow State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Dates & Slots
  const days = useMemo(() => getNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState<string>(days[0]?.date || "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Submission & Conflict State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

  // 1. Fetch Salon metadata on initial load
  useEffect(() => {
    let isMounted = true;

    async function loadSalon() {
      setIsLoadingInitial(true);
      setInitialError(null);

      try {
        const salonData = await fetchSalonBySlug(slug);
        if (isMounted) {
          setSalon(salonData);
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

  // 2. Fetch available slots ONLY when Service ID or Date changes
  useEffect(() => {
    if (!selectedService?.id || !selectedDate) return;

    let isMounted = true;

    async function loadSlots() {
      setIsLoadingSlots(true);

      try {
        const availableSlots = await fetchAvailableSlots(
          slug,
          selectedDate,
          selectedService!.id
        );
        if (isMounted) {
          setSlots(availableSlots);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setSlots([]);
          if (err instanceof ApiError && err.isRateLimited) {
            setBookingError(err.message);
          }
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
  }, [slug, selectedService?.id, selectedDate]);

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
      const response = await createBooking(slug, {
        service_id: selectedService.id,
        starts_at: `${selectedDate} ${selectedSlot.starts_at}`,
        customer_name: customerData.customer_name,
        customer_phone: customerData.customer_phone,
        notes: customerData.notes,
      });

      setBookingResult(response);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
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
          setBookingError(err.message);
        }
      } else {
        setBookingError("متأسفانه مشکلی در ثبت نوبت رخ داد. لطفاً مجدداً تلاش فرمایید.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBookingResult(null);
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedSlot(null);
    setBookingError(null);
  };

  // Full Skeleton Loader for Initial Fetch
  if (isLoadingInitial) {
    return (
      <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-48 bg-white/10 rounded-md" />
                <div className="h-4 w-72 bg-white/5 rounded-md" />
              </div>
            </div>
          </div>

          {/* Step Indicator Skeleton */}
          <div className="glass-panel rounded-2xl p-4 animate-pulse">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-9 bg-white/10 rounded-xl" />
              <div className="h-9 bg-white/5 rounded-xl" />
              <div className="h-9 bg-white/5 rounded-xl" />
            </div>
          </div>

          {/* Body Skeleton */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 animate-pulse">
            <div className="h-6 w-36 bg-white/10 rounded-md mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="h-32 bg-white/5 rounded-2xl" />
              <div className="h-32 bg-white/5 rounded-2xl" />
              <div className="h-32 bg-white/5 rounded-2xl" />
              <div className="h-32 bg-white/5 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>در حال دریافت اطلاعات سالن...</span>
        </div>
      </main>
    );
  }

  // Clean 404 / Error Screen
  if (initialError || !salon) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl flex flex-col items-center gap-4 max-w-md w-full border-rose-500/20 bg-rose-500/[0.02]">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">سالن مورد نظر یافت نشد</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            آدرس سالن نامعتبر است یا این سالن در سامانه غیرفعال می‌باشد.
          </p>
          <a
            href="/"
            className="mt-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors cursor-pointer"
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
        {/* Salon Branding Header with glowing metallic glass */}
        <SalonHeader salon={salon} />

        {/* 3-Step Wizard Indicator */}
        <StepIndicator
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
          maxAccessibleStep={maxAccessibleStep}
        />

        {/* Dynamic Wizard Step Content */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 relative min-h-[300px]">
          {currentStep === 1 && (
            <ServiceSelection
              services={salon.services}
              selectedService={selectedService}
              onSelectService={(s) => {
                setSelectedService(s);
                setSelectedSlot(null);
              }}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            selectedService ? (
              <SlotPicker
                service={selectedService}
                days={days}
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
                slots={slots}
                selectedSlot={selectedSlot}
                onSelectSlot={(s) => setSelectedSlot(s)}
                isLoadingSlots={isLoadingSlots}
                onBack={() => setCurrentStep(1)}
                onNext={() => setCurrentStep(3)}
              />
            ) : (
              <div className="text-center py-10 space-y-4">
                <p className="text-sm text-slate-400">لطفاً ابتدا یک خدمت را انتخاب فرمایید.</p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm"
                >
                  بازگشت به انتخاب خدمت
                </button>
              </div>
            )
          )}

          {currentStep === 3 && (
            selectedService && selectedSlot ? (
              <CustomerForm
                service={selectedService}
                date={selectedDate}
                slot={selectedSlot}
                onSubmit={handleBookingSubmit}
                onBack={() => setCurrentStep(2)}
                isSubmitting={isSubmitting}
                errorMessage={bookingError}
              />
            ) : (
              <div className="text-center py-10 space-y-4">
                <p className="text-sm text-slate-400">
                  لطفاً ابتدا خدمت و ساعت مورد نظر خود را انتخاب فرمایید.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(selectedService ? 2 : 1)}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm"
                >
                  بازگشت و انتخاب ساعت
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Success Celebration Receipt Modal */}
      {bookingResult?.appointment && (
        <SuccessModal
          appointment={bookingResult.appointment}
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
