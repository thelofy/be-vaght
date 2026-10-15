/**
 * Convert standard English digits to Persian digits.
 */
export function toPersianDigits(num: number | string): string {
  if (num === null || num === undefined) return "";
  const str = String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * Format price in Tomans with Persian comma separators.
 */
export function formatPrice(price: number | null, showPrice: boolean = true): string {
  if (!showPrice || price === null || price === undefined) {
    return "قیمت توافقی";
  }

  if (price === 0) {
    return "رایگان";
  }

  const formatted = price.toLocaleString("fa-IR");
  return `${formatted} تومان`;
}

export interface DayPill {
  date: string; // YYYY-MM-DD
  dayName: string; // مثلا "امروز", "فردا", "دوشنبه"
  jalaliDate: string; // مثلا "۲۴ مهر"
  isToday: boolean;
}

/**
 * Generate next N days starting from today with Persian names and Jalali dates.
 */
export function getNextDays(daysCount: number = 7): DayPill[] {
  const result: DayPill[] = [];
  const now = new Date();

  for (let i = 0; i < daysCount; i++) {
    const target = new Date(now);
    target.setDate(now.getDate() + i);

    // Format ISO string YYYY-MM-DD
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;

    // Format in Persian
    let dayName = "";
    if (i === 0) {
      dayName = "امروز";
    } else if (i === 1) {
      dayName = "فردا";
    } else {
      dayName = new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(target);
    }

    const jalaliDate = new Intl.DateTimeFormat("fa-IR", {
      month: "long",
      day: "numeric",
    }).format(target);

    result.push({
      date: isoDate,
      dayName,
      jalaliDate,
      isToday: i === 0,
    });
  }

  return result;
}

/**
 * Format full Persian appointment date and time for confirmation.
 */
export function formatAppointmentDateTime(isoDate: string, time: string): string {
  try {
    const [year, month, day] = isoDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dateFormatted = new Intl.DateTimeFormat("fa-IR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObj);

    return `${dateFormatted} - ساعت ${toPersianDigits(time)}`;
  } catch {
    return `${isoDate} ساعت ${time}`;
  }
}
