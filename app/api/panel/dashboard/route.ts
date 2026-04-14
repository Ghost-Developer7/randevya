import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/panel/dashboard — tam dashboard verisi
async function getHandler() {
  let tenantId: string

  const { session, error } = await requireTenantSession()
  if (error) {
    // Admin kullanıcı — ilk tenant'ın dashboard'unu göster
    const adminSession = await getServerSession(authOptions)
    if (adminSession?.user?.role === "PLATFORM_ADMIN") {
      const firstTenant = await db.tenant.findFirst({ where: { is_active: true }, select: { id: true } })
      if (!firstTenant) return ok({ summary: { today: 0, week: 0, month: 0, total: 0 }, daily_chart: [], hourly_chart: [], status: { confirmed: 0, completed: 0, pending: 0, cancelled: 0, no_show: 0 }, top_services: [], pending_appointments: [], today_confirmed: [] })
      tenantId = firstTenant.id
    } else {
      return error
    }
  } else {
    tenantId = session!.user.tenant_id
  }
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  // Hafta başlangıcı (Pazartesi)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Son 7 gün için günlük veri
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0)

  const [
    todayCount,
    weekCount,
    monthCount,
    totalCount,
    allAppointments7d,
    statusBreakdown,
    pendingAppointments,
    todayConfirmed,
    topServices,
    hourlyData,
  ] = await Promise.all([
    db.appointment.count({ where: { tenant_id: tenantId, start_time: { gte: todayStart, lte: todayEnd } } }),
    db.appointment.count({ where: { tenant_id: tenantId, start_time: { gte: weekStart } } }),
    db.appointment.count({ where: { tenant_id: tenantId, start_time: { gte: monthStart } } }),
    db.appointment.count({ where: { tenant_id: tenantId } }),
    // Son 7 gün randevuları (günlük grafik için)
    db.appointment.findMany({
      where: { tenant_id: tenantId, start_time: { gte: sevenDaysAgo } },
      select: { start_time: true },
    }),
    // Status dağılımı
    db.appointment.groupBy({
      by: ["status"],
      where: { tenant_id: tenantId },
      _count: true,
    }),
    // Onay bekleyen randevular
    db.appointment.findMany({
      where: { tenant_id: tenantId, status: "PENDING" },
      include: {
        staff: { select: { full_name: true } },
        service: { select: { name: true } },
      },
      orderBy: { start_time: "asc" },
      take: 10,
    }),
    // Bugünün onaylı randevuları
    db.appointment.findMany({
      where: { tenant_id: tenantId, start_time: { gte: todayStart, lte: todayEnd }, status: { in: ["CONFIRMED", "COMPLETED"] } },
      include: {
        staff: { select: { full_name: true } },
        service: { select: { name: true } },
      },
      orderBy: { start_time: "asc" },
    }),
    // Popüler hizmetler
    db.appointment.groupBy({
      by: ["service_id"],
      where: { tenant_id: tenantId },
      _count: true,
      orderBy: { _count: { service_id: "desc" } },
      take: 5,
    }),
    // Saatlik dağılım
    db.appointment.findMany({
      where: { tenant_id: tenantId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { start_time: true },
    }),
  ])

  // Günlük grafik verisi (son 7 gün)
  const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
  const dailyMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i)
    dailyMap[dayNames[d.getDay()]] = 0
  }
  allAppointments7d.forEach((a) => {
    const day = dayNames[a.start_time.getDay()]
    if (dailyMap[day] !== undefined) dailyMap[day]++
  })
  const dailyChart = Object.entries(dailyMap).map(([day, count]) => ({ day, count }))

  // Status dağılımı
  const statusMap: Record<string, number> = { CONFIRMED: 0, COMPLETED: 0, PENDING: 0, CANCELLED: 0, NO_SHOW: 0 }
  statusBreakdown.forEach((s) => { statusMap[s.status] = s._count })

  // Hizmet adlarını al
  const serviceIds = topServices.map((s) => s.service_id)
  const services = await db.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } })
  const serviceMap = Object.fromEntries(services.map((s) => [s.id, s.name]))

  // Saatlik dağılım (09-18)
  const hourlyMap: Record<number, number> = {}
  for (let h = 9; h <= 18; h++) hourlyMap[h] = 0
  hourlyData.forEach((a) => {
    const h = a.start_time.getHours()
    if (hourlyMap[h] !== undefined) hourlyMap[h]++
  })
  const hourlyChart = Object.entries(hourlyMap).map(([hour, count]) => ({ hour: `${hour}:00`, count: Number(count) }))

  return ok({
    summary: {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: totalCount,
    },
    daily_chart: dailyChart,
    hourly_chart: hourlyChart,
    status: {
      confirmed: statusMap.CONFIRMED,
      completed: statusMap.COMPLETED,
      pending: statusMap.PENDING,
      cancelled: statusMap.CANCELLED,
      no_show: statusMap.NO_SHOW,
    },
    top_services: topServices.map((s) => ({
      name: serviceMap[s.service_id] ?? "Bilinmeyen",
      count: s._count,
    })),
    pending_appointments: pendingAppointments.map((a) => ({
      id: a.id,
      customer_name: a.customer_name,
      customer_phone: a.customer_phone,
      service_name: a.service.name,
      staff_name: a.staff.full_name,
      start_time: a.start_time.toISOString(),
      notes: a.notes,
    })),
    today_confirmed: todayConfirmed.map((a) => ({
      id: a.id,
      customer_name: a.customer_name,
      service_name: a.service.name,
      staff_name: a.staff.full_name,
      start_time: a.start_time.toISOString(),
      status: a.status,
    })),
  })
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/dashboard")
