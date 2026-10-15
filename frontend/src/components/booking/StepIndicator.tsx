import React from "react";
import { Check } from "lucide-react";
import { toPersianDigits } from "@/lib/formatters";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  maxAccessibleStep: 1 | 2 | 3;
}

export function StepIndicator({
  currentStep,
  onStepClick,
  maxAccessibleStep,
}: StepIndicatorProps) {
  const steps = [
    { number: 1 as const, title: "انتخاب خدمت" },
    { number: 2 as const, title: "زمان نوبت" },
    { number: 3 as const, title: "تأیید و مشخصات" },
  ];

  return (
    <div className="glass-panel rounded-2xl p-3 sm:p-4 mb-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isAccessible = step.number <= maxAccessibleStep;

          return (
            <button
              key={step.number}
              type="button"
              disabled={!isAccessible}
              onClick={() => isAccessible && onStepClick?.(step.number)}
              className={`flex items-center justify-center gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isCurrent
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : isCompleted
                  ? "text-slate-300 hover:text-white bg-white/[0.02] border border-white/5 cursor-pointer"
                  : "text-slate-600 bg-transparent cursor-not-allowed opacity-50"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isCurrent
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : toPersianDigits(step.number)}
              </span>
              <span className="truncate">{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
