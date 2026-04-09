import { ok, err, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/stats — platform geneli istatistikler
async function getHandler() {
  const { error } = await requireAdminSession()
  if (error) return error

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [
    totalTenants,
    activeTenants,
    newTenantsThisMonth,
    totalAppointments,
    appointmentsThisMonth,
    appointmentsLastMonth,
    activeSubscriptions,
    planBreakdown,
  ] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { is_active: true } }),
    db.tenant.count({ where: { created_at: { gte: monthStart } } }),
    db.appointment.count(),
    db.appointment.count({
      where: { created_at: { gte: monthStart }, status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
    db.appointment.count({
      where: {
        created_at: { gte: lastMonthStart, lte: lastMonthEnd },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    }),
    db.tenantSubscription.count({
      where: { status: "ACTIVE", ends_at: { gt: now } },
    }),
    db.tenantSubscription.groupBy({
      by: ["plan_id"],
      where: { status: "ACTIVE", ends_at: { gt: now } },
      _count: true,
    }),
  ])

  // Plan adlarını al
  const plans = await db.plan.findMany({ select: { id: true, name: true } })
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p.name]))

  return ok({
    tenants: {
      total: totalTenants,
      active: activeTenants,
      new_this_month: newTenantsThisMonth,
    },
    appointments: {
      total: totalAppointments,
      this_month: appointmentsThisMonth,
      last_month: appointmentsLastMonth,
      growth_pct:
        appointmentsLastMonth > 0
          ? Math.round(((appointmentsThisMonth - appointmentsLastMonth) / appointmentsLastMonth) * 100)
          : null,
    },
    subscriptions: {
      active: activeSubscriptions,
      by_plan: planBreakdown.map((p) => ({
        plan_name: planMap[p.plan_id] ?? p.plan_id,
        count: p._count,
      })),
    },
  })
}
export const GET = withErrorHandler(getHandler as never, "GET /api/admin/stats")
