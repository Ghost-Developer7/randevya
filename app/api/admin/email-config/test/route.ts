import { NextRequest } from "next/server"
import { ok, err, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import nodemailer from "nodemailer"
import { db } from "@/lib/db"

// POST /api/admin/email-config/test — test maili gönder
async function postHandler(req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const session = await getServerSession(authOptions)
  const adminEmail = session?.user?.email
  if (!adminEmail) return err("Admin e-posta bulunamadı")

  const body = await req.json().catch(() => null)
  const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_email, from_name } = body ?? {}

  // Şifre maskeliyse DB/env'den çek
  let password = smtp_pass
  if (password === "********") {
    const dbConfig = await db.emailConfig.findFirst({ where: { is_active: true } })
    password = dbConfig?.smtp_pass ?? process.env.SMTP_PASS ?? ""
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: parseInt(smtp_port),
      secure: smtp_secure !== false,
      auth: { user: smtp_user, pass: password },
      tls: { rejectUnauthorized: false },
    })

    await transporter.sendMail({
      from: `${from_name} <${from_email}>`,
      to: adminEmail,
      subject: "Randevya — SMTP Test E-postası",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#0d0d0d;">SMTP Test Başarılı</h2>
          <p>Bu e-posta Randevya admin panelinden gönderilmiştir.</p>
          <p style="color:#777;font-size:13px;">SMTP: ${smtp_host}:${smtp_port} (${smtp_secure !== false ? "SSL" : "TLS"})</p>
          <p style="color:#777;font-size:13px;">Gönderen: ${from_name} &lt;${from_email}&gt;</p>
          <p style="color:#777;font-size:13px;">Tarih: ${new Date().toLocaleString("tr-TR")}</p>
        </div>`,
    })

    return ok({ sent: true, to: adminEmail })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "SMTP bağlantı hatası"
    return err(`Test başarısız: ${msg}`, 502)
  }
}

export const POST = withErrorHandler(postHandler, "POST /api/admin/email-config/test")
