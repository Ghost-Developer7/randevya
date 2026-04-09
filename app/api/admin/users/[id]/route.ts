import { NextRequest } from "next/server"
import { ok, err, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { AdminRole } from "@/lib/auth"

const VALID_ROLES: AdminRole[] = ["SUPER_ADMIN", "SUPPORT", "BILLING", "VIEWER"]

// PATCH /api/admin/users/[id] — güncelle (SUPER_ADMIN'e özel)
async function patchHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params

  // Kendini düzenleyemez (rol değişikliği)
  if (session!.user.id === id) return err("Kendi hesabınızın rolünü değiştiremezsiniz")

  const body = await req.json().catch(() => null) as {
    full_name?: string
    role?: AdminRole
    is_active?: boolean
    new_password?: string
  } | null

  if (!body) return err("Geçersiz JSON")

  const user = await db.adminUser.findUnique({ where: { id } })
  if (!user) return err("Kullanıcı bulunamadı", 404)

  const updateData: Record<string, unknown> = {}

  if (body.full_name !== undefined) {
    if (!body.full_name.trim()) return err("full_name boş olamaz")
    updateData.full_name = body.full_name.trim()
  }

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) return err("Geçersiz rol")
    updateData.role = body.role
  }

  if (body.is_active !== undefined) {
    updateData.is_active = body.is_active
  }

  if (body.new_password !== undefined) {
    if (body.new_password.length < 8) return err("Şifre en az 8 karakter olmalı")
    updateData.password_hash = await bcrypt.hash(body.new_password, 10)
  }

  if (Object.keys(updateData).length === 0) return err("Güncellenecek alan yok")

  const updated = await db.adminUser.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, full_name: true, role: true, is_active: true, updated_at: true },
  })

  return ok(updated)
}

export const PATCH = withErrorHandler(patchHandler, "PATCH /api/admin/users/[id]")

// DELETE /api/admin/users/[id] — pasife al (hard delete yok)
async function deleteHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params

  if (session!.user.id === id) return err("Kendi hesabınızı silemezsiniz")

  const user = await db.adminUser.findUnique({ where: { id } })
  if (!user) return err("Kullanıcı bulunamadı", 404)

  await db.adminUser.update({ where: { id }, data: { is_active: false } })

  return ok({ deactivated: true })
}

export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/admin/users/[id]")
