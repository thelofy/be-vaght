import React from "react";
import { Appointment, Salon } from "@/lib/api";
import {
  formatAppointmentDateTime,
  formatPrice,
  toPersianDigits,
} from "@/lib/formatters";
import { Check, Calendar, Clock, MapPin, Phone, Scissors, PlusCircle } from "lucide-react";

interface SuccessModalProps {
  appointment: Appointment;
  salon: Salon;
  onReset: () => void;
}

export function SuccessModal({
  appointment,
  salon,
  onReset,
}: SuccessModalProps) {
  const timeFormatted = appointment.starts_at.slice(11, 16);
  const dateFormatted = appointment.starts_at.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-6 relative border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] bg-[#0D0F17]/95">
        {/* Success Header Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <h3 className="text-2xl font-bold text-white">
            نوبت شما با موفقیت ثبت شد!
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            اطلاعات نوبت برای شما ثبت گردید. لطفاً ۵ دقیقه قبل از زمان مقرر در سالن حضور داشته باشید.
          </p>
        </div>

        {/* Digital Ticket / Receipt Card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400">
                <Scissors className="w-4 h-4" />
              </div>
              <span className="font-bold text-white">{salon.name}</span>
            </div>
            <span className="text-xs text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              کد: #{appointment.id ? toPersianDigits(appointment.id) : "ثبت‌شده"}
            </span>
          </div>

          {/* Service & Time Info */}
          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="text-slate-400">خدمت:</span>
              <p className="font-semibold text-white">
                {appointment.service?.title || "خدمت آرایشگاه"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">مبلغ:</span>
              <p className="font-semibold text-amber-300">
                {formatPrice(
                  appointment.service?.price ?? null,
                  appointment.service?.show_price ?? true
                )}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">مشتری:</span>
              <p className="font-semibold text-white">
                {appointment.customer?.name || "مشتری گرامی"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">شماره تماس:</span>
              <p className="font-semibold text-white" dir="ltr">
                {appointment.customer?.phone
                  ? toPersianDigits(appointment.customer.phone)
                  : "-"}
              </p>
            </div>
          </div>

          {/* Time & Location highlight */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-sm text-amber-300 font-medium bg-amber-400/[0.06] p-2.5 rounded-xl border border-amber-400/15">
              <Calendar className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{formatAppointmentDateTime(dateFormatted, timeFormatted)}</span>
            </div>

            {salon.address && (
              <div className="flex items-start gap-2 text-xs text-slate-400 px-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
                <span className="line-clamp-2">{salon.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {salon.phone && (
            <a
              href={`tel:${salon.phone}`}
              className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-center text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-slate-400" />
              <span>تماس با سالن</span>
            </a>
          )}

          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-center text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>ثبت نوبت جدید</span>
          </button>
        </div>
      </div>
    </div>
  );
}
