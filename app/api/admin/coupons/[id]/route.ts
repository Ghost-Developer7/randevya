import { NextRequest } from "next/server"
import { ok, err, requireBillingAccess, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/coupons/[id] — kupon detayı + kullanım logları
async function getHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireBillingAccess()
  if (error) return error

  const { id } = await params

  const coupon = await db.coupon.findUnique({
    where: { id },
    include: { plan: { select: { name: true } } },
  })
  if (!coupon) return err("Kupon bulunamadı", 404)

  const usages = await db.couponUsage.findMany({
    where: { coupon_id: id },
    include: {
      tenant: { select: { company_name: true, owner_email: true } },
      subscription: { select: { billing_period: true, status: true } },
    },
    orderBy: { used_at: "desc" },
  })

  return ok({
    coupon: {
      ...coupon,
      plan_name: coupon.plan?.name ?? "Tüm Planlar",
    },
    usages: usages.map((u) => ({
      id: u.id,
      tenant_name: u.tenant.company_name,
      tenant_email: u.tenant.owner_email,
      discount_amount: u.discount_amount,
      original_amount: u.original_amount,
      final_amount: u.final_amount,
      billing_period: u.subscription?.billing_period ?? "—",
      subscription_status: u.subscription?.status ?? "—",
      used_at: u.used_at,
    })),
  })
}

// PATCH /api/admin/coupons/[id] — kupon güncelle
async function patchHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz istek gövdesi")

  const coupon = await db.coupon.findUnique({ where: { id } })
  if (!coupon) return err("Kupon bulunamadı", 404)

  const data: Record<string, unknown> = {}
  if (body.is_active !== undefined) data.is_active = body.is_active
  if (body.valid_until) data.valid_until = new Date(body.valid_until)
  if (body.max_uses !== undefined && body.max_uses >= coupon.used_count) data.max_uses = body.max_uses
  if (body.discount_percent !== undefined && body.discount_percent >= 1 && body.discount_percent <= 100) {
    data.discount_percent = body.discount_percent
  }

  const updated = await db.coupon.update({ where: { id }, data })
  return ok({ coupon: updated })
}

// DELETE /api/admin/coupons/[id] — kupon devre dışı bırak (soft delete)
async function deleteHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params

  const coupon = await db.coupon.findUnique({ where: { id } })
  if (!coupon) return err("Kupon bulunamadı", 404)

  await db.coupon.update({ where: { id }, data: { is_active: false } })
  return ok({ deactivated: true })
}

export const GET = withErrorHandler(getHandler, "GET /api/admin/coupons/[id]")
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/admin/coupons/[id]")
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/admin/coupons/[id]")
