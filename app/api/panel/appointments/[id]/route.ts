import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { notifyAppointmentCancelled } from "@/lib/notifications"
import { notifyNextInWaitlist } from "@/lib/waitlist"
import { notifyWaitlistSlotOpened } from "@/lib/notifications"
import type { AppointmentStatus } from "@/types"

// PATCH /api/panel/appointments/[id] — durum değiştir
// Body: { status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" }
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const appointment = await db.appointment.findFirst({
    where: { id, tenant_id: tenantId },
  })
  if (!appointment) return err("Randevu bulunamadı", 404)

  const body = await req.json().catch(() => null)
  const newStatus: AppointmentStatus = body?.status

  const allowed: AppointmentStatus[] = ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]
  if (!allowed.includes(newStatus)) {
    return err(`Geçersiz status. Geçerli değerler: ${allowed.join(", ")}`)
  }

  // İptal edilmiş randevu tekrar değiştirilemez
  if (appointment.status === "CANCELLED") {
    return err("İptal edilmiş randevu güncellenemez", 422)
  }

  await db.appointment.update({ where: { id }, data: { status: newStatus } })

  // İptal edildiyse: bildirim + bekleme listesi tetikle
  if (newStatus === "CANCELLED") {
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`
    notifyAppointmentCancelled(id).catch(console.error)
    notifyNextInWaitlist(id, tenantId)
      .then((entryId) => { if (entryId) return notifyWaitlistSlotOpened(entryId, baseUrl) })
      .catch(console.error)
  }

  return ok({ id, status: newStatus })
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/panel/appointments/[id]")
