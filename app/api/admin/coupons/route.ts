import { NextRequest } from "next/server"
import { ok, err, requireBillingAccess, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/coupons — kupon listesi
async function getHandler(req: NextRequest) {
  const { error } = await requireBillingAccess()
  if (error) return error

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")))
  const search = url.searchParams.get("search") ?? ""
  const activeFilter = url.searchParams.get("active") // "true" | "false" | null

  const where: Record<string, unknown> = {}
  if (search) where.code = { contains: search }
  if (activeFilter === "true") where.is_active = true
  if (activeFilter === "false") where.is_active = false

  const [coupons, total] = await Promise.all([
    db.coupon.findMany({
      where,
      include: { plan: { select: { name: true } } },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.coupon.count({ where }),
  ])

  return ok({
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discount_percent: c.discount_percent,
      plan_name: c.plan?.name ?? "Tüm Planlar",
      plan_id: c.plan_id,
      valid_from: c.valid_from,
      valid_until: c.valid_until,
      max_uses: c.max_uses,
      used_count: c.used_count,
      is_active: c.is_active,
      created_at: c.created_at,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

// POST /api/admin/coupons — yeni kupon oluştur
async function postHandler(req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz istek gövdesi")

  const { code, discount_percent, plan_id, valid_from, valid_until, max_uses } = body

  if (!code || typeof code !== "string" || code.trim().length < 3) {
    return err("Kupon kodu en az 3 karakter olmalı")
  }
  if (!discount_percent || discount_percent < 1 || discount_percent > 100) {
    return err("İndirim oranı 1-100 arasında olmalı")
  }
  if (!valid_from || !valid_until) {
    return err("Geçerlilik tarihleri zorunlu")
  }
  if (new Date(valid_until) <= new Date(valid_from)) {
    return err("Bitiş tarihi başlangıç tarihinden sonra olmalı")
  }
  if (!max_uses || max_uses < 1) {
    return err("Maksimum kullanım sayısı en az 1 olmalı")
  }

  // Plan kontrolü
  if (plan_id) {
    const plan = await db.plan.findUnique({ where: { id: plan_id } })
    if (!plan) return err("Plan bulunamadı", 404)
  }

  // Kod benzersizlik kontrolü
  const normalizedCode = code.trim().toUpperCase()
  const existing = await db.coupon.findUnique({ where: { code: normalizedCode } })
  if (existing) return err("Bu kupon kodu zaten mevcut", 409)

  const coupon = await db.coupon.create({
    data: {
      code: normalizedCode,
      discount_percent,
      plan_id: plan_id || null,
      valid_from: new Date(valid_from),
      valid_until: new Date(valid_until),
      max_uses,
      is_active: true,
    },
  })

  return ok({ coupon }, 201)
}

export const GET = withErrorHandler(getHandler, "GET /api/admin/coupons")
export const POST = withErrorHandler(postHandler, "POST /api/admin/coupons")
