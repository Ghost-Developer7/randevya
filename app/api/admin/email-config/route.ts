import { NextRequest } from "next/server"
import { ok, err, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { resetTransporter } from "@/lib/email"

// GET /api/admin/email-config — mevcut SMTP ayarlarını getir
async function getHandler() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const config = await db.emailConfig.findFirst({ where: { is_active: true } })

  if (!config) {
    // .env'den fallback göster
    return ok({
      config: {
        smtp_host: process.env.SMTP_HOST ?? "",
        smtp_port: parseInt(process.env.SMTP_PORT ?? "465"),
        smtp_secure: process.env.SMTP_SECURE !== "false",
        smtp_user: process.env.SMTP_USER ?? "",
        smtp_pass: "********", // şifreyi maskeliyoruz
        from_email: process.env.SMTP_FROM_EMAIL ?? "",
        from_name: process.env.SMTP_FROM_NAME ?? "",
        source: "env",
      },
    })
  }

  return ok({
    config: {
      id: config.id,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_secure: config.smtp_secure,
      smtp_user: config.smtp_user,
      smtp_pass: "********",
      from_email: config.from_email,
      from_name: config.from_name,
      source: "db",
    },
  })
}

// PATCH /api/admin/email-config — SMTP ayarlarını güncelle
async function patchHandler(req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz istek gövdesi")

  const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_email, from_name } = body

  if (!smtp_host || !smtp_port || !smtp_user || !from_email || !from_name) {
    return err("Tüm alanlar zorunludur")
  }

  // Mevcut config var mı?
  const existing = await db.emailConfig.findFirst({ where: { is_active: true } })

  const data = {
    smtp_host,
    smtp_port: parseInt(smtp_port),
    smtp_secure: smtp_secure !== false,
    smtp_user,
    smtp_pass: smtp_pass === "********" ? (existing?.smtp_pass ?? process.env.SMTP_PASS ?? "") : smtp_pass,
    from_email,
    from_name,
    is_active: true,
  }

  if (existing) {
    await db.emailConfig.update({ where: { id: existing.id }, data })
  } else {
    await db.emailConfig.create({ data })
  }

  // Transporter cache sıfırla
  resetTransporter()

  return ok({ saved: true })
}

export const GET = withErrorHandler(getHandler as never, "GET /api/admin/email-config")
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/admin/email-config")
