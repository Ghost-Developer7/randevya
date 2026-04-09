import { NextRequest } from "next/server"
import crypto from "crypto"
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

/** Secret'ın sadece ilk 4 karakterini göster, geri kalanını maskele */
function maskSecret(secret: string): string {
  if (secret.length <= 4) return "****"
  return secret.slice(0, 4) + "***"
}

// GET /api/panel/settings/webhooks — webhook endpoint listesi
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const endpoints = await db.webhookEndpoint.findMany({
    where: { tenant_id: tenantId },
    orderBy: { created_at: "desc" },
  })

  return ok(
    endpoints.map((ep) => ({
      id: ep.id,
      url: ep.url,
      events: JSON.parse(ep.events) as string[],
      is_active: ep.is_active,
      secret_preview: maskSecret(ep.secret),
      created_at: ep.created_at.toISOString(),
    }))
  )
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/settings/webhooks")

// POST /api/panel/settings/webhooks — yeni webhook endpoint oluştur
// Body: { url: string, events: string[] }
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const body = await req.json().catch(() => null) as {
    url?: string
    events?: string[]
  } | null

  if (!body) return err("Geçersiz JSON")
  if (!body.url) return err("url alanı zorunlu")
  if (!Array.isArray(body.events) || body.events.length === 0) {
    return err("events alanı en az bir olay içermeli")
  }

  // URL format doğrulama — sadece https://
  if (!body.url.startsWith("https://")) {
    return err("URL https:// ile başlamalı")
  }

  try {
    new URL(body.url)
  } catch {
    return err("Geçersiz URL formatı")
  }

  // events doğrulama
  const invalidEvents = body.events.filter(
    (e) => e !== "*" && !VALID_WEBHOOK_EVENTS.includes(e as WebhookEvent)
  )
  if (invalidEvents.length > 0) {
    return err(`Geçersiz event değerleri: ${invalidEvents.join(", ")}`)
  }

  const secret = crypto.randomBytes(32).toString("hex")

  const endpoint = await db.webhookEndpoint.create({
    data: {
      tenant_id: tenantId,
      url: body.url,
      events: JSON.stringify(body.events),
      secret,
      is_active: true,
    },
  })

  return ok(
    {
      id: endpoint.id,
      url: endpoint.url,
      events: JSON.parse(endpoint.events) as string[],
      is_active: endpoint.is_active,
      // Sadece oluşturma anında tam secret'ı göster
      secret,
      created_at: endpoint.created_at.toISOString(),
    },
    201
  )
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/settings/webhooks")
