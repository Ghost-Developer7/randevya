import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import type { WebhookEvent } from "@/lib/webhook"

const VALID_WEBHOOK_EVENTS: WebhookEvent[] = [
  "appointment.created",
  "appointment.confirmed",
  "appointment.cancelled",
  "appointment.completed",
  "appointment.rescheduled",
  "waitlist.notified",
  "waitlist.confirmed",
]

// PATCH /api/panel/settings/webhooks/[id] — webhook güncelle
// Body: { url?, events?, is_active? }
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const endpoint = await db.webhookEndpoint.findUnique({ where: { id } })
  if (!endpoint) return err("Webhook bulunamadı", 404)
  if (endpoint.tenant_id !== tenantId) return err("Yetkisiz kaynak", 403)

  const body = await req.json().catch(() => null) as {
    url?: string
    events?: string[]
    is_active?: boolean
  } | null

  if (!body) return err("Geçersiz JSON")

  if (body.url !== undefined) {
    if (!body.url.startsWith("https://")) return err("URL https:// ile başlamalı")
    try {
      new URL(body.url)
    } catch {
      return err("Geçersiz URL formatı")
    }
  }

  if (body.events !== undefined) {
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return err("events en az bir olay içermeli")
    }
    const invalidEvents = body.events.filter(
      (e) => e !== "*" && !VALID_WEBHOOK_EVENTS.includes(e as WebhookEvent)
    )
    if (invalidEvents.length > 0) {
      return err(`Geçersiz event değerleri: ${invalidEvents.join(", ")}`)
    }
  }

  const updated = await db.webhookEndpoint.update({
    where: { id },
    data: {
      ...(body.url !== undefined && { url: body.url }),
      ...(body.events !== undefined && { events: JSON.stringify(body.events) }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
    },
  })

  return ok({
    id: updated.id,
    url: updated.url,
    events: JSON.parse(updated.events) as string[],
    is_active: updated.is_active,
  })
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/panel/settings/webhooks/[id]")

// DELETE /api/panel/settings/webhooks/[id] — webhook sil
async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const endpoint = await db.webhookEndpoint.findUnique({ where: { id } })
  if (!endpoint) return err("Webhook bulunamadı", 404)
  if (endpoint.tenant_id !== tenantId) return err("Yetkisiz kaynak", 403)

  // İlişkili logları önce sil (foreign key kısıtı)
  await db.webhookLog.deleteMany({ where: { endpoint_id: id } })
  await db.webhookEndpoint.delete({ where: { id } })

  return ok({ deleted: true })
}
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/panel/settings/webhooks/[id]")

// GET /api/panel/settings/webhooks/[id] — son 50 teslimat logu
async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const endpoint = await db.webhookEndpoint.findUnique({ where: { id } })
  if (!endpoint) return err("Webhook bulunamadı", 404)
  if (endpoint.tenant_id !== tenantId) return err("Yetkisiz kaynak", 403)

  const logs = await db.webhookLog.findMany({
    where: { endpoint_id: id },
    orderBy: { created_at: "desc" },
    take: 50,
  })

  return ok(
    logs.map((l) => ({
      id: l.id,
      event: l.event,
      status_code: l.status_code,
      success: l.success,
      error_msg: l.error_msg,
      created_at: l.created_at.toISOString(),
    }))
  )
}
export const GET = withErrorHandler(getHandler, "GET /api/panel/settings/webhooks/[id]")
