import { Suspense, use } from "react";
import { BookingClient } from "@/components/booking/BookingClient";

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
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-panel p-6 rounded-2xl text-sm text-slate-400">
            در حال بارگذاری صفحه رزرو...
          </div>
        </div>
      }
    >
      <BookingPageContent params={params} />
    </Suspense>
  );
}
