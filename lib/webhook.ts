/**
 * Tenant Webhook Sistemi
 * Randevu olaylarında tenant'ın kayıtlı URL'lerine imzalı POST gönderir.
 * İmza: X-Randevya-Signature: sha256=HMAC(secret, JSON.stringify(payload))
 */

import crypto from "crypto"
import { db } from "@/lib/db"

export type WebhookEvent =
  | "appointment.created"
  | "appointment.confirmed"
  | "appointment.cancelled"
  | "appointment.completed"
  | "appointment.rescheduled"
  | "waitlist.notified"
  | "waitlist.confirmed"

export type WebhookPayload = {
  event: WebhookEvent
  tenant_id: string
  timestamp: string  // ISO 8601
  data: Record<string, unknown>
}

/**
 * HMAC-SHA256 imza üret
 */
function sign(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex")
}

/**
 * Tek bir webhook endpoint'ine gönderim dene.
 * 3 saniye timeout, başarısızsa hata kaydedilir.
 */
async function deliverWebhook(
  endpointId: string,
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<void> {
  const body = JSON.stringify(payload)
  const signature = sign(secret, body)

  let statusCode: number | null = null
  let success = false
  let errorMsg: string | undefined

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5sn timeout

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Randevya-Signature": signature,
        "X-Randevya-Event": payload.event,
        "User-Agent": "Randevya-Webhook/1.0",
      },
      body,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    statusCode = res.status
    success = res.status >= 200 && res.status < 300

    if (!success) {
      errorMsg = `HTTP ${res.status}: ${await res.text().catch(() => "")}`
    }
  } catch (e: unknown) {
    errorMsg = e instanceof Error ? e.message : "Bağlantı hatası"
    success = false
  }

  // Her durumda log yaz
  await db.webhookLog.create({
    data: {
      endpoint_id: endpointId,
      event: payload.event,
      payload: body,
      status_code: statusCode,
      success,
      error_msg: errorMsg ?? null,
    },
  }).catch(() => {})
}

/**
 * Tenant'ın ilgili event'i dinleyen tüm aktif webhook endpoint'lerine gönderir.
 * Fire-and-forget — ana iş akışını bloklamaz.
 */
export async function fireWebhook(
  tenantId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const endpoints = await db.webhookEndpoint.findMany({
    where: { tenant_id: tenantId, is_active: true },
  })

  if (!endpoints.length) return

  const payload: WebhookPayload = {
    event,
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
    data,
  }

  // events JSON array kontrolü: ["appointment.created", "*"] gibi
  const relevantEndpoints = endpoints.filter((ep) => {
    try {
      const events = JSON.parse(ep.events) as string[]
      return events.includes(event) || events.includes("*")
    } catch {
      return false
    }
  })

  // Paralel gönder, birinin başarısız olması diğerlerini etkilemesin
  await Promise.allSettled(
    relevantEndpoints.map((ep) =>
      deliverWebhook(ep.id, ep.url, ep.secret, payload)
    )
  )
}
