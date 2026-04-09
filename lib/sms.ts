/**
 * İleti Merkezi SMS Entegrasyonu
 * Dokümantasyon: https://www.iletimerkezi.com/docs
 *
 * .env.local'e ekleyin:
 *   ILETIMERKEZI_API_KEY=...
 *   ILETIMERKEZI_API_SECRET=...
 *   ILETIMERKEZI_SENDER=RANDEVYA  (max 11 karakter)
 */

import crypto from "crypto"
import { db } from "@/lib/db"

const BASE_URL = "https://api.iletimerkezi.com/v1"
const SENDER = process.env.ILETIMERKEZI_SENDER ?? "RANDEVYA"

type SmsResult = { success: boolean; error?: string }

/**
 * Türk telefon numarasını 90xxx formatına normalize eder
 * "05XX" → "905XX" | "+905XX" → "905XX"
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("90") && digits.length === 12) return digits
  if (digits.startsWith("0") && digits.length === 11) return "9" + digits
  if (digits.length === 10) return "90" + digits
  return digits
}

/**
 * Hash hesaplama: md5(key + secret)
 * İleti Merkezi kimlik doğrulama yöntemi
 */
function buildAuthHash(key: string, secret: string): string {
  return crypto.createHash("md5").update(key + secret).digest("hex")
}

/**
 * Tek veya çoklu numara SMS gönder
 */
async function sendSms(phones: string[], message: string): Promise<SmsResult> {
  const key = process.env.ILETIMERKEZI_API_KEY
  const secret = process.env.ILETIMERKEZI_API_SECRET

  if (!key || !secret) {
    console.warn("[SMS] ILETIMERKEZI_API_KEY veya ILETIMERKEZI_API_SECRET tanımlı değil")
    return { success: false, error: "SMS yapılandırması eksik" }
  }

  const hash = buildAuthHash(key, secret)
  const normalizedPhones = phones.map(normalizePhone)

  const body = JSON.stringify({
    request: {
      authentication: { key, hash },
      order: {
        sender: SENDER,
        message: {
          text: message,
          receipents: {
            number: normalizedPhones,
          },
        },
      },
    },
  })

  try {
    const res = await fetch(`${BASE_URL}/send-sms/json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    const data = await res.json() as {
      response?: { status?: { code?: number; message?: string } }
    }

    const code = data?.response?.status?.code
    if (code === 200) return { success: true }

    const errMsg = data?.response?.status?.message ?? `Hata kodu: ${code}`
    console.error("[SMS] Gönderim başarısız:", errMsg)
    return { success: false, error: errMsg }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bağlantı hatası"
    console.error("[SMS] İstek hatası:", msg)
    return { success: false, error: msg }
  }
}

async function logSms(
  tenantId: string,
  recipient: string,
  eventType: string,
  success: boolean,
  errorMsg?: string
) {
  await db.notificationLog.create({
    data: {
      tenant_id: tenantId,
      channel: "SMS",
      recipient,
      event_type: eventType,
      status: success ? "SENT" : "FAILED",
      error_msg: errorMsg ?? null,
    },
  }).catch(() => {}) // log başarısız olsa da devam et
}

// ─── Bildirim Fonksiyonları ───────────────────────────────────────────────────

export async function sendAppointmentConfirmSms(params: {
  tenantId: string
  companyName: string
  customerPhone: string
  customerName: string
  serviceName: string
  startTime: Date
}): Promise<SmsResult> {
  const date = params.startTime.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
  const time = params.startTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })

  const message =
    `${params.companyName}: Merhaba ${params.customerName}, ` +
    `${date} saat ${time} ${params.serviceName} randevunuz onaylanmistir.`

  const result = await sendSms([params.customerPhone], message)
  await logSms(params.tenantId, params.customerPhone, "APPOINTMENT_CONFIRM", result.success, result.error)
  return result
}

export async function sendAppointmentCancelSms(params: {
  tenantId: string
  companyName: string
  customerPhone: string
  customerName: string
  startTime: Date
}): Promise<SmsResult> {
  const date = params.startTime.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
  const time = params.startTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })

  const message =
    `${params.companyName}: ${date} ${time} randevunuz iptal edilmistir. ` +
    `Bilgi: ${process.env.NEXTAUTH_URL}`

  const result = await sendSms([params.customerPhone], message)
  await logSms(params.tenantId, params.customerPhone, "APPOINTMENT_CANCEL", result.success, result.error)
  return result
}

export async function sendAppointmentReminderSms(params: {
  tenantId: string
  companyName: string
  customerPhone: string
  customerName: string
  serviceName: string
  startTime: Date
}): Promise<SmsResult> {
  const date = params.startTime.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
  const time = params.startTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })

  const message =
    `Hatirlat: ${params.companyName} - ${params.customerName}, ` +
    `yarin ${date} saat ${time} ${params.serviceName} randevunuz var.`

  const result = await sendSms([params.customerPhone], message)
  await logSms(params.tenantId, params.customerPhone, "APPOINTMENT_REMINDER", result.success, result.error)
  return result
}

export async function sendWaitlistNotifySms(params: {
  tenantId: string
  companyName: string
  customerPhone: string
  customerName: string
  confirmUrl: string
  expireMinutes?: number
}): Promise<SmsResult> {
  const minutes = params.expireMinutes ?? 30
  const message =
    `${params.companyName}: Slot acildi! ${params.customerName}, ` +
    `${minutes} dk icinde onaylayin: ${params.confirmUrl}`

  const result = await sendSms([params.customerPhone], message)
  await logSms(params.tenantId, params.customerPhone, "WAITLIST_NOTIFY", result.success, result.error)
  return result
}
