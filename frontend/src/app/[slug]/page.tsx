"use client";

import { use, Suspense } from "react";
import { BookingClient } from "@/components/booking/BookingClient";
import { Scissors } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function BookingPageContent({ params }: PageProps) {
  const { slug } = use(params);
  return <BookingClient slug={slug} />;
}

export default function SalonBookingPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
              <Scissors className="w-7 h-7 animate-pulse" />
            </div>
            <p className="text-sm text-slate-300 font-medium">در حال بارگذاری صفحه رزرو...</p>
          </div>
        </div>
      }
    >
      <BookingPageContent params={params} />
    </Suspense>
  );
}
