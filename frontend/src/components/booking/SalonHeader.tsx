import React from "react";
import { Salon } from "@/lib/api";
import { MapPin, Phone, Clock, Scissors } from "lucide-react";
import { toPersianDigits } from "@/lib/formatters";

interface SalonHeaderProps {
  salon: Salon;
}

export function SalonHeader({ salon }: SalonHeaderProps) {
  const openingDisplay = salon.opening_time
    ? toPersianDigits(salon.opening_time.slice(0, 5))
    : "۱۰:۰۰";
  const closingDisplay = salon.closing_time
    ? toPersianDigits(salon.closing_time.slice(0, 5))
    : "۲۲:۰۰";

  return (
    <header className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden mb-6">
      {/* Subtle decorative glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
            <Scissors className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {salon.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                پذیرش نوبت فعال
              </span>
            </div>

            {salon.address && (
              <p className="mt-1.5 text-sm text-slate-400 flex items-center gap-1.5 line-clamp-1">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{salon.address}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Clock className="w-4 h-4 text-amber-400/90" />
            <span>
              {openingDisplay} الی {closingDisplay}
            </span>
          </div>

          {salon.phone && (
            <a
              href={`tel:${salon.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-colors text-slate-300 hover:text-white"
            >
              <Phone className="w-4 h-4 text-slate-400" />
              <span dir="ltr">{toPersianDigits(salon.phone)}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
