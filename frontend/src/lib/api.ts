export interface Service {
  id: number;
  title: string;
  duration_minutes: number;
  price: number | null;
  show_price: boolean;
}

export interface Salon {
  id: number;
  name: string;
  slug: string;
  phone: string;
  address: string | null;
  opening_time: string;
  closing_time: string;
  slot_interval_minutes: number;
}

export interface SalonDetailsResponse {
  salon: Salon;
  services: Service[];
}

export interface SlotsResponse {
  date: string;
  service_id: number;
  duration_minutes: number;
  slots: string[];
}

export interface BookingPayload {
  service_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  customer_name: string;
  customer_phone: string;
  customer_birth_date?: string;
  notes?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
}

export interface Appointment {
  id: number;
  salon_id: number;
  service_id: number;
  customer_id: number;
  user_id: number | null;
  starts_at: string;
  ends_at: string;
  status: string;
  barber_notes: string | null;
  service: Service;
  customer: Customer;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetch salon metadata and active services by slug.
 */
export async function fetchSalon(slug: string): Promise<SalonDetailsResponse> {
  const res = await fetch(`${API_BASE_URL}/salons/${slug}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const json: ApiResponse<SalonDetailsResponse> = await res.json();

  if (!res.ok || !json.success || !json.data) {
    throw new ApiError(json.message || "خطا در دریافت اطلاعات سالن", res.status, json.data);
  }

  return json.data;
}

/**
 * Fetch available time slots for a given service and date.
 */
export async function fetchAvailableSlots(
  slug: string,
  date: string,
  serviceId: number
): Promise<string[]> {
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

  const json: ApiResponse<SlotsResponse> = await res.json();

  if (!res.ok || !json.success || !json.data) {
    throw new ApiError(json.message || "خطا در دریافت زمان‌های آزاد", res.status, json.data);
  }

  return json.data.slots;
}

/**
 * Submit an appointment booking request.
 */
export async function submitBooking(
  slug: string,
  payload: BookingPayload
): Promise<Appointment> {
  const res = await fetch(`${API_BASE_URL}/salons/${slug}/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json: ApiResponse<Appointment> = await res.json();

  if (!res.ok || !json.success || !json.data) {
    throw new ApiError(json.message || "خطا در ثبت نوبت", res.status, json.data);
  }

  return json.data;
}
