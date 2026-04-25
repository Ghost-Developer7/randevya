import { db } from "@/lib/db"
import type { TimeSlot } from "@/types"

type WorkInterval = { start: string; end: string }
type WorkHoursJson = Record<string, WorkInterval[]>

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

// "09:30" → dakika cinsinden sayı (570)
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// 570 → "09:30"
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

// Türkiye UTC+3 offset (ms)
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000

// UTC Date'i Türkiye saatine çevir (getUTCHours kullanımı için +3 ekler)
function toTurkeyDate(d: Date): Date {
  return new Date(d.getTime() + TZ_OFFSET_MS)
}

// Belirli bir tarihteki personelin müsait aralıklarını hesapla
// Mevcut randevuları çıkarır, kalan boşlukları döner
async function getAvailableIntervalsForStaff(
  staffId: string,
  tenantId: string,
  dateStr: string, // "YYYY-MM-DD" — Türkiye yerel tarih
  durationMin: number
): Promise<{ startMin: number; endMin: number }[]> {
  const staff = await db.staff.findUnique({
    where: { id: staffId, tenant_id: tenantId, is_active: true },
  })
  if (!staff) return []

  const workHours: WorkHoursJson = JSON.parse(staff.work_hours)
  // Haftanın gününü Türkiye yerel zamanına göre hesapla
  const tzDate = new Date(`${dateStr}T12:00:00+03:00`) // öğle saati — DST kayması yok
  const dayKey = DAY_KEYS[tzDate.getDay()]
  const intervals = workHours[dayKey] ?? []
  if (intervals.length === 0) return []

  // O günün Türkiye gece yarısı / sonu (UTC olarak sakla)
  const dayStart = new Date(`${dateStr}T00:00:00+03:00`)
  const dayEnd = new Date(`${dateStr}T23:59:59+03:00`)

  const appointments = await db.appointment.findMany({
    where: {
      tenant_id: tenantId,
      staff_id: staffId,
      start_time: { gte: dayStart, lte: dayEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    orderBy: { start_time: "asc" },
  })

  // Meşgul aralıkları Türkiye yerel saatiyle dakika olarak listele
  const busyIntervals = appointments.map((a) => {
    const startTR = toTurkeyDate(a.start_time)
    const endTR = toTurkeyDate(a.end_time)
    return {
      startMin: startTR.getUTCHours() * 60 + startTR.getUTCMinutes(),
      endMin: endTR.getUTCHours() * 60 + endTR.getUTCMinutes(),
    }
  })

  // Çalışma aralıklarını işle, meşgul zamanları çıkar
  const available: { startMin: number; endMin: number }[] = []

  for (const interval of intervals) {
    let cursor = timeToMinutes(interval.start)
    const end = timeToMinutes(interval.end)

    for (const busy of busyIntervals) {
      if (busy.startMin >= end) break
      if (busy.endMin <= cursor) continue

      // cursor → busy.startMin arası boş
      if (busy.startMin > cursor) {
        available.push({ startMin: cursor, endMin: busy.startMin })
      }
      cursor = Math.max(cursor, busy.endMin)
    }

    // Son boşluk
    if (cursor < end) {
      available.push({ startMin: cursor, endMin: end })
    }
  }

  // Hizmet süresinden kısa aralıkları filtrele
  return available.filter((a) => a.endMin - a.startMin >= durationMin)
}

// Bir aralıktan durationMin'lik slotları üret (bitişik, boşluksuz)
function generateSlots(
  interval: { startMin: number; endMin: number },
  durationMin: number,
  dateStr: string // "YYYY-MM-DD"
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = []
  let cursor = interval.startMin

  while (cursor + durationMin <= interval.endMin) {
    const start = `${dateStr}T${minutesToTime(cursor)}:00+03:00`
    const end = `${dateStr}T${minutesToTime(cursor + durationMin)}:00+03:00`
    slots.push({ start, end })
    cursor += durationMin
  }

  return slots
}

// ─── Ana fonksiyon ──────────────────────────────────────────────────────────

export async function getAvailableSlots({
  tenantId,
  serviceId,
  staffId,
  date, // "YYYY-MM-DD"
}: {
  tenantId: string
  serviceId: string
  staffId?: string
  date: string
}): Promise<TimeSlot[]> {
  const service = await db.service.findUnique({
    where: { id: serviceId, tenant_id: tenantId, is_active: true },
  })
  if (!service) return []

  // Hangi personeller bu hizmeti veriyor?
  const staffQuery = staffId
    ? await db.staffService.findMany({
        where: { tenant_id: tenantId, service_id: serviceId, staff_id: staffId },
        include: { staff: true },
      })
    : await db.staffService.findMany({
        where: { tenant_id: tenantId, service_id: serviceId, staff: { is_active: true } },
        include: { staff: true },
      })

  const slots: TimeSlot[] = []

  for (const ss of staffQuery) {
    if (!ss.staff.is_active) continue

    const intervals = await getAvailableIntervalsForStaff(
      ss.staff_id,
      tenantId,
      date,
      service.duration_min
    )

    for (const interval of intervals) {
      const raw = generateSlots(interval, service.duration_min, date)
      for (const r of raw) {
        slots.push({
          start: r.start,
          end: r.end,
          staff_id: ss.staff_id,
          staff_name: ss.staff.full_name,
        })
      }
    }
  }

  // Başlangıç zamanına göre sırala
  slots.sort((a, b) => a.start.localeCompare(b.start))

  return slots
}

// Belirli bir slot'un hâlâ müsait olup olmadığını kontrol et (randevu oluştururken)
export async function isSlotAvailable({
  tenantId,
  staffId,
  startTime,
  endTime,
  excludeAppointmentId,
}: {
  tenantId: string
  staffId: string
  startTime: Date
  endTime: Date
  excludeAppointmentId?: string  // reschedule için mevcut randevuyu hariç tut
}): Promise<boolean> {
  const conflict = await db.appointment.findFirst({
    where: {
      tenant_id: tenantId,
      staff_id: staffId,
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      OR: [
        { start_time: { lt: endTime }, end_time: { gt: startTime } },
      ],
    },
  })
  return conflict === null
}
