import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/panel/subscription/history — tenant'ın kendi ödeme geçmişi
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const subscriptions = await db.tenantSubscription.findMany({
    where: { tenant_id: tenantId },
    include: { plan: { select: { name: true, price_monthly: true } } },
    orderBy: { starts_at: "desc" },
  })

  if (!subscriptions.length) return ok({ subscriptions: [] })

  return ok({
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
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/subscription/history")
