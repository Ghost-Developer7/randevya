import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/tenants/[id]/subscriptions — tenant'ın tüm ödeme geçmişi
async function getHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params

  const tenant = await db.tenant.findUnique({
    where: { id },
    select: { id: true, company_name: true, owner_email: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  const subscriptions = await db.tenantSubscription.findMany({
    where: { tenant_id: id },
    include: { plan: { select: { name: true, price_monthly: true } } },
    orderBy: { starts_at: "desc" },
  })

  return ok({
    tenant,
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      plan_name: s.plan.name,
      price_monthly: s.plan.price_monthly,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      status: s.status,
      paytr_ref: s.paytr_ref,
    })),
  })
}
export const GET = withErrorHandler(getHandler, "GET /api/admin/tenants/[id]/subscriptions")
