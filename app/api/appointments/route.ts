import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, parseBody, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { isSlotAvailable } from "@/lib/slots"
import { notifyAppointmentCreated } from "@/lib/notifications"
import type { CreateAppointmentRequest } from "@/types"

// POST /api/appointments — randevu oluştur
async function postHandler(req: NextRequest) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  const { body, error } = await parseBody<CreateAppointmentRequest>(req)
  if (error) return error

  const { service_id, staff_id, start_time, customer_name, customer_phone, customer_email, notes } = body!

  // Zorunlu alanlar
  if (!service_id || !staff_id || !start_time || !customer_name || !customer_phone || !customer_email) {
    return err("Eksik alan: service_id, staff_id, start_time, customer_name, customer_phone, customer_email zorunlu")
  }

  // Email format kontrolü
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return err("Geçersiz email adresi")
  }

  // Hizmet ve personelin bu tenant'a ait olduğunu doğrula
  const service = await db.service.findFirst({
    where: { id: service_id, tenant_id: tenant.id, is_active: true },
  })
  if (!service) return err("Hizmet bulunamadı", 404)

  const staff = await db.staff.findFirst({
    where: { id: staff_id, tenant_id: tenant.id, is_active: true },
  })
  if (!staff) return err("Personel bulunamadı", 404)

  // Personelin bu hizmeti verdiğini doğrula
  const assignment = await db.staffService.findFirst({
    where: { staff_id, service_id, tenant_id: tenant.id },
  })
  if (!assignment) return err("Bu personel seçilen hizmeti vermiyor")

  const startTime = new Date(start_time)
  if (isNaN(startTime.getTime())) return err("Geçersiz start_time formatı")

  const endTime = new Date(startTime.getTime() + service.duration_min * 60 * 1000)

  // Slot müsait mi?
  const available = await isSlotAvailable({
    tenantId: tenant.id,
    staffId: staff_id,
    startTime,
    endTime,
  })
  if (!available) return err("Seçilen slot artık müsait değil", 409, "SLOT_TAKEN")

  // Randevu oluştur
  const appointment = await db.appointment.create({
    data: {
      tenant_id: tenant.id,
      staff_id,
      service_id,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email.toLowerCase().trim(),
      start_time: startTime,
      end_time: endTime,
      status: "CONFIRMED",
      notes: notes?.trim() ?? null,
    },
  })

  // Bildirimleri arka planda gönder (response'u bloklamaz)
  notifyAppointmentCreated(appointment.id).catch(console.error)

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
export const POST = withErrorHandler(postHandler, "POST /api/appointments")
