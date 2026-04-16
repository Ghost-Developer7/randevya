import { ok, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/panel/plans — tenant paneli için planları listele (DB'den)
// Paralel olarak tenant'ın mevcut plan_id'sini de döner.
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const [plans, tenant] = await Promise.all([
    db.plan.findMany({ orderBy: { price_monthly: "asc" } }),
    db.tenant.findUnique({
      where: { id: session!.user.tenant_id },
      select: { plan_id: true },
    }),
  ])

  return ok({
    current_plan_id: tenant?.plan_id ?? null,
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      price_monthly: Number(p.price_monthly),
      max_staff: p.max_staff,
      max_services: p.max_services,
      whatsapp_enabled: p.whatsapp_enabled,
      custom_domain: p.custom_domain,
      waitlist_enabled: p.waitlist_enabled,
      analytics: p.analytics,
      priority_support: p.priority_support,
    })),
  })
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/plans")
