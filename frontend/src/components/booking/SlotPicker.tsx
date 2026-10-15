import React from "react";
import { Service } from "@/lib/api";
import { DayPill, toPersianDigits } from "@/lib/formatters";
import { Clock, Calendar, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

interface SlotPickerProps {
  service: Service;
  days: DayPill[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  slots: string[];
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
  isLoadingSlots: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function SlotPicker({
  service,
  days,
  selectedDate,
  onSelectDate,
  slots,
  selectedSlot,
  onSelectSlot,
  isLoadingSlots,
  onBack,
  onNext,
}: SlotPickerProps) {
  return (
    <div className="space-y-6">
      {/* Service summary bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">خدمت انتخابی:</span>
          <span className="text-white font-semibold">{service.title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
          <Clock className="w-3.5 h-3.5" />
          <span>{toPersianDigits(service.duration_minutes)} دقیقه</span>
        </div>
      </div>

      {/* Date selector (Horizontal scroll pills) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>انتخاب روز:</span>
          </h3>
          <span className="text-xs text-slate-400">۷ روز آینده</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {days.map((day) => {
            const isSelected = selectedDate === day.date;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[85px] sm:min-w-[95px] py-3 px-3 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)] border"
                    : "glass-panel-interactive text-slate-300 hover:text-white"
                }`}
              >
                <span
                  className={`text-xs font-medium mb-1 ${
                    isSelected ? "text-amber-400" : "text-slate-400"
                  }`}
                >
                  {day.dayName}
                </span>
                <span className="text-sm sm:text-base font-bold">
                  {toPersianDigits(day.jalaliDate)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>ساعت نوبت:</span>
          </h3>
          <span className="text-xs text-slate-400">
            {slots.length > 0 && !isLoadingSlots
              ? `${toPersianDigits(slots.length)} زمان آزاد`
              : ""}
          </span>
        </div>

        {isLoadingSlots ? (
          /* Glass Skeleton Loader */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-400/80 mx-auto" />
            <p className="text-sm font-medium text-slate-200">
              هیچ نوبت آزادی در این تاریخ یافت نشد.
            </p>
            <p className="text-xs text-slate-400">
              لطفاً تاریخ‌های دیگر را برای رزرو بررسی فرمایید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot;

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`py-3 px-2 rounded-xl text-center text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-bold scale-[1.02]"
                      : "glass-panel-interactive text-slate-200 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span dir="ltr">{toPersianDigits(slot)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white glass-panel-interactive"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تغییر خدمت</span>
        </button>

        <button
          type="button"
          disabled={!selectedSlot}
          onClick={onNext}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all ${
            selectedSlot
              ? "bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
              : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
          }`}
        >
          <span>مرحله بعد: ثبت مشخصات</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
