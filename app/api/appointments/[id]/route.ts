import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { notifyAppointmentCancelled } from "@/lib/notifications"
import { notifyNextInWaitlist } from "@/lib/waitlist"
import { notifyWaitlistSlotOpened } from "@/lib/notifications"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

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
      staff: { select: { full_name: true, title: true } },
      service: { select: { name: true, duration_min: true } },
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

// PATCH /api/appointments/[id] — müşteri iptal
// Body: { action: "cancel", email: "..." }
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz JSON")

  const { action, email } = body as { action: string; email: string }

  if (action !== "cancel") return err("Geçersiz action")
  if (!email) return err("email zorunlu")

  const appointment = await db.appointment.findFirst({
    where: {
      id,
      tenant_id: tenant.id,
      customer_email: email.toLowerCase(),
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  })

  if (!appointment) return err("Randevu bulunamadı veya iptal edilemez", 404)

  // 2 saatten az kaldıysa iptal engellenebilir (isteğe bağlı iş kuralı)
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
  if (appointment.start_time < twoHoursFromNow) {
    return err("Randevuya 2 saatten az kaldığında iptal yapılamaz", 422)
  }

  await db.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  })

  // Bildirim + bekleme listesi tetikle
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`
  notifyAppointmentCancelled(id).catch(console.error)
  notifyNextInWaitlist(id, tenant.id)
    .then((entryId) => { if (entryId) return notifyWaitlistSlotOpened(entryId, baseUrl) })
    .catch(console.error)

  return ok({ cancelled: true })
}
const patchWithError = withErrorHandler(patchHandler, "PATCH /api/appointments/[id]")
export const PATCH = withRateLimit(patchWithError, "rl:appt-cancel", RATE_LIMITS.publicBooking)
