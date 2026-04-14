import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import { db } from "@/lib/db"

// ─── Transporter (önce DB, yoksa .env fallback) ────────────────────────────

let _transporter: Transporter | null = null
let _transporterTs = 0

async function getTransporter(): Promise<Transporter> {
  // 5 dakikada bir yeniden oluştur (DB ayarı değişmiş olabilir)
  if (_transporter && Date.now() - _transporterTs < 5 * 60 * 1000) return _transporter

  // DB'den config çek
  let config: { smtp_host: string; smtp_port: number; smtp_secure: boolean; smtp_user: string; smtp_pass: string; from_email: string; from_name: string } | null = null
  try {
    const dbConfig = await db.emailConfig.findFirst({ where: { is_active: true } })
    if (dbConfig) {
      config = {
        smtp_host: dbConfig.smtp_host,
        smtp_port: dbConfig.smtp_port,
        smtp_secure: dbConfig.smtp_secure,
        smtp_user: dbConfig.smtp_user,
        smtp_pass: dbConfig.smtp_pass,
        from_email: dbConfig.from_email,
        from_name: dbConfig.from_name,
      }
    }
  } catch { /* DB yoksa env fallback */ }

  // .env fallback
  if (!config) {
    config = {
      smtp_host: process.env.SMTP_HOST ?? "mail.kurumsaleposta.com",
      smtp_port: parseInt(process.env.SMTP_PORT ?? "465"),
      smtp_secure: process.env.SMTP_SECURE !== "false",
      smtp_user: process.env.SMTP_USER ?? "",
      smtp_pass: process.env.SMTP_PASS ?? "",
      from_email: process.env.SMTP_FROM_EMAIL ?? "noreply@randevya.com",
      from_name: process.env.SMTP_FROM_NAME ?? "Randevya",
    }
  }

  _transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: false,
    auth: { user: config.smtp_user, pass: config.smtp_pass },
    tls: { rejectUnauthorized: false },
    ...(config.smtp_port === 587 ? { requireTLS: true } : {}),
  })

  _transporterTs = Date.now()
  return _transporter
}

async function getFromAddress(): Promise<string> {
  try {
    const dbConfig = await db.emailConfig.findFirst({ where: { is_active: true }, select: { from_email: true, from_name: true } })
    if (dbConfig) return `${dbConfig.from_name} <${dbConfig.from_email}>`
  } catch { /* fallback */ }
  return `${process.env.SMTP_FROM_NAME ?? "Randevya"} <${process.env.SMTP_FROM_EMAIL ?? "noreply@randevya.com"}>`
}

// Transporter cache sıfırla (ayar değiştiğinde)
export function resetTransporter() { _transporter = null; _transporterTs = 0 }

// ─── Merkezi mail gönderim ──────────────────────────────────────────────────

type EmailResult = { success: boolean; error?: string }

async function sendMail(to: string, subject: string, html: string, fromOverride?: string): Promise<EmailResult> {
  try {
    const transporter = await getTransporter()
    const from = fromOverride ?? await getFromAddress()
    await transporter.sendMail({ from, to, subject, html })
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "E-posta gönderilemedi"
    console.error("[Email] Gönderim hatası:", msg)
    return { success: false, error: msg }
  }
}

// ─── Bildirim loglama ───────────────────────────────────────────────────────

async function logNotification(tenantId: string, recipient: string, eventType: string, success: boolean, errorMsg?: string) {
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

// ─── Template yardımcıları ──────────────────────────────────────────────────

function baseTemplate(content: string, headerTitle?: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e3df;">
    <div style="background:#0d0d0d;padding:28px 40px;text-align:center;">
      <h1 style="color:#fff;font-size:18px;margin:0;font-weight:600;">${headerTitle ?? "Randevya"}</h1>
    </div>
    <div style="padding:36px 40px;">
      ${content}
    </div>
    <div style="background:#f5f3ef;padding:18px 40px;text-align:center;">
      <p style="color:#aaa;font-size:11px;margin:0;">Bu e-posta Randevya tarafından gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>`
}

function infoRow(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
    <span style="color:#777;font-size:13px;">${label}</span>
    <span style="color:#0d0d0d;font-size:13px;font-weight:600;">${value}</span>
  </div>`
}

function ctaButton(text: string, url: string, color = "#0d0d0d"): string {
  return `<div style="text-align:center;margin-top:24px;">
    <a href="${url}" style="display:inline-block;background:${color};color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;" target="_blank">${text}</a>
  </div>`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
}

// ─── Randevu E-postaları ────────────────────────────────────────────────────

export async function sendAppointmentConfirm(params: {
  tenantId: string; companyName: string; logoUrl: string | null
  customerName: string; customerEmail: string; serviceName: string
  staffName: string; startTime: Date; isWhiteLabel?: boolean
}): Promise<EmailResult> {
  const date = formatDate(params.startTime)
  const time = formatTime(params.startTime)

  const logoHtml = params.logoUrl
    ? `<img src="${params.logoUrl}" alt="${params.companyName}" style="height:36px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;">`
    : ""

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e3df;">
    <div style="background:#0d0d0d;padding:28px 40px;text-align:center;">
      ${logoHtml}
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">${params.companyName}</p>
    </div>
    <div style="padding:36px 40px;">
      <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Randevunuz Onaylandı</h1>
      <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.customerName}</strong>, randevunuz oluşturuldu.</p>
      <div style="background:#f5f3ef;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
        ${infoRow("Hizmet", params.serviceName)}
        ${infoRow("Personel", params.staffName)}
        ${infoRow("Tarih", date)}
        ${infoRow("Saat", time)}
      </div>
      <p style="color:#777;font-size:12px;margin:0;">Sorularınız için lütfen bizimle iletişime geçin.</p>
    </div>
    <div style="background:#f5f3ef;padding:18px 40px;text-align:center;">
      <p style="color:#aaa;font-size:11px;margin:0;">${params.companyName} tarafından${params.isWhiteLabel ? "" : " Randevya aracılığıyla"} gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>`

  const from = `${params.companyName} <${process.env.SMTP_FROM_EMAIL ?? "noreply@randevya.com"}>`
  const result = await sendMail(params.customerEmail, `Randevunuz onaylandı — ${date} ${time}`, html, from)
  await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_CONFIRM", result.success, result.error)
  return result
}

export async function sendAppointmentCancel(params: {
  tenantId: string; companyName: string; customerName: string
  customerEmail: string; serviceName: string; startTime: Date
}): Promise<EmailResult> {
  const date = formatDate(params.startTime)
  const time = formatTime(params.startTime)

  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Randevunuz İptal Edildi</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.customerName}</strong>, randevunuz iptal edilmiştir.</p>
    <div style="background:#fff0ee;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      ${infoRow("Hizmet", params.serviceName)}
      ${infoRow("Tarih", date)}
      ${infoRow("Saat", time)}
    </div>
    <p style="color:#777;font-size:12px;margin:0;">Yeni randevu almak için lütfen bizimle iletişime geçin.</p>`

  const from = `${params.companyName} <${process.env.SMTP_FROM_EMAIL ?? "noreply@randevya.com"}>`
  const result = await sendMail(params.customerEmail, "Randevunuz iptal edildi", baseTemplate(content, params.companyName), from)
  await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_CANCEL", result.success, result.error)
  return result
}

export async function sendAppointmentReminder(params: {
  tenantId: string; companyName: string; customerName: string
  customerEmail: string; serviceName: string; staffName: string; startTime: Date
}): Promise<EmailResult> {
  const date = formatDate(params.startTime)
  const time = formatTime(params.startTime)

  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Randevu Hatırlatma</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.customerName}</strong>, yarın randevunuz var.</p>
    <div style="background:#f5f3ef;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      ${infoRow("Hizmet", params.serviceName)}
      ${infoRow("Personel", params.staffName)}
      ${infoRow("Tarih", date)}
      ${infoRow("Saat", time)}
    </div>`

  const from = `${params.companyName} <${process.env.SMTP_FROM_EMAIL ?? "noreply@randevya.com"}>`
  const result = await sendMail(params.customerEmail, `Hatırlatma: Yarın ${time} randevunuz var`, baseTemplate(content, params.companyName), from)
  await logNotification(params.tenantId, params.customerEmail, "APPOINTMENT_REMINDER", result.success, result.error)
  return result
}

export async function sendWaitlistNotify(params: {
  tenantId: string; companyName: string; customerName: string
  customerEmail: string; serviceName: string; startTime: Date
  confirmUrl: string; expireMinutes?: number
}): Promise<EmailResult> {
  const date = formatDate(params.startTime)
  const time = formatTime(params.startTime)
  const mins = params.expireMinutes ?? 30

  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Bekleme Listesi — Slot Açıldı!</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.customerName}</strong>, beklediğiniz randevu slotu açıldı.</p>
    <div style="background:#f5f3ef;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      ${infoRow("Hizmet", params.serviceName)}
      ${infoRow("Tarih", date)}
      ${infoRow("Saat", time)}
    </div>
    <p style="color:#d32f2f;font-size:13px;font-weight:600;text-align:center;">Bu slotu ${mins} dakika içinde onaylamanız gerekmektedir.</p>
    ${ctaButton("Randevuyu Onayla", params.confirmUrl, "#2a5cff")}`

  const from = `${params.companyName} <${process.env.SMTP_FROM_EMAIL ?? "noreply@randevya.com"}>`
  const result = await sendMail(params.customerEmail, `Bekleme listesi — Slot açıldı! (${mins}dk)`, baseTemplate(content, params.companyName), from)
  await logNotification(params.tenantId, params.customerEmail, "WAITLIST_NOTIFY", result.success, result.error)
  return result
}

// ─── Destek E-postaları ─────────────────────────────────────────────────────

export async function sendSupportTicketOpened(params: {
  adminEmails: string[]; tenantName: string; tenantEmail: string
  ticketId: string; subject: string; firstMessage: string
}): Promise<void> {
  if (!params.adminEmails.length) return
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 16px;">Yeni Destek Talebi</h1>
    <div style="background:#f5f3ef;border-radius:12px;padding:18px 22px;margin-bottom:16px;">
      ${infoRow("İşletme", params.tenantName)}
      ${infoRow("E-posta", params.tenantEmail)}
      ${infoRow("Konu", params.subject)}
    </div>
    <div style="background:#f5f3ef;border-radius:12px;padding:16px 22px;margin-bottom:16px;">
      <p style="margin:0;color:#333;font-size:13px;white-space:pre-wrap;">${params.firstMessage}</p>
    </div>
    ${ctaButton("Talebi Görüntüle", `${process.env.NEXTAUTH_URL}/admin/support/${params.ticketId}`)}`

  for (const email of params.adminEmails) {
    await sendMail(email, `[Destek #${params.ticketId.slice(0, 8)}] ${params.subject}`, baseTemplate(content, "Randevya Destek")).catch(() => {})
  }
}

export async function sendSupportTicketReply(params: {
  toEmail: string; toName: string; senderName: string
  ticketSubject: string; ticketId: string; replyContent: string; viewUrl: string
}): Promise<void> {
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Destek Talebi Yanıtı</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.toName}</strong>, <strong>${params.senderName}</strong> talebinize yanıt verdi.</p>
    <div style="background:#f5f3ef;border-radius:12px;padding:16px 22px;margin-bottom:16px;">
      <p style="margin:0;color:#333;font-size:13px;white-space:pre-wrap;">${params.replyContent}</p>
    </div>
    ${ctaButton("Talebi Görüntüle", params.viewUrl)}`

  await sendMail(params.toEmail, `RE: ${params.ticketSubject}`, baseTemplate(content, "Randevya Destek")).catch(() => {})
}

// ─── Ödeme & Fatura E-postaları ─────────────────────────────────────────────

export async function sendPaymentConfirmation(params: {
  tenantId: string; tenantEmail: string; tenantName: string
  planName: string; totalAmount: string; billingPeriod: "MONTHLY" | "YEARLY"
  nextRenewalDate: string
}): Promise<EmailResult> {
  const periodLabel = params.billingPeriod === "YEARLY" ? "Yıllık" : "Aylık"
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Ödemeniz Alındı</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.tenantName}</strong>, ödemeniz başarıyla işlendi.</p>
    <div style="background:#f5f3ef;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      ${infoRow("Plan", params.planName)}
      ${infoRow("Dönem", periodLabel)}
      ${infoRow("Toplam Tutar", `${params.totalAmount} ₺`)}
      ${infoRow("Sonraki Yenileme", params.nextRenewalDate)}
    </div>
    ${ctaButton("Panele Git", `${process.env.NEXTAUTH_URL}/panel`)}`

  const result = await sendMail(params.tenantEmail, `Ödemeniz alındı — ${params.planName} (${periodLabel})`, baseTemplate(content))
  await logNotification(params.tenantId, params.tenantEmail, "PAYMENT_CONFIRMATION", result.success, result.error)
  return result
}

export async function sendInvoiceEmail(params: {
  tenantId: string; tenantEmail: string; tenantName: string
  invoiceNumber: string; totalAmount: string; planName: string
  billingPeriod: "MONTHLY" | "YEARLY"; pdfUrl: string
}): Promise<EmailResult> {
  const periodLabel = params.billingPeriod === "YEARLY" ? "Yıllık" : "Aylık"
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Faturanız Hazır</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.tenantName}</strong>, faturanız oluşturulmuştur.</p>
    <div style="background:#f5f3ef;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      ${infoRow("Fatura No", params.invoiceNumber)}
      ${infoRow("Plan", `${params.planName} (${periodLabel})`)}
      ${infoRow("Toplam Tutar", `${params.totalAmount} ₺`)}
    </div>
    ${ctaButton("Faturayı Görüntüle", params.pdfUrl)}`

  const result = await sendMail(params.tenantEmail, `Faturanız hazır — ${params.invoiceNumber}`, baseTemplate(content))
  await logNotification(params.tenantId, params.tenantEmail, "INVOICE_SENT", result.success, result.error)
  return result
}

// ─── İşletme Bildirimleri ───────────────────────────────────────────────────

export async function sendBusinessNewAppointment(params: {
  tenantId: string; companyName: string; businessEmail: string
  customerName: string; customerPhone: string; serviceName: string
  staffName: string; startTime: Date
}): Promise<EmailResult> {
  const date = formatDate(params.startTime)
  const time = formatTime(params.startTime)

  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 16px;">Yeni Randevu</h1>
    <div style="background:#f5f3ef;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      ${infoRow("Müşteri", params.customerName)}
      ${infoRow("Telefon", params.customerPhone)}
      ${infoRow("Hizmet", params.serviceName)}
      ${infoRow("Personel", params.staffName)}
      ${infoRow("Tarih", date)}
      ${infoRow("Saat", time)}
    </div>`

  const result = await sendMail(params.businessEmail, `Yeni randevu: ${params.customerName} — ${date} ${time}`, baseTemplate(content, params.companyName))
  await logNotification(params.tenantId, params.businessEmail, "BUSINESS_NEW_APPOINTMENT", result.success, result.error)
  return result
}

// ─── Yeni: Hoşgeldin E-postası ──────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  tenantId: string; tenantEmail: string; tenantName: string; companyName: string
}): Promise<EmailResult> {
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Randevya'ya Hoş Geldiniz!</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.tenantName}</strong>, <strong>${params.companyName}</strong> işletmeniz başarıyla oluşturuldu.</p>
    <div style="background:#f0f7ff;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      ${infoRow("Deneme Süresi", "14 gün (ücretsiz)")}
      ${infoRow("Plan", "Başlangıç")}
    </div>
    <p style="color:#555;font-size:13px;margin:0 0 16px;">14 günlük ücretsiz deneme süreniz başlamıştır. Bu sürede tüm temel özellikleri kullanabilirsiniz.</p>
    ${ctaButton("Panele Git", `${process.env.NEXTAUTH_URL}/panel`, "#2a5cff")}`

  const result = await sendMail(params.tenantEmail, `Randevya'ya hoş geldiniz — ${params.companyName}`, baseTemplate(content))
  await logNotification(params.tenantId, params.tenantEmail, "WELCOME", result.success, result.error)
  return result
}

// ─── Yeni: Abonelik Süresi Doldu ────────────────────────────────────────────

export async function sendSubscriptionExpiredEmail(params: {
  tenantId: string; tenantEmail: string; tenantName: string; planName: string
}): Promise<EmailResult> {
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Aboneliğiniz Sona Erdi</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Merhaba <strong>${params.tenantName}</strong>, <strong>${params.planName}</strong> aboneliğinizin süresi dolmuştur.</p>
    <div style="background:#fff0ee;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      <p style="margin:0;color:#d32f2f;font-size:13px;">Panel erişiminiz kısıtlanmıştır. Devam etmek için lütfen yeni bir paket satın alın.</p>
    </div>
    <p style="color:#555;font-size:13px;margin:0 0 16px;">Verileriniz güvende tutulmaktadır. Yeni paket aldığınızda kaldığınız yerden devam edebilirsiniz.</p>
    ${ctaButton("Paket Satın Al", `${process.env.NEXTAUTH_URL}/panel/ayarlar`, "#2a5cff")}`

  const result = await sendMail(params.tenantEmail, "Aboneliğiniz sona erdi — Randevya", baseTemplate(content))
  await logNotification(params.tenantId, params.tenantEmail, "SUBSCRIPTION_EXPIRED", result.success, result.error)
  return result
}

// ─── Yeni: Admin'e Yeni Satın Alma Bildirimi ────────────────────────────────

export async function sendAdminNewPurchaseNotify(params: {
  adminEmails: string[]; tenantName: string; tenantEmail: string
  planName: string; billingPeriod: "MONTHLY" | "YEARLY"
  totalAmount: string
}): Promise<void> {
  if (!params.adminEmails.length) return
  const periodLabel = params.billingPeriod === "YEARLY" ? "Yıllık" : "Aylık"

  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 16px;">Yeni Paket Satın Alındı</h1>
    <div style="background:#f0fdf4;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      ${infoRow("İşletme", params.tenantName)}
      ${infoRow("E-posta", params.tenantEmail)}
      ${infoRow("Plan", params.planName)}
      ${infoRow("Dönem", periodLabel)}
      ${infoRow("Tutar", `${params.totalAmount} ₺`)}
      ${infoRow("Tarih", formatDate(new Date()))}
    </div>
    ${ctaButton("Ödemeleri Görüntüle", `${process.env.NEXTAUTH_URL}/admin/odemeler`)}`

  for (const email of params.adminEmails) {
    await sendMail(email, `Yeni satın alma: ${params.tenantName} — ${params.planName} (${periodLabel})`, baseTemplate(content, "Randevya Admin")).catch(() => {})
  }
}

// ─── Yeni: Şifre Sıfırlama ─────────────────────────────────────────────────

export async function sendPasswordResetEmail(params: {
  email: string; resetUrl: string
}): Promise<EmailResult> {
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#0d0d0d;margin:0 0 8px;">Şifre Sıfırlama</h1>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.</p>
    <p style="color:#777;font-size:12px;margin:0 0 8px;">Bu linkin geçerlilik süresi 1 saattir.</p>
    ${ctaButton("Şifremi Sıfırla", params.resetUrl, "#2a5cff")}
    <p style="color:#999;font-size:11px;margin-top:24px;">Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>`

  return sendMail(params.email, "Şifre sıfırlama — Randevya", baseTemplate(content))
}
