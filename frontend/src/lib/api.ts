export interface Service {
  id: number;
  title: string;
  duration_minutes: number;
  price: number;
  show_price: boolean;
  is_active: boolean;
}

export interface Salon {
  id: number;
  name: string;
  slug: string;
  phone?: string;
  address?: string;
  services: Service[];
  opening_time?: string;
  closing_time?: string;
  slot_interval_minutes?: number;
}

export interface Slot {
  starts_at: string;
  ends_at: string;
  available: boolean;
}

export interface BookingRequest {
  service_id: number;
  starts_at: string; // e.g. "2026-10-16 11:00"
  customer_name: string;
  customer_phone: string;
  notes?: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
}

export interface Appointment {
  id?: number;
  salon_id?: number;
  service_id?: number;
  customer_id?: number;
  starts_at: string;
  ends_at?: string;
  status?: string;
  barber_notes?: string | null;
  service?: Service;
  customer?: Customer;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  appointment?: Appointment;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isRateLimited: boolean = false,
    public data: any = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Helper to calculate ends_at time string given starts_at and duration in minutes.
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  try {
    const parts = startTime.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const totalMinutes = hours * 60 + minutes + durationMinutes;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMins = totalMinutes % 60;
      return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
    }
  } catch {
    // Fallback
  }
  return startTime;
}

/**
 * Fetch salon metadata and services by slug.
 */
export async function fetchSalonBySlug(slug: string): Promise<Salon> {
  try {
    const res = await fetch(`${API_BASE_URL}/salons/${slug}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 429) {
      throw new ApiError(
        "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً یک دقیقه دیگر تلاش کنید.",
        429,
        true
      );
    }

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      throw new ApiError(
        json?.message || "سالن مورد نظر یافت نشد.",
        res.status,
        false,
        json?.data
      );
    }

    const salonData = json.data.salon || json.data;
    const servicesData: Service[] = (json.data.services || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      duration_minutes: s.duration_minutes,
      price: s.price ?? 0,
      show_price: Boolean(s.show_price),
      is_active: s.is_active ?? true,
    }));

    return {
      id: salonData.id,
      name: salonData.name,
      slug: salonData.slug,
      phone: salonData.phone,
      address: salonData.address,
      opening_time: salonData.opening_time,
      closing_time: salonData.closing_time,
      slot_interval_minutes: salonData.slot_interval_minutes,
      services: servicesData,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.",
      0,
      false,
      error
    );
  }
}

/**
 * Fetch available time slots for a given salon, date, and service.
 */
export async function fetchAvailableSlots(
  slug: string,
  date: string,
  serviceId: number
): Promise<Slot[]> {
  try {
    const params = new URLSearchParams({
      date,
      service_id: serviceId.toString(),
    });

    const res = await fetch(`${API_BASE_URL}/salons/${slug}/slots?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 429) {
      throw new ApiError(
        "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.",
        429,
        true
      );
    }

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      throw new ApiError(
        json?.message || "خطا در دریافت زمان‌های آزاد نوبت‌دهی.",
        res.status,
        false,
        json?.data
      );
    }

    const slotsArray: any[] = json.data?.slots || [];
    const duration: number = json.data?.duration_minutes || 30;

    return slotsArray.map((item: any) => {
      if (typeof item === "string") {
        return {
          starts_at: item,
          ends_at: calculateEndTime(item, duration),
          available: true,
        };
      }
      return {
        starts_at: item.starts_at || item.time || "",
        ends_at: item.ends_at || calculateEndTime(item.starts_at, duration),
        available: item.available ?? true,
      };
    });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "خطا در دریافت اسلات‌های نوبت‌دهی. لطفاً دوباره امتحان کنید.",
      0,
      false,
      error
    );
  }
}

/**
 * Submit an appointment booking request.
 */
export async function createBooking(
  slug: string,
  payload: BookingRequest
): Promise<BookingResponse> {
  try {
    // If starts_at is e.g. "2026-10-16 11:00", also extract date and start_time for maximum compatibility
    let dateStr = "";
    let timeStr = "";
    if (payload.starts_at.includes(" ")) {
      const [d, t] = payload.starts_at.split(" ");
      dateStr = d;
      timeStr = t;
    } else if (payload.starts_at.includes("T")) {
      const [d, t] = payload.starts_at.split("T");
      dateStr = d;
      timeStr = t.slice(0, 5);
    }

    const bodyPayload = {
      service_id: payload.service_id,
      starts_at: payload.starts_at,
      date: dateStr || undefined,
      start_time: timeStr || undefined,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      notes: payload.notes,
    };

    const res = await fetch(`${API_BASE_URL}/salons/${slug}/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    if (res.status === 429) {
      throw new ApiError(
        "تعداد درخواست‌های رزرو از حد مجاز عبور کرده است. لطفاً ۱ دقیقه صبر فرمایید.",
        429,
        true
      );
    }

    const json = await res.json().catch(() => null);

    if (res.status === 409) {
      throw new ApiError(
        "این زمان لحظاتی پیش رزرو شد، لطفاً زمان دیگری انتخاب کنید.",
        409,
        false,
        json?.data
      );
    }

    if (!res.ok || !json?.success) {
      throw new ApiError(
        json?.message || "متأسفانه ثبت نوبت با خطا مواجه شد.",
        res.status,
        false,
        json?.data
      );
    }

    return {
      success: true,
      message: json.message || "نوبت شما با موفقیت ثبت شد.",
      appointment: json.data,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "خطای شبکه در هنگام ثبت نوبت. لطفاً اتصال اینترنت خود را چک کنید.",
      0,
      false,
      error
    );
  }
}
