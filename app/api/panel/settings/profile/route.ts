import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// PATCH /api/panel/settings/profile — profil ve şifre güncelleme
// Body: { owner_name?, owner_email?, current_password?, new_password? }
async function patchHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const body = await req.json().catch(() => null) as {
    owner_name?: string
    owner_email?: string
    current_password?: string
    new_password?: string
  } | null

  if (!body) return err("Geçersiz JSON")

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { owner_email: true, password_hash: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  const updateData: Record<string, string> = {}

  // İsim güncelleme
  if (body.owner_name !== undefined) {
    if (!body.owner_name.trim()) return err("owner_name boş olamaz")
    updateData.owner_name = body.owner_name.trim()
  }

  // Email güncelleme
  if (body.owner_email !== undefined) {
    const emailClean = body.owner_email.toLowerCase().trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) return err("Geçersiz email adresi")

    // Başka bir tenant aynı email'i kullanıyor mu?
    const emailTaken = await db.tenant.findFirst({
      where: { owner_email: emailClean, id: { not: tenantId } },
    })
    if (emailTaken) return err("Bu email adresi zaten kullanımda", 409)

    updateData.owner_email = emailClean
  }

  // Şifre güncelleme
  if (body.new_password !== undefined) {
    if (!body.current_password) return err("Mevcut şifre gerekli")
    if (body.new_password.length < 8) return err("Yeni şifre en az 8 karakter olmalı")

    const valid = await bcrypt.compare(body.current_password, tenant.password_hash)
    if (!valid) return err("Mevcut şifre hatalı", 401)

    updateData.password_hash = await bcrypt.hash(body.new_password, 10)
  }

  if (Object.keys(updateData).length === 0) return err("Güncellenecek alan yok")

  await db.tenant.update({ where: { id: tenantId }, data: updateData })

  return ok({ updated: true })
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/panel/settings/profile")

// GET /api/panel/settings/profile — mevcut profil bilgileri
async function getHandler() {
  const session = await getServerSession(authOptions)
  if (!session) return err("Giriş gerekli", 401)

  // Admin kullanıcı
  if (session.user.role === "PLATFORM_ADMIN") {
    return ok({
      owner_name: session.user.name ?? "",
      owner_email: session.user.email ?? "",
      company_name: "Platform Admin",
      sector: "Yönetim",
    })
  }

  // Tenant kullanıcı
  if (session.user.role !== "TENANT_OWNER") return err("Yetkisiz", 403)

  const tenant = await db.tenant.findUnique({
    where: { id: session.user.tenant_id },
    select: { owner_name: true, owner_email: true, company_name: true, sector: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  return ok(tenant)
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/settings/profile")
