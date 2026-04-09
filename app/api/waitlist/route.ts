import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, parseBody, withErrorHandler } from "@/lib/api-helpers"
import { addToWaitlist } from "@/lib/waitlist"
import { db } from "@/lib/db"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import type { CreateWaitlistRequest } from "@/types"

// POST /api/waitlist — bekleme listesine ekle
async function postHandler(req: NextRequest) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  const { body, error } = await parseBody<CreateWaitlistRequest>(req)
  if (error) return error

  const { appointment_id, customer_name, customer_phone, customer_email } = body!

  if (!appointment_id || !customer_name || !customer_phone || !customer_email) {
    return err("Eksik alan: appointment_id, customer_name, customer_phone, customer_email zorunlu")
  }

  // Randevunun bu tenant'a ait olduğunu doğrula
  const appointment = await db.appointment.findFirst({
    where: { id: appointment_id, tenant_id: tenant.id },
  })
  if (!appointment) return err("Randevu bulunamadı", 404)

  // Tenant planı bekleme listesine izin veriyor mu?
  const tenantWithPlan = await db.tenant.findUnique({
    where: { id: tenant.id },
    include: { plan: { select: { waitlist_enabled: true } } },
  })
  if (!tenantWithPlan?.plan.waitlist_enabled) {
    return err("Bu işletmenin planı bekleme listesini desteklemiyor", 403)
  }

  const entry = await addToWaitlist({
    tenantId: tenant.id,
    appointmentId: appointment_id,
    customerName: customer_name.trim(),
    customerPhone: customer_phone.trim(),
    customerEmail: customer_email.toLowerCase().trim(),
  })

  return ok({ id: entry.id, queue_order: entry.queue_order }, 201)
}
const handlerWithError = withErrorHandler(postHandler, "POST /api/waitlist")
export const POST = withRateLimit(handlerWithError, "rl:waitlist", RATE_LIMITS.publicBooking)
