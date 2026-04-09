export type DaySchedule = {
  start: string  // "09:00"
  end: string    // "18:00"
}

// Her gün için time slot dizisi (boşsa o gün kapalı)
export type WorkHours = {
  mon: DaySchedule[]
  tue: DaySchedule[]
  wed: DaySchedule[]
  thu: DaySchedule[]
  fri: DaySchedule[]
  sat: DaySchedule[]
  sun: DaySchedule[]
}

export type Staff = {
  id: string
  tenant_id: string
  full_name: string
  title: string | null
  photo_url: string | null
  work_hours: WorkHours
  is_active: boolean
}

export type StaffPublic = Omit<Staff, "tenant_id">

export type Service = {
  id: string
  tenant_id: string
  name: string
  description: string | null
  duration_min: number
  is_active: boolean
}

export type ServicePublic = Omit<Service, "tenant_id">

export type StaffService = {
  id: string
  tenant_id: string
  staff_id: string
  service_id: string
}
