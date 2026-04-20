import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, parseBody, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { isSlotAvailable } from "@/lib/slots"
import { notifyAppointmentCreated } from "@/lib/notifications"
import { fireWebhook } from "@/lib/webhook"

// GET /api/panel/appointments — takvim + liste verisi
// Query params:
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD  (tarih aralığı, default: bu hafta)
//   ?status=CONFIRMED,PENDING        (virgülle ayrılmış, default: hepsi)
//   ?staffId=xxx                     (filtre)
async function getHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const { searchParams } = req.nextUrl

  // Tarih aralığı
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const staffId = searchParams.get("staffId") ?? undefined
  const statusParam = searchParams.get("status")

  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d
  })()
  const to = toParam ? new Date(`${toParam}T23:59:59`) : (() => {
    const d = new Date(from); d.setDate(d.getDate() + 6); d.setHours(23, 59, 59, 999); return d
  })()

  const statusFilter = statusParam
    ? statusParam.split(",").map((s) => s.trim())
    : ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]

  const appointments = await db.appointment.findMany({
    where: {
      tenant_id: tenantId,
      start_time: { gte: from, lte: to },
      status: { in: statusFilter },
      ...(staffId && { staff_id: staffId }),
    },
    include: {
      staff: { select: { id: true, full_name: true } },
      service: { select: { id: true, name: true, duration_min: true } },
    },
    orderBy: { start_time: "asc" },
  })

  return ok(
    appointments.map((a) => ({
      id: a.id,
      customer_name: a.customer_name,
      customer_phone: a.customer_phone,
      customer_email: a.customer_email,
      start_time: a.start_time.toISOString(),
      end_time: a.end_time.toISOString(),
      status: a.status,
      notes: a.notes,
      staff: a.staff,
      service: a.service,
    }))
  )
}
export const GET = withErrorHandler(getHandler, "GET /api/panel/appointments")

// POST /api/panel/appointments — işletme sahibi tarafından randevu oluştur
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const { body, error: bodyErr } = await parseBody<{
    service_id: string
    staff_id: string
    start_time: string
    customer_name: string
    customer_phone: string
    customer_email: string
    notes?: string
  }>(req)
  if (bodyErr) return bodyErr

  const { service_id, staff_id, start_time, customer_name, customer_phone, customer_email, notes } = body!

  if (!service_id || !staff_id || !start_time || !customer_name || !customer_phone || !customer_email) {
    return err("Eksik alan: service_id, staff_id, start_time, customer_name, customer_phone, customer_email zorunlu")
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return err("Geçersiz email adresi")
  }

  // Hizmet ve personelin bu tenant'a ait olduğunu doğrula
  const service = await db.service.findFirst({
    where: { id: service_id, tenant_id: tenantId, is_active: true },
  })
  if (!service) return err("Hizmet bulunamadı", 404)

  const staff = await db.staff.findFirst({
    where: { id: staff_id, tenant_id: tenantId, is_active: true },
  })
  if (!staff) return err("Personel bulunamadı", 404)

  const assignment = await db.staffService.findFirst({
    where: { staff_id, service_id, tenant_id: tenantId },
  })
  if (!assignment) return err("Bu personel seçilen hizmeti vermiyor")

  const startTime = new Date(start_time)
  if (isNaN(startTime.getTime())) return err("Geçersiz start_time formatı")

  const endTime = new Date(startTime.getTime() + service.duration_min * 60 * 1000)

  const available = await isSlotAvailable({
    tenantId,
    staffId: staff_id,
    startTime,
    endTime,
  })
  if (!available) return err("Seçilen slot artık müsait değil", 409, "SLOT_TAKEN")

  // Geçmiş ise COMPLETED, gelecekse CONFIRMED
  const isPast = endTime < new Date()
  const status = isPast ? "COMPLETED" : "CONFIRMED"

  const appointment = await db.appointment.create({
    data: {
      tenant_id: tenantId,
      staff_id,
      service_id,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email.toLowerCase().trim(),
      start_time: startTime,
      end_time: endTime,
      status,
      notes: notes?.trim() ?? null,
    },
  })

  // Sadece gelecek randevular için bildirim/webhook
  if (!isPast) {
    notifyAppointmentCreated(appointment.id).catch(console.error)
    fireWebhook(tenantId, "appointment.created", {
      appointment_id: appointment.id,
      start_time: appointment.start_time.toISOString(),
      customer_name: appointment.customer_name,
      service_id,
      staff_id,
    }).catch(() => {})
  }

  return ok(
    {
      id: appointment.id,
      start_time: appointment.start_time.toISOString(),
      end_time: appointment.end_time.toISOString(),
      status: appointment.status,
    },
    201
  )
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/appointments")
