import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { checkPlanFeature } from "@/lib/tenant"

const VALID_PERIODS = ["7d", "30d", "90d", "365d"] as const
type Period = (typeof VALID_PERIODS)[number]

function periodToDays(period: Period): number {
  return parseInt(period, 10)
}

// GET /api/panel/analytics — detaylı analitik verisi
// Query: ?period=30d (7d | 30d | 90d | 365d)
async function getHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  // Plan kontrolü — analytics özelliği sadece Profesyonel pakette
  const hasAnalytics = await checkPlanFeature(tenantId, "analytics")
  if (!hasAnalytics) {
    return err("Analitik özelliği planınızda bulunmuyor. Profesyonel pakete yükseltin.", 403)
  }
  const { searchParams } = req.nextUrl

  const periodParam = searchParams.get("period") ?? "30d"
  if (!VALID_PERIODS.includes(periodParam as Period)) {
    return err("Geçersiz period değeri. Kabul edilenler: 7d, 30d, 90d, 365d")
  }

  const period = periodParam as Period
  const days = periodToDays(period)

  const nowTR = new Date(Date.now() + 3 * 60 * 60 * 1000)
  const periodStartTR = new Date(nowTR.getTime() - days * 86400000)
  const periodStartStr = periodStartTR.toISOString().slice(0, 10)
  const periodStart = new Date(`${periodStartStr}T00:00:00+03:00`)

  // Tüm randevuları bir sorguda çek, sonra bellek içi grupla
  // (Prisma SQL Server'da raw date truncation zor, bu yol daha taşınabilir)
  const appointments = await db.appointment.findMany({
    where: {
      tenant_id: tenantId,
      start_time: { gte: periodStart },
    },
    select: {
      id: true,
      start_time: true,
      status: true,
      service_id: true,
      staff_id: true,
      service: { select: { id: true, name: true } },
      staff: { select: { id: true, full_name: true } },
    },
  })

  // ── daily_appointments ──────────────────────────────────────────────────────
  const dailyMap = new Map<string, { count: number; cancelled_count: number }>()

  const TZ_OFF = 3 * 60 * 60 * 1000

  // Aralıktaki her gün için sıfır satırı hazırla (Türkiye yerel tarihi)
  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart.getTime() + i * 86400000)
    const key = new Date(d.getTime() + TZ_OFF).toISOString().slice(0, 10)
    dailyMap.set(key, { count: 0, cancelled_count: 0 })
  }

  for (const a of appointments) {
    const key = new Date(a.start_time.getTime() + TZ_OFF).toISOString().slice(0, 10)
    const entry = dailyMap.get(key)
    if (!entry) continue
    entry.count++
    if (a.status === "CANCELLED") entry.cancelled_count++
  }

  const daily_appointments = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── status_breakdown ────────────────────────────────────────────────────────
  const statusBreakdown: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
    NO_SHOW: 0,
  }
  for (const a of appointments) {
    if (a.status in statusBreakdown) statusBreakdown[a.status]++
  }

  // ── top_services ────────────────────────────────────────────────────────────
  const serviceCountMap = new Map<string, { name: string; count: number }>()
  for (const a of appointments) {
    const existing = serviceCountMap.get(a.service_id)
    if (existing) {
      existing.count++
    } else {
      serviceCountMap.set(a.service_id, { name: a.service.name, count: 1 })
    }
  }
  const top_services = Array.from(serviceCountMap.entries())
    .map(([service_id, v]) => ({ service_id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── top_staff ───────────────────────────────────────────────────────────────
  const staffCountMap = new Map<string, { full_name: string; count: number }>()
  for (const a of appointments) {
    const existing = staffCountMap.get(a.staff_id)
    if (existing) {
      existing.count++
    } else {
      staffCountMap.set(a.staff_id, { full_name: a.staff.full_name, count: 1 })
    }
  }
  const top_staff = Array.from(staffCountMap.entries())
    .map(([staff_id, v]) => ({ staff_id, full_name: v.full_name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── peak_hours ──────────────────────────────────────────────────────────────
  const hourCounts = new Array<number>(24).fill(0)
  for (const a of appointments) {
    hourCounts[a.start_time.getHours()]++
  }
  const peak_hours = hourCounts.map((count, hour) => ({ hour, count }))

  // ── totals ──────────────────────────────────────────────────────────────────
  const total_appointments = appointments.length
  const total_cancelled = statusBreakdown.CANCELLED
  const cancellation_rate =
    total_appointments > 0
      ? Math.round((total_cancelled / total_appointments) * 10000) / 100
      : 0

  return ok({
    period,
    period_start: periodStart.toISOString(),
    period_end: nowTR.toISOString(),
    total_appointments,
    total_cancelled,
    cancellation_rate,
    daily_appointments,
    status_breakdown: statusBreakdown,
    top_services,
    top_staff,
    peak_hours,
  })
}
export const GET = withErrorHandler(getHandler, "GET /api/panel/analytics")
