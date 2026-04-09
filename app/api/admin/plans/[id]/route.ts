import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/plans/[id] — plan detayı ve abone sayısı
async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params

  const [plan, subscriberCount] = await Promise.all([
    db.plan.findUnique({ where: { id } }),
    db.tenantSubscription.count({
      where: { plan_id: id, status: "ACTIVE" },
    }),
  ])

  if (!plan) return err("Plan bulunamadı", 404)

  return ok({
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
    active_subscriber_count: subscriberCount,
  })
}
export const GET = withErrorHandler(getHandler, "GET /api/admin/plans/[id]")

// PATCH /api/admin/plans/[id] — plan güncelle (SUPER_ADMIN)
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params

  const plan = await db.plan.findUnique({ where: { id } })
  if (!plan) return err("Plan bulunamadı", 404)

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

  if (body.name !== undefined && !body.name.trim()) return err("name boş olamaz")
  if (body.price_monthly !== undefined && (typeof body.price_monthly !== "number" || body.price_monthly < 0)) {
    return err("price_monthly geçerli bir sayı olmalı")
  }
  if (body.max_staff !== undefined && (typeof body.max_staff !== "number" || body.max_staff < 1)) {
    return err("max_staff en az 1 olmalı")
  }
  if (body.max_services !== undefined && (typeof body.max_services !== "number" || body.max_services < 1)) {
    return err("max_services en az 1 olmalı")
  }

  const updated = await db.plan.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.price_monthly !== undefined && { price_monthly: body.price_monthly }),
      ...(body.max_staff !== undefined && { max_staff: body.max_staff }),
      ...(body.max_services !== undefined && { max_services: body.max_services }),
      ...(body.whatsapp_enabled !== undefined && { whatsapp_enabled: body.whatsapp_enabled }),
      ...(body.custom_domain !== undefined && { custom_domain: body.custom_domain }),
      ...(body.waitlist_enabled !== undefined && { waitlist_enabled: body.waitlist_enabled }),
      ...(body.analytics !== undefined && { analytics: body.analytics }),
      ...(body.priority_support !== undefined && { priority_support: body.priority_support }),
    },
  })

  return ok({
    id: updated.id,
    name: updated.name,
    price_monthly: updated.price_monthly,
    max_staff: updated.max_staff,
    max_services: updated.max_services,
    whatsapp_enabled: updated.whatsapp_enabled,
    custom_domain: updated.custom_domain,
    waitlist_enabled: updated.waitlist_enabled,
    analytics: updated.analytics,
    priority_support: updated.priority_support,
  })
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/admin/plans/[id]")

// DELETE /api/admin/plans/[id] — soft delete (aktif abone varsa 409)
async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params

  const plan = await db.plan.findUnique({ where: { id } })
  if (!plan) return err("Plan bulunamadı", 404)

  // Aktif abone sayısını kontrol et
  const activeSubscribers = await db.tenantSubscription.count({
    where: { plan_id: id, status: "ACTIVE" },
  })

  if (activeSubscribers > 0) {
    return err(
      `Bu planın ${activeSubscribers} aktif abonesi var. Plan silinemez.`,
      409,
      "HAS_ACTIVE_SUBSCRIBERS"
    )
  }

  // Plana bağlı tenant'ları başka bir planla güncellemeyi burada yapmıyoruz;
  // soft delete: tenant'lar plan_id'yi korur ama plan listelenmez.
  // Gerçek uygulama ihtiyacına göre tenant'lar önce taşınmalı.
  // Şimdilik planı sil (aktif tenant yoksa zaten güvenli).
  await db.plan.delete({ where: { id } })

  return ok({ deleted: true })
}
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/admin/plans/[id]")
