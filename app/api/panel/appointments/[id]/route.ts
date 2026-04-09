import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { notifyAppointmentCancelled } from "@/lib/notifications"
import { notifyNextInWaitlist } from "@/lib/waitlist"
import { notifyWaitlistSlotOpened } from "@/lib/notifications"
import { isSlotAvailable } from "@/lib/slots"
import { fireWebhook } from "@/lib/webhook"
import type { AppointmentStatus } from "@/types"

// PATCH /api/panel/appointments/[id]
// Durum değiştirme: { action: "status", status: "CONFIRMED" | ... }
// Tarih/saat değiştirme (reschedule): { action: "reschedule", start_time: ISO, end_time: ISO }
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
    include: { service: { select: { name: true } }, staff: { select: { full_name: true } } },
  })
  if (!appointment) return err("Randevu bulunamadı", 404)
  if (appointment.status === "CANCELLED") return err("İptal edilmiş randevu güncellenemez", 422)

  const body = await req.json().catch(() => null) as {
    action?: string
    status?: string
    start_time?: string
    end_time?: string
    notes?: string
  } | null

  if (!body) return err("Geçersiz JSON")

  // ── Reschedule ────────────────────────────────────────────────────────────
  if (body.action === "reschedule") {
    if (!body.start_time || !body.end_time) return err("start_time ve end_time zorunlu")

    const newStart = new Date(body.start_time)
    const newEnd = new Date(body.end_time)

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      return err("Geçersiz tarih/saat formatı (ISO 8601 bekleniyor)")
    }
    if (newStart <= new Date()) return err("Geçmiş tarih seçilemez")
    if (newEnd <= newStart) return err("end_time, start_time'dan sonra olmalı")

    // Çakışma kontrolü — aynı randevuyu hariç tut
    const slotOk = await isSlotAvailable({
      tenantId,
      staffId: appointment.staff_id,
      startTime: newStart,
      endTime: newEnd,
      excludeAppointmentId: id,
    })
    if (!slotOk) return err("Seçilen tarih/saat dolu")

    await db.appointment.update({
      where: { id },
      data: { start_time: newStart, end_time: newEnd },
    })

    fireWebhook(tenantId, "appointment.rescheduled", {
      appointment_id: id,
      new_start: newStart.toISOString(),
      new_end: newEnd.toISOString(),
    }).catch(() => {})

    return ok({ id, start_time: newStart, end_time: newEnd, rescheduled: true })
  }

  // ── Notlar güncelle ───────────────────────────────────────────────────────
  if (body.action === "notes") {
    await db.appointment.update({ where: { id }, data: { notes: body.notes ?? null } })
    return ok({ id, notes: body.notes ?? null })
  }

  // ── Durum değiştir (varsayılan) ───────────────────────────────────────────
  const newStatus = (body.status ?? body.action) as AppointmentStatus
  const allowed: AppointmentStatus[] = ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]
  if (!allowed.includes(newStatus)) {
    return err(`Geçersiz işlem. action: "reschedule" | "notes" | status: ${allowed.join("|")}`)
  }

  await db.appointment.update({ where: { id }, data: { status: newStatus } })

  if (newStatus === "CANCELLED") {
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`
    notifyAppointmentCancelled(id).catch(console.error)
    notifyNextInWaitlist(id, tenantId)
      .then((entryId) => { if (entryId) return notifyWaitlistSlotOpened(entryId, baseUrl) })
      .catch(console.error)
    fireWebhook(tenantId, "appointment.cancelled", { appointment_id: id }).catch(() => {})
  }

  if (newStatus === "CONFIRMED") {
    fireWebhook(tenantId, "appointment.confirmed", { appointment_id: id }).catch(() => {})
  }

  if (newStatus === "COMPLETED") {
    fireWebhook(tenantId, "appointment.completed", { appointment_id: id }).catch(() => {})
  }

  return ok({ id, status: newStatus })
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/panel/appointments/[id]")
