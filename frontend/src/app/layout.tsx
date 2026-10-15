import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    {
      path: "../../public/fonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
  fallback: ["system-ui", "sans-serif"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "به وقت | سامانه رزرو آنلاین نوبت آرایشگاه",
  description: "سامانه سریع، شیک و بدون اصطکاک رزرو آنلاین نوبت پیرایشگاه و آرایشگاه مردانه",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} dark antialiased`}>
      <body className="min-h-screen bg-[#090A0F] text-[#E2E8F0] selection:bg-amber-500/20 selection:text-amber-300">
        {children}
      </body>
    </html>
  );
}
