import React, { useState } from "react";
import { Service } from "@/lib/api";
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
} from "lucide-react";

interface CustomerFormProps {
  service: Service;
  date: string;
  slot: string;
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
      {/* Appointment Summary Card */}
      <div className="glass-panel p-5 rounded-2xl space-y-3 border-amber-500/20 bg-amber-500/[0.03]">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400">خدمت درخواستی</span>
            <h4 className="text-base font-bold text-white">{service.title}</h4>
          </div>
          <div className="text-left">
            <span className="text-xs text-slate-400">مبلغ</span>
            <p className="text-sm font-semibold text-amber-300">
              {formatPrice(service.price, service.show_price)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{formatAppointmentDateTime(date, slot)}</span>
          <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md mr-auto">
            مدت: {toPersianDigits(service.duration_minutes)} دقیقه
          </span>
        </div>
      </div>

      {/* Error alert if present */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">خطا در ثبت نوبت</p>
            <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
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
            placeholder="مثال: آرش سپهری"
            className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-slate-500 text-sm outline-none transition-all ${
              touched.name && !isNameValid
                ? "border-rose-500/50 focus:border-rose-400"
                : "border-white/10 focus:border-amber-400/80 focus:bg-white/[0.06]"
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
            <span>شماره موبایل (جهت ارسال پیامک و هماهنگی)</span>
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
            className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-slate-500 text-sm font-mono outline-none text-right transition-all ${
              touched.phone && !isPhoneValid
                ? "border-rose-500/50 focus:border-rose-400"
                : "border-white/10 focus:border-amber-400/80 focus:bg-white/[0.06]"
            }`}
          />
          {touched.phone && !isPhoneValid && (
            <p className="text-xs text-rose-400">
              شماره موبایل معتبر ۱۱ رقمی وارد نمایید (مثال: 09121234567).
            </p>
          )}
        </div>

        {/* Optional Birth Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>تاریخ تولد (اختیاری - جهت دریافت تخفیف‌های مناسبتی)</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400/80 focus:bg-white/[0.06] transition-all"
          />
        </div>

        {/* Optional Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>توضیحات یا یادداشت برای آرایشگر (اختیاری)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: ترجیحاً اصلاح دور مو سفید نشود..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-amber-400/80 focus:bg-white/[0.06] transition-all resize-none"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white glass-panel-interactive"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تغییر ساعت</span>
        </button>

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all ${
            isFormValid && !isSubmitting
              ? "bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-[0.98]"
              : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>در حال ثبت نوبت...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>تأیید و ثبت نوبت</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
