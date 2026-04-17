import { NextRequest } from "next/server"
import { ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { redis } from "@/lib/redis"
import bcrypt from "bcryptjs"

// POST /api/auth/reset-password — şifre sıfırlama (token + yeni şifre)
async function postHandler(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { token, password } = body ?? {}

  if (!token) return err("Token zorunlu")
  if (!password || password.length < 8) return err("Şifre en az 8 karakter olmalı")

  // Token doğrula
  const resetToken = await db.passwordResetToken.findUnique({ where: { token } })

  if (!resetToken) return err("Geçersiz veya süresi dolmuş bağlantı", 400)
  if (resetToken.used) return err("Bu bağlantı daha önce kullanılmış", 400)
  if (resetToken.expires_at < new Date()) return err("Bağlantının süresi dolmuş. Lütfen yeni bir talep oluşturun.", 400)

  const passwordHash = await bcrypt.hash(password, 10)

  // Tenant mı admin mi?
  const tenant = await db.tenant.findFirst({ where: { owner_email: resetToken.email, is_active: true } })
  const admin = await db.adminUser.findFirst({ where: { email: resetToken.email, is_active: true } })

  if (tenant) {
    await db.tenant.update({ where: { id: tenant.id }, data: { password_hash: passwordHash } })
  } else if (admin) {
    await db.adminUser.update({ where: { id: admin.id }, data: { password_hash: passwordHash } })
  } else {
    return err("Bu e-posta adresine ait hesap bulunamadı", 404)
  }

  // Token'ı kullanıldı olarak işaretle + aynı email için kalan pending tokenleri da kapat
  await db.passwordResetToken.update({ where: { token }, data: { used: true } })
  await db.passwordResetToken.updateMany({
    where: { email: resetToken.email, used: false, token: { not: token } },
    data: { used: true },
  })

  // Login rate-limit sayacını sıfırla — aksi halde kullanıcı eski yanlış denemeler yüzünden
  // yeni şifreyle de 15 dk boyunca giriş yapamaz. Redis hatası reset'i başarısız saymasın.
  try {
    await redis.del(`rl:login:${resetToken.email}`)
  } catch (e) {
    console.error("[reset-password] rate-limit temizleme hatası:", e)
  }

  return ok({ reset: true, message: "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz." })
}

export const POST = withErrorHandler(postHandler, "POST /api/auth/reset-password")
