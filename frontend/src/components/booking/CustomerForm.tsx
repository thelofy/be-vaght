import React, { useState } from "react";
import { Service, Slot } from "@/lib/api";
import {
  formatAppointmentDateTime,
  formatPrice,
  toPersianDigits,
} from "@/lib/formatters";
import {
  User,
  Phone,
  Calendar,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

interface CustomerFormProps {
  service: Service;
  date: string;
  slot: Slot;
  onSubmit: (data: {
    customer_name: string;
    customer_phone: string;
    customer_birth_date?: string;
    notes?: string;
  }) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function CustomerForm({
  service,
  date,
  slot,
  onSubmit,
  onBack,
  isSubmitting,
  errorMessage,
}: CustomerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
  });

  // Validation: phone must be 11 digits starting with 09
  const isPhoneValid = /^09\d{9}$/.test(phone.trim());
  const isNameValid = name.trim().length >= 2;
  const isFormValid = isPhoneValid && isNameValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    await onSubmit({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_birth_date: birthDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Summary Card with glowing metallic highlight */}
      <div className="glass-panel p-5 rounded-2xl space-y-3.5 border-amber-500/25 bg-amber-500/[0.03] shadow-[0_4px_24px_rgba(245,158,11,0.08)]">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 font-medium">خدمت انتخاب شده:</span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{service.title}</span>
              <span className="text-xs font-normal text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                {toPersianDigits(service.duration_minutes)} دقیقه
              </span>
            </h4>
          </div>
          <div className="text-left">
            <span className="text-xs text-slate-400 font-medium">هزینه نهایی:</span>
            <p className="text-sm sm:text-base font-bold text-amber-300">
              {formatPrice(service.price, service.show_price)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatAppointmentDateTime(date, slot.starts_at)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              پایان حدودی: <span dir="ltr">{toPersianDigits(slot.ends_at)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Glass Styled Error Toast / Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex items-start gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-white">خطا در فرآیند رزرو</p>
            <p className="text-xs text-rose-300/90 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>نام و نام خانوادگی</span>
            <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, name: true }))}
            placeholder="مثال: علی رضایی"
            className={`w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 ${
              touched.name && !isNameValid
                ? "border-rose-500/60 focus:border-rose-400 bg-rose-500/[0.02]"
                : "border-white/10 focus:border-amber-400/80 focus:bg-white/[0.06] focus:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            }`}
          />
          {touched.name && !isNameValid && (
            <p className="text-xs text-rose-400">نام باید حداقل ۲ حرف باشد.</p>
          )}
        </div>

        {/* Mobile Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>شماره موبایل (جهت تأیید و ارسال پیامک نوبت)</span>
            <span className="text-amber-400">*</span>
          </label>
          <input
            type="tel"
            required
            dir="ltr"
            value={phone}
            maxLength={11}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
            placeholder="09123456789"
            className={`w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border text-white placeholder-slate-500 text-sm font-mono outline-none text-right transition-all duration-200 ${
              touched.phone && !isPhoneValid
                ? "border-rose-500/60 focus:border-rose-400 bg-rose-500/[0.02]"
                : "border-white/10 focus:border-amber-400/80 focus:bg-white/[0.06] focus:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            }`}
          />
          {touched.phone && !isPhoneValid && (
            <p className="text-xs text-rose-400">
              شماره موبایل ۱۱ رقمی معتبر وارد نمایید (مثال: 09121234567).
            </p>
          )}
        </div>

        {/* Optional Birth Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>تاریخ تولد (اختیاری - جهت دریافت هدایا و تخفیفات مناسبتی)</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400/80 focus:bg-white/[0.06] transition-all"
          />
        </div>

        {/* Optional Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>توضیحات اختیاری برای آرایشگر</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: ترجیحاً اصلاح دور مو با شماره ۱ انجام شود..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400/80 focus:bg-white/[0.06] transition-all resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white glass-panel-interactive cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تغییر ساعت</span>
        </button>

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm transition-all duration-200 ${
            isFormValid && !isSubmitting
              ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] active:scale-[0.98]"
              : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>در حال ارسال اطلاعات...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>تأیید و ثبت نهایی رزرو</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
