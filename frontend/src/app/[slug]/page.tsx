"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  formatPrice,
  toPersianDigits,
  getNextDays,
  DayPill,
  formatAppointmentDateTime,
} from "@/lib/formatters";
import {
  Scissors,
  MapPin,
  Clock,
  Phone,
  Calendar,
  Check,
  ChevronRight,
  User,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function BookingContent({ params }: PageProps) {
  const { slug } = use(params);

  // Salon & Initial State
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Wizard Flow State: 1: Service, 2: Slot, 3: Customer Details
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Date & Slot Selection
  const days = useMemo(() => getNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState<string>(days[0]?.date || "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Customer Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

  // Form Validation
  const isPhoneValid = /^09\d{9}$/.test(customerPhone.trim());
  const isNameValid = customerName.trim().length >= 2;
  const isFormValid = isPhoneValid && isNameValid;

  // 1. Fetch Salon metadata
  useEffect(() => {
    let isMounted = true;
    async function loadSalon() {
      setIsLoadingInitial(true);
      setInitialError(null);
      try {
        const data = await fetchSalonBySlug(slug);
        if (isMounted) {
          setSalon(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات سالن";
          setInitialError(msg);
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

  // Handle final submission
  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedSlot || !isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const response = await createBooking(slug, {
        service_id: selectedService.id,
        starts_at: `${selectedDate} ${selectedSlot.starts_at}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        notes: customerNotes.trim() || undefined,
      });

      setBookingResult(response);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setBookingError("این زمان لحظاتی پیش رزرو شد؛ لطفاً ساعت دیگری را انتخاب نمایید.");
          // Reload slots
          if (selectedService) {
            setIsLoadingSlots(true);
            try {
              const reloaded = await fetchAvailableSlots(slug, selectedDate, selectedService.id);
              setSlots(reloaded);
            } finally {
              setIsLoadingSlots(false);
            }
          }
          setCurrentStep(2);
        } else {
          setBookingError(err.message);
        }
      } else {
        setBookingError("خطا در ثبت نوبت. لطفاً اتصال اینترنت خود را بررسی کنید.");
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

  // Progress percentage
  const progressWidth = currentStep === 1 ? "33.3%" : currentStep === 2 ? "66.6%" : "100%";

  // Initial Loading View
  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-pulse">
          <Scissors className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-slate-300">در حال آماده‌سازی سالن...</p>
      </div>
    );
  }

  // 404 / Error View
  if (initialError || !salon) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-rose-500/20 max-w-sm w-full space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">سالن مورد نظر یافت نشد</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            آدرس سالن نامعتبر است یا این سالن در حال حاضر غیرفعال می‌باشد.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            صفحه اصلی
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#E2E8F0] relative overflow-hidden font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Ambient background glows */}
      <div className="fixed top-0 right-0 w-80 h-80 bg-amber-500/[0.07] rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-10 left-0 w-80 h-80 bg-amber-600/[0.05] rounded-full blur-[100px] pointer-events-none" />

      {/* Slim 2px Apple-grade ambient progress bar at the very top */}
      <div className="fixed top-0 inset-x-0 h-[2px] bg-white/5 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
          initial={false}
          animate={{ width: progressWidth }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Mobile-First Native App Container */}
      <div className="max-w-md mx-auto min-h-screen px-4 pb-28 pt-4 flex flex-col">
        {/* Minimalist Salon Header */}
        <header className="mb-5 p-4 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev === 3 ? 2 : 1))}
                  className="w-10 h-10 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                  title="بازگشت به مرحله قبل"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/5 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Scissors className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">{salon.name}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    پذیرش فعال
                  </span>
                </div>

                {salon.address && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{salon.address}</span>
                  </p>
                )}
              </div>
            </div>

            {salon.phone && (
              <a
                href={`tel:${salon.phone}`}
                className="w-9 h-9 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-95 shrink-0"
                title="تماس با سالن"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </header>

        {/* Step Flow Transition */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {/* STEP 1: SERVICE SELECTION */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-sm font-bold text-white">انتخاب خدمت</h2>
                    <p className="text-[11px] text-slate-400">خدمت مورد نظر خود را انتخاب نمایید:</p>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    گام ۱ از ۳
                  </span>
                </div>

                <div className="space-y-2.5">
                  {salon.services.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <motion.div
                        key={service.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedService(service);
                          setSelectedSlot(null);
                        }}
                        className={`p-4 rounded-3xl cursor-pointer relative transition-all duration-200 border ${
                          isSelected
                            ? "bg-gradient-to-r from-amber-500/15 to-transparent border-amber-400/60 shadow-[0_0_24px_rgba(245,158,11,0.15)]"
                            : "bg-white/[0.03] hover:bg-white/[0.05] border-white/[0.07] hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-sm text-white">{service.title}</h3>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-amber-300 font-bold">
                                {formatPrice(service.price, service.show_price)}
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {toPersianDigits(service.duration_minutes)} دقیقه
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-amber-400 border-amber-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                : "border-white/15 bg-white/[0.03]"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME SLOT SELECTION */}
            {currentStep === 2 && selectedService && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-sm font-bold text-white">انتخاب تاریخ و ساعت</h2>
                    <p className="text-[11px] text-slate-400">
                      خدمت: <span className="text-amber-300">{selectedService.title}</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    گام ۲ از ۳
                  </span>
                </div>

                {/* Horizontal Snap-Scrolling Day Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x">
                  {days.map((day) => {
                    const isSelected = selectedDate === day.date;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day.date);
                          setSelectedSlot(null);
                        }}
                        className={`snap-start flex-shrink-0 flex flex-col items-center justify-center min-w-[76px] py-2.5 px-2 rounded-2xl cursor-pointer transition-all duration-200 border ${
                          isSelected
                            ? "bg-amber-400/20 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                            : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-300"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-medium mb-0.5 ${
                            isSelected ? "text-amber-400 font-bold" : "text-slate-400"
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span className="text-xs font-bold">{toPersianDigits(day.jalaliDate)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 3-Column Tactile Time Chips Grid */}
                <div className="p-4 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>زمان‌های در دسترس</span>
                    </span>
                    {!isLoadingSlots && (
                      <span className="text-[11px] text-slate-400">
                        {toPersianDigits(slots.filter((s) => s.available).length)} اسلات آزاد
                      </span>
                    )}
                  </div>

                  {isLoadingSlots ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-11 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <AlertCircle className="w-6 h-6 text-amber-400/80 mx-auto" />
                      <p className="text-xs font-medium text-slate-300">
                        نوبت آزادی در این روز موجود نیست.
                      </p>
                      <p className="text-[10px] text-slate-500">
                        لطفاً روزهای دیگر را بررسی فرمایید.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.starts_at === slot.starts_at;
                        const isAvailable = slot.available;

                        return (
                          <motion.button
                            key={slot.starts_at}
                            type="button"
                            disabled={!isAvailable}
                            whileTap={isAvailable ? { scale: 0.95 } : undefined}
                            onClick={() => isAvailable && setSelectedSlot(slot)}
                            className={`py-3 px-2 rounded-2xl text-center text-xs font-bold transition-all relative border ${
                              !isAvailable
                                ? "opacity-30 bg-white/[0.01] border-white/5 text-slate-500 cursor-not-allowed line-through pointer-events-none"
                                : isSelected
                                ? "bg-amber-400 border-amber-300 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.4)] scale-[1.02]"
                                : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-200 hover:border-white/20 cursor-pointer"
                            }`}
                          >
                            <span dir="ltr">{toPersianDigits(slot.starts_at)}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3: CUSTOMER DETAILS & CONFIRMATION */}
            {currentStep === 3 && selectedService && selectedSlot && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-sm font-bold text-white">اطلاعات نهایی و ثبت</h2>
                    <p className="text-[11px] text-slate-400">مشخصات خود را وارد نمایید:</p>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    گام ۳ از ۳
                  </span>
                </div>

                {/* Dark Metallic Ticket Summary Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-white/[0.05] to-amber-500/[0.03] border border-amber-500/20 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400">خدمت انتخابی</span>
                      <h4 className="text-sm font-bold text-white">{selectedService.title}</h4>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400">مبلغ نهایی</span>
                      <p className="text-xs font-bold text-amber-300">
                        {formatPrice(selectedService.price, selectedService.show_price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{formatAppointmentDateTime(selectedDate, selectedSlot.starts_at)}</span>
                  </div>
                </div>

                {/* Inline Error Banner */}
                {bookingError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p>{bookingError}</p>
                  </div>
                )}

                {/* Floating Glass Inputs */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 px-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>نام و نام خانوادگی</span>
                      <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: علی محمدی"
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.02] border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 text-white text-xs outline-none transition-all placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 px-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>شماره موبایل</span>
                      <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      required
                      maxLength={11}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="09123456789"
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.02] border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 text-white text-xs font-mono outline-none text-right transition-all placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400 px-1">
                      یادداشت برای آرایشگر (اختیاری)
                    </label>
                    <textarea
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="توضیحات کوتاه..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/10 focus:border-amber-500/50 text-white text-xs outline-none transition-all placeholder-slate-500 resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Sticky Bottom Bar (Sticky CTA) */}
      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto p-4 bg-[#090A0F]/85 backdrop-blur-2xl border-t border-white/[0.08] z-40">
        <div className="flex items-center justify-between gap-3">
          {/* Summary on Right (RTL right) */}
          <div className="space-y-0.5 truncate">
            {currentStep === 1 && (
              <>
                <p className="text-[10px] text-slate-400">خدمت انتخابی</p>
                <p className="text-xs font-bold text-white truncate">
                  {selectedService ? selectedService.title : "یک خدمت انتخاب کنید"}
                </p>
              </>
            )}
            {currentStep === 2 && (
              <>
                <p className="text-[10px] text-slate-400">زمان انتخاب شده</p>
                <p className="text-xs font-bold text-amber-300">
                  {selectedSlot ? toPersianDigits(selectedSlot.starts_at) : "ساعت را انتخاب کنید"}
                </p>
              </>
            )}
            {currentStep === 3 && selectedService && (
              <>
                <p className="text-[10px] text-slate-400">مبلغ قابل پرداخت</p>
                <p className="text-xs font-bold text-amber-300">
                  {formatPrice(selectedService.price, selectedService.show_price)}
                </p>
              </>
            )}
          </div>

          {/* Primary Action Button on Left (RTL left) */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={
              (currentStep === 1 && !selectedService) ||
              (currentStep === 2 && !selectedSlot) ||
              (currentStep === 3 && (!isFormValid || isSubmitting))
            }
            onClick={() => {
              if (currentStep === 1 && selectedService) setCurrentStep(2);
              else if (currentStep === 2 && selectedSlot) setCurrentStep(3);
              else if (currentStep === 3) handleBookingSubmit();
            }}
            className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              (currentStep === 1 && selectedService) ||
              (currentStep === 2 && selectedSlot) ||
              (currentStep === 3 && isFormValid && !isSubmitting)
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5 opacity-50"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>در حال ثبت...</span>
              </>
            ) : currentStep === 1 ? (
              <>
                <span>انتخاب زمان</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </>
            ) : currentStep === 2 ? (
              <>
                <span>تکمیل مشخصات</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>تأیید و ثبت نهایی</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Celebratory Confirmation Glass Sheet */}
      <AnimatePresence>
        {bookingResult?.appointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              className="max-w-md w-full rounded-3xl p-6 bg-[#0D0F17]/95 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h3 className="text-lg font-bold text-white">نوبت شما با موفقیت ثبت گردید</h3>
                <p className="text-xs text-slate-400">
                  اطلاعات رزرو با موفقیت در سیستم سالن {salon.name} ثبت شد.
                </p>
              </div>

              {/* Digital Ticket */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-slate-400">خدمت رزرو شده:</span>
                  <span className="font-bold text-white">{selectedService?.title}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-slate-400">زمان نوبت:</span>
                  <span className="font-bold text-amber-300">
                    {formatAppointmentDateTime(selectedDate, selectedSlot?.starts_at || "")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">مشتری:</span>
                  <span className="font-semibold text-white">{customerName}</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                {salon.phone && (
                  <a
                    href={`tel:${salon.phone}`}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-300 hover:text-white text-center text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>تماس با سالن</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-center text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>ثبت نوبت جدید</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SalonBookingPage({ params }: PageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-pulse">
            <Scissors className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-300">در حال بارگذاری سالن...</p>
        </div>
      }
    >
      <BookingContent params={params} />
    </React.Suspense>
  );
}
