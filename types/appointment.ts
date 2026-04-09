export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"

export type Appointment = {
  id: string
  tenant_id: string
  staff_id: string
  service_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  start_time: string  // ISO 8601
  end_time: string    // ISO 8601
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// Randevu takvim görünümü için zenginleştirilmiş tip
export type AppointmentWithDetails = Appointment & {
  staff_name: string
  service_name: string
  service_duration_min: number
}

// Müsait slot
export type TimeSlot = {
  start: string  // ISO 8601
  end: string    // ISO 8601
  staff_id: string
  staff_name: string
}

export type WaitlistStatus =
  | "WAITING"
  | "NOTIFIED"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"

export type WaitlistEntry = {
  id: string
  tenant_id: string
  appointment_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  queue_order: number
  notified_at: string | null
  expires_at: string | null
  status: WaitlistStatus
  created_at: string
}
