import { Resend } from "resend"
import { db } from "@/lib/db"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "bildirim@randevya.com"

// ─── Email şablonları (sade HTML) ────────────────────────────────────────────

function appointmentConfirmHtml(data: {
  company_name: string
  customer_name: string
  service_name: string
  staff_name: string
  date: string
  time: string
  logo_url?: string
}) {
  return `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e3df;">
    <div style="background:#0d0d0d;padding:32px 40px;text-align:center;">
      ${data.logo_url ? `<img src="${data.logo_url}" alt="${data.company_name}" style="height:40px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">` : ""}
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">${data.company_name}</p>
    </div>
    <div style="padding:40px;">
      <h1 style="font-size:22px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Randevunuz Onaylandı ✓</h1>
      <p style="color:#555;font-size:15px;margin:0 0 28px;">Merhaba <strong>${data.customer_name}</strong>, randevunuz başarıyla oluşturuldu.</p>
      <div style="background:#f5f3ef;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Hizmet</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.service_name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Personel</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.staff_name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Tarih</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.date}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#777;font-size:13px;">Saat</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.time}</span>
        </div>
      </div>
      <p style="color:#777;font-size:13px;margin:0;">İptal etmek veya değiştirmek isterseniz lütfen bizimle iletişime geçin.</p>
    </div>
    <div style="background:#f5f3ef;padding:20px 40px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">Bu email <strong>${data.company_name}</strong> tarafından Randevya aracılığıyla gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>`
}

function appointmentCancelHtml(data: {
  company_name: string
  customer_name: string
  service_name: string
  date: string
  time: string
}) {
  return `
<!DOCTYPE html>
<html lang="tr">
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e3df;">
    <div style="background:#0d0d0d;padding:32px 40px;text-align:center;">
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">${data.company_name}</p>
    </div>
    <div style="padding:40px;">
      <h1 style="font-size:22px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Randevunuz İptal Edildi</h1>
      <p style="color:#555;font-size:15px;margin:0 0 28px;">Merhaba <strong>${data.customer_name}</strong>, aşağıdaki randevunuz iptal edildi.</p>
      <div style="background:#fff0ee;border-radius:12px;padding:20px 24px;border:1px solid #ffe0db;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Hizmet</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.service_name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Tarih</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.date}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#777;font-size:13px;">Saat</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.time}</span>
        </div>
      </div>
      <p style="color:#777;font-size:13px;margin:0;">Yeni bir randevu almak için sitemizi ziyaret edebilirsiniz.</p>
    </div>
  </div>
</body>
</html>`
}

function appointmentReminderHtml(data: {
  company_name: string
  customer_name: string
  service_name: string
  staff_name: string
  date: string
  time: string
}) {
  return `
<!DOCTYPE html>
<html lang="tr">
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e3df;">
    <div style="background:#0d0d0d;padding:32px 40px;text-align:center;">
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">${data.company_name}</p>
    </div>
    <div style="padding:40px;">
      <h1 style="font-size:22px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">⏰ Randevu Hatırlatması</h1>
      <p style="color:#555;font-size:15px;margin:0 0 28px;">Merhaba <strong>${data.customer_name}</strong>, yarın randevunuz var!</p>
      <div style="background:#f5f3ef;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Hizmet</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.service_name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Personel</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.staff_name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Tarih</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.date}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#777;font-size:13px;">Saat</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.time}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

function waitlistNotifyHtml(data: {
  company_name: string
  customer_name: string
  service_name: string
  date: string
  time: string
  confirm_url: string
  expire_minutes: number
}) {
  return `
<!DOCTYPE html>
<html lang="tr">
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e3df;">
    <div style="background:#0d0d0d;padding:32px 40px;text-align:center;">
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">${data.company_name}</p>
    </div>
    <div style="padding:40px;">
      <h1 style="font-size:22px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">🔔 Slot Açıldı!</h1>
      <p style="color:#555;font-size:15px;margin:0 0 12px;">Merhaba <strong>${data.customer_name}</strong>, bekleme listesinde olduğunuz slot açıldı.</p>
      <p style="color:#e03a20;font-size:14px;font-weight:600;margin:0 0 28px;">${data.expire_minutes} dakika içinde onaylamazsanız sıradaki kişiye geçilecek.</p>
      <div style="background:#f5f3ef;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Hizmet</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.service_name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#777;font-size:13px;">Tarih</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.date}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#777;font-size:13px;">Saat</span>
          <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${data.time}</span>
        </div>
      </div>
      <a href="${data.confirm_url}" style="display:block;background:#0d0d0d;color:#fff;text-align:center;padding:14px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;">Randevuyu Onayla →</a>
    </div>
  </div>
</body>
</html>`
}

// ─── Gönderim fonksiyonları ───────────────────────────────────────────────────

type EmailResult = { success: boolean; error?: string }

async function logNotification(
  tenantId: string,
  recipient: string,
  eventType: string,
  success: boolean,
  errorMsg?: string
) {
  await db.notificationLog.create({
    data: {
      tenant_id: tenantId,
      channel: "EMAIL",
      recipient,
      event_type: eventType,
      status: success ? "SENT" : "FAILED",
      error_msg: errorMsg ?? null,
    },
  })
}

export async function sendAppointmentConfirm(params: {
  tenantId: string
  companyName: string
  logoUrl: string | null
  customerName: string
  customerEmail: string
  serviceName: string
  staffName: string
  startTime: Date
}): Promise<EmailResult> {
  const date = params.startTime.toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })
  const time = params.startTime.toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit",
  })

  try {
    await resend.emails.send({
      from: `${params.companyName} <${FROM_EMAIL}>`,
      to: params.customerEmail,
      subject: `Randevunuz onaylandı — ${date} ${time}`,
      html: appointmentConfirmHtml({
        company_name: params.companyName,
        logo_url: params.logoUrl ?? undefined,
        customer_name: params.customerName,
        service_name: params.serviceName,
        staff_name: params.staffName,
        date,
        time,
      }),
    })
    await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_CONFIRM", true)
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata"
    await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_CONFIRM", false, msg)
    return { success: false, error: msg }
  }
}

export async function sendAppointmentCancel(params: {
  tenantId: string
  companyName: string
  customerName: string
  customerEmail: string
  serviceName: string
  startTime: Date
}): Promise<EmailResult> {
  const date = params.startTime.toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })
  const time = params.startTime.toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit",
  })

  try {
    await resend.emails.send({
      from: `${params.companyName} <${FROM_EMAIL}>`,
      to: params.customerEmail,
      subject: `Randevunuz iptal edildi`,
      html: appointmentCancelHtml({
        company_name: params.companyName,
        customer_name: params.customerName,
        service_name: params.serviceName,
        date,
        time,
      }),
    })
    await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_CANCEL", true)
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata"
    await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_CANCEL", false, msg)
    return { success: false, error: msg }
  }
}

export async function sendAppointmentReminder(params: {
  tenantId: string
  companyName: string
  customerName: string
  customerEmail: string
  serviceName: string
  staffName: string
  startTime: Date
}): Promise<EmailResult> {
  const date = params.startTime.toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })
  const time = params.startTime.toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit",
  })

  try {
    await resend.emails.send({
      from: `${params.companyName} <${FROM_EMAIL}>`,
      to: params.customerEmail,
      subject: `Hatırlatma: Yarın ${time} randevunuz var`,
      html: appointmentReminderHtml({
        company_name: params.companyName,
        customer_name: params.customerName,
        service_name: params.serviceName,
        staff_name: params.staffName,
        date,
        time,
      }),
    })
    await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_REMINDER", true)
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata"
    await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_REMINDER", false, msg)
    return { success: false, error: msg }
  }
}

export async function sendWaitlistNotify(params: {
  tenantId: string
  companyName: string
  customerName: string
  customerEmail: string
  serviceName: string
  startTime: Date
  confirmUrl: string
  expireMinutes?: number
}): Promise<EmailResult> {
  const date = params.startTime.toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })
  const time = params.startTime.toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit",
  })

  try {
    await resend.emails.send({
      from: `${params.companyName} <${FROM_EMAIL}>`,
      to: params.customerEmail,
      subject: `Bekleme listesi — Slot açıldı! (${params.expireMinutes ?? 30}dk içinde onayla)`,
      html: waitlistNotifyHtml({
        company_name: params.companyName,
        customer_name: params.customerName,
        service_name: params.serviceName,
        date,
        time,
        confirm_url: params.confirmUrl,
        expire_minutes: params.expireMinutes ?? 30,
      }),
    })
    await logNotification(params.tenantId, params.customerEmail, "WAITLIST_NOTIFY", true)
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata"
    await logNotification(params.tenantId, params.customerEmail, "WAITLIST_NOTIFY", false, msg)
    return { success: false, error: msg }
  }
}

// ─── Destek talebi bildirimleri ──────────────────────────────────────────────

/** Admin ekibine yeni destek talebi açıldığında gönderilir */
export async function sendSupportTicketOpened(params: {
  adminEmails: string[]
  tenantName: string
  tenantEmail: string
  ticketId: string
  subject: string
  firstMessage: string
}): Promise<void> {
  if (!params.adminEmails.length) return
  try {
    await resend.emails.send({
      from: `Randevya Destek <${FROM_EMAIL}>`,
      to: params.adminEmails,
      subject: `[Destek #${params.ticketId.slice(0, 8)}] ${params.subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0d0d0d;">Yeni Destek Talebi</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="color:#777;padding:6px 0;width:140px;">İşletme</td><td style="font-weight:600;">${params.tenantName}</td></tr>
            <tr><td style="color:#777;padding:6px 0;">E-posta</td><td>${params.tenantEmail}</td></tr>
            <tr><td style="color:#777;padding:6px 0;">Konu</td><td style="font-weight:600;">${params.subject}</td></tr>
          </table>
          <div style="background:#f5f3ef;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="margin:0;color:#333;white-space:pre-wrap;">${params.firstMessage}</p>
          </div>
          <a href="${process.env.NEXTAUTH_URL}/admin/support/${params.ticketId}" style="background:#0d0d0d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Talebi Görüntüle →</a>
        </div>`,
    })
  } catch (e) {
    console.error("[email] sendSupportTicketOpened hata:", e)
  }
}

/** Tenant'a admin yanıtı geldiğinde veya admin'e tenant yanıtı geldiğinde gönderilir */
export async function sendSupportTicketReply(params: {
  toEmail: string
  toName: string
  senderName: string
  ticketSubject: string
  ticketId: string
  replyContent: string
  viewUrl: string
}): Promise<void> {
  try {
    await resend.emails.send({
      from: `Randevya Destek <${FROM_EMAIL}>`,
      to: params.toEmail,
      subject: `RE: ${params.ticketSubject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0d0d0d;">Destek Talebi Yanıtı</h2>
          <p>Merhaba <strong>${params.toName}</strong>,<br><strong>${params.senderName}</strong> destek talebinize yanıt verdi.</p>
          <div style="background:#f5f3ef;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#333;white-space:pre-wrap;">${params.replyContent}</p>
          </div>
          <a href="${params.viewUrl}" style="background:#0d0d0d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Talebi Görüntüle →</a>
        </div>`,
    })
  } catch (e) {
    console.error("[email] sendSupportTicketReply hata:", e)
  }
}

// İşletmeye yeni randevu bildirimi
export async function sendBusinessNewAppointment(params: {
  tenantId: string
  companyName: string
  businessEmail: string
  customerName: string
  customerPhone: string
  serviceName: string
  staffName: string
  startTime: Date
}): Promise<EmailResult> {
  const date = params.startTime.toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })
  const time = params.startTime.toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit",
  })

  try {
    await resend.emails.send({
      from: `Randevya <${FROM_EMAIL}>`,
      to: params.businessEmail,
      subject: `Yeni randevu: ${params.customerName} — ${date} ${time}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;">
          <h2>Yeni Randevu 🗓️</h2>
          <p><strong>Müşteri:</strong> ${params.customerName}</p>
          <p><strong>Telefon:</strong> ${params.customerPhone}</p>
          <p><strong>Hizmet:</strong> ${params.serviceName}</p>
          <p><strong>Personel:</strong> ${params.staffName}</p>
          <p><strong>Tarih/Saat:</strong> ${date} ${time}</p>
        </div>
      `,
    })
    await logNotification(params.tenantId, params.businessEmail, "BUSINESS_NEW_APPOINTMENT", true)
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata"
    await logNotification(params.tenantId, params.businessEmail, "BUSINESS_NEW_APPOINTMENT", false, msg)
    return { success: false, error: msg }
  }
}
