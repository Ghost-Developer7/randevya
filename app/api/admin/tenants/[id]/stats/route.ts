import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/tenants/[id]/stats — belirli bir tenant'ın detaylı istatistikleri
async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id: tenantId } = await params

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      company_name: true,
      is_active: true,
      created_at: true,
      plan_id: true,
    },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [
    totalAppointments,
    appointmentsThisMonth,
    appointmentsLastMonth,
    activeStaffCount,
    activeServicesCount,
    waitlistEntriesCount,
    currentSubscription,
    lastAppointment,
  ] = await Promise.all([
    db.appointment.count({ where: { tenant_id: tenantId } }),
    db.appointment.count({
      where: { tenant_id: tenantId, start_time: { gte: monthStart } },
    }),
    db.appointment.count({
      where: {
        tenant_id: tenantId,
        start_time: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    db.staff.count({ where: { tenant_id: tenantId, is_active: true } }),
    db.service.count({ where: { tenant_id: tenantId, is_active: true } }),
    db.waitlistEntry.count({ where: { tenant_id: tenantId } }),
    db.tenantSubscription.findFirst({
      where: {
        tenant_id: tenantId,
        status: "ACTIVE",
        ends_at: { gt: now },
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price_monthly: true,
            max_staff: true,
            max_services: true,
            whatsapp_enabled: true,
            analytics: true,
          },
        },
      },
      orderBy: { ends_at: "desc" },
    }),
    db.appointment.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { start_time: "desc" },
      select: { start_time: true },
    }),
  ])

  return ok({
    tenant_id: tenant.id,
    company_name: tenant.company_name,
    is_active: tenant.is_active,
    registration_date: tenant.created_at.toISOString(),
    total_appointments,
    appointments_this_month: appointmentsThisMonth,
    appointments_last_month: appointmentsLastMonth,
    active_staff_count: activeStaffCount,
    active_services_count: activeServicesCount,
    waitlist_entries_count: waitlistEntriesCount,
    last_appointment_at: lastAppointment?.start_time.toISOString() ?? null,
    subscription_status: currentSubscription?.status ?? "NONE",
    current_plan: currentSubscription
      ? {
          id: currentSubscription.plan.id,
          name: currentSubscription.plan.name,
          price_monthly: currentSubscription.plan.price_monthly,
          max_staff: currentSubscription.plan.max_staff,
          max_services: currentSubscription.plan.max_services,
          whatsapp_enabled: currentSubscription.plan.whatsapp_enabled,
          analytics: currentSubscription.plan.analytics,
          ends_at: currentSubscription.ends_at.toISOString(),
        }
      : null,
  })
}
export const GET = withErrorHandler(getHandler, "GET /api/admin/tenants/[id]/stats")
