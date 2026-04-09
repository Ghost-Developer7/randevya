import { NextRequest } from "next/server"
import { ok, err, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { AdminRole } from "@/lib/auth"

const VALID_ROLES: AdminRole[] = ["SUPER_ADMIN", "SUPPORT", "BILLING", "VIEWER"]

// GET /api/admin/users — admin kullanıcılarını listele
async function getHandler() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const users = await db.adminUser.findMany({
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      is_active: true,
      last_login_at: true,
      created_at: true,
    },
    orderBy: { created_at: "asc" },
  })

  return ok({ users })
}

export const GET = withErrorHandler(getHandler, "GET /api/admin/users")

// POST /api/admin/users — yeni admin kullanıcı oluştur (SUPER_ADMIN'e özel)
async function postHandler(req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await req.json().catch(() => null) as {
    email?: string
    password?: string
    full_name?: string
    role?: AdminRole
  } | null

  if (!body) return err("Geçersiz JSON")

  const { email, password, full_name, role } = body

  if (!email?.trim()) return err("email zorunlu")
  if (!password) return err("password zorunlu")
  if (!full_name?.trim()) return err("full_name zorunlu")
  if (!role || !VALID_ROLES.includes(role)) {
    return err(`role geçersiz. Geçerli değerler: ${VALID_ROLES.join(", ")}`)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Geçersiz email adresi")
  if (password.length < 8) return err("Şifre en az 8 karakter olmalı")

  const emailClean = email.toLowerCase().trim()

  const existing = await db.adminUser.findFirst({ where: { email: emailClean } })
  if (existing) return err("Bu email zaten kullanımda", 409)

  const password_hash = await bcrypt.hash(password, 10)

  const user = await db.adminUser.create({
    data: {
      email: emailClean,
      password_hash,
      full_name: full_name.trim(),
      role,
    },
    select: { id: true, email: true, full_name: true, role: true, created_at: true },
  })

  return ok(user, 201)
}

export const POST = withErrorHandler(postHandler, "POST /api/admin/users")
