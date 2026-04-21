import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { notifyAppointmentCancelled } from "@/lib/notifications"
import { notifyNextInWaitlist } from "@/lib/waitlist"
import { notifyWaitlistSlotOpened } from "@/lib/notifications"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { isSlotAvailable } from "@/lib/slots"

// GET /api/appointments/[id] — randevu detayı (müşteri doğrulaması: email ile)
async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  const { id } = await params
  const email = req.nextUrl.searchParams.get("email")
  if (!email) return err("email parametresi zorunlu")

  const appointment = await db.appointment.findFirst({
    where: {
      id,
      tenant_id: tenant.id,
      customer_email: email.toLowerCase(),
    },
    include: {
      staff: { select: { id: true, full_name: true, title: true } },
      service: { select: { id: true, name: true, duration_min: true } },
    },
  })

  if (!appointment) return err("Randevu bulunamadı", 404)

  return ok({
    id: appointment.id,
    customer_name: appointment.customer_name,
    customer_email: appointment.customer_email,
    customer_phone: appointment.customer_phone,
    start_time: appointment.start_time.toISOString(),
    end_time: appointment.end_time.toISOString(),
    status: appointment.status,
    notes: appointment.notes,
    staff: appointment.staff,
    service: appointment.service,
  })
}
const getWithError = withErrorHandler(getHandler, "GET /api/appointments/[id]")
export const GET = withRateLimit(getWithError, "rl:appt-get", RATE_LIMITS.publicSlots)

// PATCH /api/appointments/[id] — müşteri iptal veya tarih değiştir
// Body: { action: "cancel" | "reschedule", email: "...", start_time?: "ISO" }
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz JSON")

  const { action, email, start_time } = body as { action: string; email: string; start_time?: string }

  if (action !== "cancel" && action !== "reschedule") return err("Geçersiz action")
  if (!email) return err("email zorunlu")

  const appointment = await db.appointment.findFirst({
    where: {
      id,
      tenant_id: tenant.id,
      customer_email: email.toLowerCase(),
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: { service: { select: { duration_min: true } } },
  })

  if (!appointment) return err("Randevu bulunamadı veya değiştirilemez", 404)

  // 2 saatten az kaldıysa değişiklik/iptal engelli
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
  if (appointment.start_time < twoHoursFromNow) {
    return err("Randevuya 2 saatten az kaldığında değişiklik yapılamaz", 422)
  }

  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`

  if (action === "cancel") {
    await db.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    notifyAppointmentCancelled(id).catch(console.error)
    notifyNextInWaitlist(id, tenant.id)
      .then((entryId) => { if (entryId) return notifyWaitlistSlotOpened(entryId, baseUrl) })
      .catch(console.error)

    return ok({ cancelled: true })
  }

  // ─── Tarih değiştir ───────────────────────────────────────────────────────
  if (!start_time) return err("Yeni saat (start_time) zorunlu")

  const newStart = new Date(start_time)
  if (isNaN(newStart.getTime())) return err("Geçersiz tarih formatı")

  // Geleceğe ve en az 2 saat sonrasına olmalı
  if (newStart < twoHoursFromNow) {
    return err("En erken 2 saat sonrası için randevu alınabilir", 422)
  }

  const newEnd = new Date(newStart.getTime() + appointment.service.duration_min * 60 * 1000)

  // Aynı saat seçilmişse değişmesin
  if (newStart.getTime() === appointment.start_time.getTime()) {
    return err("Mevcut saatle aynı, değişiklik yok", 422)
  }

  // Slot müsait mi? (Mevcut randevu hariç kontrol)
  const available = await isSlotAvailable({
    tenantId: tenant.id,
    staffId: appointment.staff_id,
    startTime: newStart,
    endTime: newEnd,
    excludeAppointmentId: id,
  })
  if (!available) return err("Seçilen slot artık müsait değil", 409, "SLOT_TAKEN")

  await db.appointment.update({
    where: { id },
    data: { start_time: newStart, end_time: newEnd },
  })

  return ok({ rescheduled: true, start_time: newStart.toISOString(), end_time: newEnd.toISOString() })
}
const patchWithError = withErrorHandler(patchHandler, "PATCH /api/appointments/[id]")
export const PATCH = withRateLimit(patchWithError, "rl:appt-cancel", RATE_LIMITS.publicBooking)
