import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/panel/dashboard — istatistik özeti
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    todayTotal,
    todayConfirmed,
    monthTotal,
    totalAppointments,
    pendingCount,
    activeStaff,
    activeServices,
    upcomingToday,
  ] = await Promise.all([
    db.appointment.count({
      where: { tenant_id: tenantId, start_time: { gte: todayStart, lte: todayEnd } },
    }),
    db.appointment.count({
      where: {
        tenant_id: tenantId,
        start_time: { gte: todayStart, lte: todayEnd },
        status: "CONFIRMED",
      },
    }),
    db.appointment.count({
      where: {
        tenant_id: tenantId,
        start_time: { gte: monthStart },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    }),
    db.appointment.count({ where: { tenant_id: tenantId } }),
    db.appointment.count({
      where: { tenant_id: tenantId, status: "PENDING" },
    }),
    db.staff.count({ where: { tenant_id: tenantId, is_active: true } }),
    db.service.count({ where: { tenant_id: tenantId, is_active: true } }),
    db.appointment.findMany({
      where: {
        tenant_id: tenantId,
        start_time: { gte: now, lte: todayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        staff: { select: { full_name: true } },
        service: { select: { name: true } },
      },
      orderBy: { start_time: "asc" },
      take: 5,
    }),
  ])

  return ok({
    today: { total: todayTotal, confirmed: todayConfirmed },
    month: { total: monthTotal },
    all_time: { total: totalAppointments },
    pending: pendingCount,
    staff_count: activeStaff,
    service_count: activeServices,
    upcoming_today: upcomingToday.map((a) => ({
      id: a.id,
      customer_name: a.customer_name,
      start_time: a.start_time.toISOString(),
      status: a.status,
      staff_name: a.staff.full_name,
      service_name: a.service.name,
    })),
  })
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/dashboard")
