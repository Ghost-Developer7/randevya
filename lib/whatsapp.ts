import { db } from "@/lib/db"

const WA_API_URL = "https://graph.facebook.com/v19.0"

// ─── Template mesaj gönderimi ─────────────────────────────────────────────────
// WhatsApp Cloud API'de ilk mesaj mutlaka onaylı template'le gönderilmeli

async function sendTemplateMessage({
  phoneNumberId,
  token,
  to,
  templateName,
  languageCode = "tr",
  components,
}: {
  phoneNumberId: string
  token: string
  to: string           // +905xxxxxxxxx formatında
  templateName: string
  languageCode?: string
  components?: object[]
}): Promise<{ success: boolean; error?: string }> {
  // Telefon numarasını düzelt: başında + yoksa ekle, Türkiye için 0 → 90
  const phone = normalizePhone(to)

  const body = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  }

  const res = await fetch(`${WA_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { success: false, error: JSON.stringify(err) }
  }

  return { success: true }
}

function normalizePhone(phone: string): string {
  // Sadece rakam bırak
  const digits = phone.replace(/\D/g, "")
  // Türkiye: 0 ile başlıyorsa 90 ekle
  if (digits.startsWith("0")) return "90" + digits.slice(1)
  // Zaten ülke kodu varsa olduğu gibi bırak
  return digits
}

// ─── Credential helper ─────────────────────────────────────────────────────────
// Her tenant kendi WA numarasını bağlayabilir (plan izin veriyorsa)
// Aksi hâlde platform numarası kullanılır

async function getWaCredentials(tenantId: string): Promise<{
  phoneNumberId: string
  token: string
} | null> {
  // Platform varsayılan credentials (env'den)
  const platformId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const platformToken = process.env.WHATSAPP_TOKEN

  if (!platformId || !platformToken) return null

  // Tenant'ın kendine ait WA credential'ı yoksa platform numarasını kullan
  // İleride: tenants tablosuna wa_phone_number_id ve wa_token alanı eklenebilir
  return { phoneNumberId: platformId, token: platformToken }
}

// ─── Log helper ───────────────────────────────────────────────────────────────

async function logWa(
  tenantId: string,
  recipient: string,
  eventType: string,
  success: boolean,
  errorMsg?: string
) {
  await db.notificationLog.create({
    data: {
      tenant_id: tenantId,
      channel: "WHATSAPP",
      recipient,
      event_type: eventType,
      status: success ? "SENT" : "FAILED",
      error_msg: errorMsg ?? null,
    },
  })
}

// ─── Randevu onay bildirimi ───────────────────────────────────────────────────
// Template adı: randevya_onay (Meta'da onaylatılmalı)
// Parametreler: [[customer_name], [service_name], [date_time], [company_name]]

export async function sendWaAppointmentConfirm(params: {
  tenantId: string
  customerName: string
  customerPhone: string
  serviceName: string
  startTime: Date
  companyName: string
}): Promise<void> {
  const creds = await getWaCredentials(params.tenantId)
  if (!creds) return

  const dateTime = params.startTime.toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

  const result = await sendTemplateMessage({
    phoneNumberId: creds.phoneNumberId,
    token: creds.token,
    to: params.customerPhone,
    templateName: "randevya_onay",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.customerName },
          { type: "text", text: params.serviceName },
          { type: "text", text: dateTime },
          { type: "text", text: params.companyName },
        ],
      },
    ],
  })

  await logWa(params.tenantId, params.customerPhone, "APPOINTMENT_CONFIRM", result.success, result.error)
}

// ─── Randevu iptal bildirimi ──────────────────────────────────────────────────
// Template adı: randevya_iptal
// Parametreler: [[customer_name], [service_name], [date_time]]

export async function sendWaAppointmentCancel(params: {
  tenantId: string
  customerName: string
  customerPhone: string
  serviceName: string
  startTime: Date
}): Promise<void> {
  const creds = await getWaCredentials(params.tenantId)
  if (!creds) return

  const dateTime = params.startTime.toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

  const result = await sendTemplateMessage({
    phoneNumberId: creds.phoneNumberId,
    token: creds.token,
    to: params.customerPhone,
    templateName: "randevya_iptal",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.customerName },
          { type: "text", text: params.serviceName },
          { type: "text", text: dateTime },
        ],
      },
    ],
  })

  await logWa(params.tenantId, params.customerPhone, "APPOINTMENT_CANCEL", result.success, result.error)
}

// ─── Randevu hatırlatma ───────────────────────────────────────────────────────
// Template adı: randevya_hatirlatma
// Parametreler: [[customer_name], [service_name], [date_time], [company_name]]

export async function sendWaAppointmentReminder(params: {
  tenantId: string
  customerName: string
  customerPhone: string
  serviceName: string
  startTime: Date
  companyName: string
}): Promise<void> {
  const creds = await getWaCredentials(params.tenantId)
  if (!creds) return

  const dateTime = params.startTime.toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

  const result = await sendTemplateMessage({
    phoneNumberId: creds.phoneNumberId,
    token: creds.token,
    to: params.customerPhone,
    templateName: "randevya_hatirlatma",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.customerName },
          { type: "text", text: params.serviceName },
          { type: "text", text: dateTime },
          { type: "text", text: params.companyName },
        ],
      },
    ],
  })

  await logWa(params.tenantId, params.customerPhone, "APPOINTMENT_REMINDER", result.success, result.error)
}

// ─── Bekleme listesi slot açıldı bildirimi ────────────────────────────────────
// Template adı: randevya_bekleme_slot
// Parametreler: [[customer_name], [service_name], [date_time], [expire_min], [confirm_url]]

export async function sendWaWaitlistNotify(params: {
  tenantId: string
  customerName: string
  customerPhone: string
  serviceName: string
  startTime: Date
  confirmUrl: string
  expireMinutes?: number
}): Promise<void> {
  const creds = await getWaCredentials(params.tenantId)
  if (!creds) return

  const dateTime = params.startTime.toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

  const result = await sendTemplateMessage({
    phoneNumberId: creds.phoneNumberId,
    token: creds.token,
    to: params.customerPhone,
    templateName: "randevya_bekleme_slot",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: params.customerName },
          { type: "text", text: params.serviceName },
          { type: "text", text: dateTime },
          { type: "text", text: String(params.expireMinutes ?? 30) },
          { type: "text", text: params.confirmUrl },
        ],
      },
    ],
  })

  await logWa(params.tenantId, params.customerPhone, "WAITLIST_NOTIFY", result.success, result.error)
}
