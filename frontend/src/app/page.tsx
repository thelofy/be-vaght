import Link from "next/link";
import { Scissors, ArrowLeft, ShieldCheck, Sparkles, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel p-8 sm:p-12 rounded-3xl max-w-lg w-full space-y-6 relative z-10 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <Scissors className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-amber-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>سامانه رزرو سریع نوبت آرایشگاه</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            به وقت <span className="text-amber-400">BeVaght</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            رزرو آنلاین و بدون معطلی نوبت در برترین سالن‌های پیرایش و مراقبت آقایان
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/aron"
            className="flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-[0.98]"
          >
            <span>ورود به سالن نمونه (سالن آرون)</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 justify-center">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>رزرو فوری ۲۴ ساعته</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>تضمین عدم تداخل نوبت</span>
          </div>
        </div>
      </div>
    </main>
  );
}
