// ─── API REQUEST TİPLERİ ─────────────────────────────────────────────────────

export type CreateAppointmentRequest = {
  service_id: string
  staff_id: string
  start_time: string  // ISO 8601
  customer_name: string
  customer_phone: string
  customer_email: string
  notes?: string
}

export type CreateWaitlistRequest = {
  appointment_id: string  // hangi dolu slota bekleniyor
  customer_name: string
  customer_phone: string
  customer_email: string
}

export type GetSlotsRequest = {
  service_id: string
  staff_id?: string   // boşsa tüm uygun personelin slotları
  date: string        // "YYYY-MM-DD"
}

// Panel — personel oluşturma
export type CreateStaffRequest = {
  full_name: string
  title?: string
  work_hours: import("./staff").WorkHours
}

export type UpdateStaffRequest = Partial<CreateStaffRequest> & {
  is_active?: boolean
  photo_url?: string
}

// Panel — hizmet oluşturma
export type CreateServiceRequest = {
  name: string
  description?: string
  duration_min: number
}

export type UpdateServiceRequest = Partial<CreateServiceRequest> & {
  is_active?: boolean
}

// Panel — tema güncelleme
export type UpdateThemeRequest = {
  primary_color?: string
  secondary_color?: string
  font?: string
  border_radius?: string
  cover_image_url?: string
  tagline?: string
  logo_url?: string
}

// ─── API RESPONSE TİPLERİ ────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiError = {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
