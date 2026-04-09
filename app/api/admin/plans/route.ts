import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/plans — tüm planları listele
async function getHandler() {
  const { error } = await requireAdminSession()
  if (error) return error

  const plans = await db.plan.findMany({
    orderBy: { price_monthly: "asc" },
  })

  return ok(
    plans.map((p) => ({
      id: p.id,
      name: p.name,
      price_monthly: p.price_monthly,
      max_staff: p.max_staff,
      max_services: p.max_services,
      whatsapp_enabled: p.whatsapp_enabled,
      custom_domain: p.custom_domain,
      waitlist_enabled: p.waitlist_enabled,
      analytics: p.analytics,
      priority_support: p.priority_support,
      created_at: p.created_at.toISOString(),
    }))
  )
}
export const GET = withErrorHandler(getHandler as never, "GET /api/admin/plans")

// POST /api/admin/plans — yeni plan oluştur (sadece SUPER_ADMIN)
async function postHandler(req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await req.json().catch(() => null) as {
    name?: string
    price_monthly?: number
    max_staff?: number
    max_services?: number
    whatsapp_enabled?: boolean
    custom_domain?: boolean
    waitlist_enabled?: boolean
    analytics?: boolean
    priority_support?: boolean
  } | null

  if (!body) return err("Geçersiz JSON")

  if (!body.name?.trim()) return err("name alanı zorunlu")
  if (body.price_monthly === undefined || body.price_monthly === null) {
    return err("price_monthly alanı zorunlu")
  }
  if (body.max_staff === undefined || body.max_staff === null) {
    return err("max_staff alanı zorunlu")
  }
  if (body.max_services === undefined || body.max_services === null) {
    return err("max_services alanı zorunlu")
  }
  if (typeof body.price_monthly !== "number" || body.price_monthly < 0) {
    return err("price_monthly geçerli bir sayı olmalı")
  }
  if (typeof body.max_staff !== "number" || body.max_staff < 1) {
    return err("max_staff en az 1 olmalı")
  }
  if (typeof body.max_services !== "number" || body.max_services < 1) {
    return err("max_services en az 1 olmalı")
  }

  const plan = await db.plan.create({
    data: {
      name: body.name.trim(),
      price_monthly: body.price_monthly,
      max_staff: body.max_staff,
      max_services: body.max_services,
      whatsapp_enabled: body.whatsapp_enabled ?? false,
      custom_domain: body.custom_domain ?? false,
      waitlist_enabled: body.waitlist_enabled ?? true,
      analytics: body.analytics ?? false,
      priority_support: body.priority_support ?? false,
    },
  })

  return ok(
    {
      id: plan.id,
      name: plan.name,
      price_monthly: plan.price_monthly,
      max_staff: plan.max_staff,
      max_services: plan.max_services,
      whatsapp_enabled: plan.whatsapp_enabled,
      custom_domain: plan.custom_domain,
      waitlist_enabled: plan.waitlist_enabled,
      analytics: plan.analytics,
      priority_support: plan.priority_support,
      created_at: plan.created_at.toISOString(),
    },
    201
  )
}
export const POST = withErrorHandler(postHandler, "POST /api/admin/plans")
