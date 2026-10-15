import React from "react";
import { Service } from "@/lib/api";
import { Clock, Check, ArrowLeft } from "lucide-react";
import { formatPrice, toPersianDigits } from "@/lib/formatters";

interface ServiceSelectionProps {
  services: Service[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
  onNext: () => void;
}

export function ServiceSelection({
  services,
  selectedService,
  onSelectService,
  onNext,
}: ServiceSelectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">انتخاب خدمت</h2>
        <p className="text-sm text-slate-400 mt-1">
          لطفاً خدمت مورد نظرتان را برای رزرو نوبت انتخاب کنید:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {services.map((service) => {
          const isSelected = selectedService?.id === service.id;

          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`p-5 rounded-2xl cursor-pointer relative flex flex-col justify-between min-h-[120px] transition-all ${
                isSelected
                  ? "glass-panel-active border-amber-500/50"
                  : "glass-panel-interactive hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-base text-white">
                    {service.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{toPersianDigits(service.duration_minutes)} دقیقه</span>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                    isSelected
                      ? "bg-amber-400 border-amber-400 text-slate-950"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">هزینه:</span>
                <span
                  className={`text-sm font-semibold ${
                    service.show_price && service.price
                      ? "text-amber-300"
                      : "text-slate-300"
                  }`}
                >
                  {formatPrice(service.price, service.show_price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!selectedService}
          onClick={onNext}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all ${
            selectedService
              ? "bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
              : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
          }`}
        >
          <span>مرحله بعد: انتخاب زمان</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
