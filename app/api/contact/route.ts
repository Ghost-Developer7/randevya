import { NextRequest } from "next/server"
import { ok, err, withErrorHandler } from "@/lib/api-helpers"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"
import nodemailer from "nodemailer"
import { db } from "@/lib/db"

// POST /api/contact — iletişim formu (herkese açık)
async function postHandler(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz istek gövdesi")

  const { name, email, subject, message, turnstileToken } = body

  if (!name?.trim()) return err("Ad soyad zorunlu")
  if (!email?.trim()) return err("E-posta adresi zorunlu")
  if (!subject?.trim()) return err("Konu zorunlu")
  if (!message?.trim()) return err("Mesaj zorunlu")
  if (message.length > 5000) return err("Mesaj çok uzun (maks. 5000 karakter)")

  // Turnstile doğrulama
  if (turnstileToken) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? undefined
    const valid = await verifyTurnstile(turnstileToken, ip)
    if (!valid) return err("CAPTCHA doğrulaması başarısız. Lütfen tekrar deneyin.", 400)
  }

  // SMTP ayarlarını al (DB veya env)
  let smtpConfig: { host: string; port: number; secure: boolean; user: string; pass: string; fromEmail: string; fromName: string }
  try {
    const dbConfig = await db.emailConfig.findFirst({ where: { is_active: true } })
    if (dbConfig) {
      smtpConfig = {
        host: dbConfig.smtp_host, port: dbConfig.smtp_port, secure: dbConfig.smtp_secure,
        user: dbConfig.smtp_user, pass: dbConfig.smtp_pass,
        fromEmail: dbConfig.from_email, fromName: dbConfig.from_name,
      }
    } else {
      smtpConfig = {
        host: process.env.SMTP_HOST ?? "mail.kurumsaleposta.com",
        port: parseInt(process.env.SMTP_PORT ?? "465"),
        secure: process.env.SMTP_SECURE !== "false",
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
        fromEmail: process.env.SMTP_FROM_EMAIL ?? "noreply@randevya.com",
        fromName: process.env.SMTP_FROM_NAME ?? "Randevya",
      }
    }
  } catch {
    smtpConfig = {
      host: process.env.SMTP_HOST ?? "mail.kurumsaleposta.com",
      port: parseInt(process.env.SMTP_PORT ?? "465"),
      secure: process.env.SMTP_SECURE !== "false",
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
      fromEmail: process.env.SMTP_FROM_EMAIL ?? "noreply@randevya.com",
      fromName: process.env.SMTP_FROM_NAME ?? "Randevya",
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass },
      tls: { rejectUnauthorized: false },
    })

    const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })

    await transporter.sendMail({
      from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
      to: "info@randevya.com",
      replyTo: email.trim(),
      subject: `[İletişim Formu] ${subject.trim()}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0d0d0d;margin-bottom:20px;">Yeni İletişim Formu Mesajı</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="color:#777;padding:8px 0;width:120px;vertical-align:top;">Ad Soyad</td><td style="font-weight:600;padding:8px 0;">${name.trim()}</td></tr>
            <tr><td style="color:#777;padding:8px 0;">E-posta</td><td style="padding:8px 0;"><a href="mailto:${email.trim()}">${email.trim()}</a></td></tr>
            <tr><td style="color:#777;padding:8px 0;">Konu</td><td style="font-weight:600;padding:8px 0;">${subject.trim()}</td></tr>
            <tr><td style="color:#777;padding:8px 0;">Tarih</td><td style="padding:8px 0;">${now}</td></tr>
          </table>
          <div style="background:#f5f3ef;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="margin:0;color:#333;white-space:pre-wrap;font-size:14px;">${message.trim()}</p>
          </div>
          <p style="color:#aaa;font-size:11px;">Bu mesaj randevya.com iletişim formundan gönderilmiştir.</p>
        </div>`,
    })

    return ok({ sent: true, message: "Mesajınız başarıyla gönderildi. En kısa sürede dönüş yapacağız." })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "E-posta gönderimi başarısız"
    console.error("[Contact] Mail gönderim hatası:", msg)
    return err("Mesajınız gönderilemedi. Lütfen daha sonra tekrar deneyin.", 500)
  }
}

const handlerWithError = withErrorHandler(postHandler, "POST /api/contact")
export const POST = withRateLimit(handlerWithError, "rl:contact", RATE_LIMITS.authLogin)
