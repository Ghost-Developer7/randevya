import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/panel/appointments — takvim + liste verisi
// Query params:
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD  (tarih aralığı, default: bu hafta)
//   ?status=CONFIRMED,PENDING        (virgülle ayrılmış, default: hepsi)
//   ?staffId=xxx                     (filtre)
async function getHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const { searchParams } = req.nextUrl

  // Tarih aralığı
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const staffId = searchParams.get("staffId") ?? undefined
  const statusParam = searchParams.get("status")

  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d
  })()
  const to = toParam ? new Date(`${toParam}T23:59:59`) : (() => {
    const d = new Date(from); d.setDate(d.getDate() + 6); d.setHours(23, 59, 59, 999); return d
  })()

  const statusFilter = statusParam
    ? statusParam.split(",").map((s) => s.trim())
    : ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]

  const appointments = await db.appointment.findMany({
    where: {
      tenant_id: tenantId,
      start_time: { gte: from, lte: to },
      status: { in: statusFilter },
      ...(staffId && { staff_id: staffId }),
    },
    include: {
      staff: { select: { id: true, full_name: true } },
      service: { select: { id: true, name: true, duration_min: true } },
    },
    orderBy: { start_time: "asc" },
  })

  return ok(
    appointments.map((a) => ({
      id: a.id,
      customer_name: a.customer_name,
      customer_phone: a.customer_phone,
      customer_email: a.customer_email,
      start_time: a.start_time.toISOString(),
      end_time: a.end_time.toISOString(),
      status: a.status,
      notes: a.notes,
      staff: a.staff,
      service: a.service,
    }))
  )
}
export const GET = withErrorHandler(getHandler, "GET /api/panel/appointments")
