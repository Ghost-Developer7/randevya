import { NextRequest } from "next/server"
import { ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import crypto from "crypto"

// POST /api/auth/forgot-password — şifre sıfırlama talebi
async function postHandler(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = body?.email?.trim().toLowerCase()

  if (!email) return err("E-posta adresi zorunlu")

  // Tenant veya admin kullanıcı var mı kontrol et (bilgi sızdırmadan)
  const tenant = await db.tenant.findFirst({ where: { owner_email: email } })
  const admin = await db.adminUser.findFirst({ where: { email, is_active: true } })

  // Kullanıcı bulunamazsa bile başarılı dönüyoruz (email enumeration koruması)
  if (!tenant && !admin) {
    return ok({ sent: true, message: "Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderilmiştir." })
  }

  // Mevcut kullanılmamış token varsa geçersiz kıl
  await db.passwordResetToken.updateMany({
    where: { email, used: false, expires_at: { gt: new Date() } },
    data: { used: true },
  })

  // Yeni token oluştur (32 byte = 64 hex karakter)
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // 1 saat geçerli

  await db.passwordResetToken.create({
    data: { email, token, expires_at: expiresAt },
  })

  // Sıfırlama linki gönder
  const resetUrl = `${process.env.NEXTAUTH_URL}/panel/sifre-sifirla?token=${token}`
  await sendPasswordResetEmail({ email, resetUrl })

  return ok({ sent: true, message: "Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderilmiştir." })
}

const handlerWithError = withErrorHandler(postHandler, "POST /api/auth/forgot-password")
export const POST = withRateLimit(handlerWithError, "rl:forgot-password", RATE_LIMITS.authLogin)
