import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/panel/settings/closed-days — kapalı günleri listele
// ?staffId=xxx  →  belirli personelin kapalı günleri
// staffId yoksa → tüm işletme + tüm personel kapalı günleri
async function getHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const { searchParams } = req.nextUrl
  const staffId = searchParams.get("staffId") ?? undefined

  // staffId verilmişse tenant'a ait olduğunu doğrula
  if (staffId) {
    const staff = await db.staff.findUnique({ where: { id: staffId } })
    if (!staff || staff.tenant_id !== tenantId) return err("Personel bulunamadı", 404)
  }

  const closedDays = await db.closedDay.findMany({
    where: {
      tenant_id: tenantId,
      ...(staffId !== undefined
        ? { staff_id: staffId }
        : {}),
    },
    include: {
      staff: { select: { id: true, full_name: true } },
    },
    orderBy: { date: "asc" },
  })

  return ok(
    closedDays.map((d) => ({
      id: d.id,
      date: d.date.toISOString().slice(0, 10),
      reason: d.reason,
      staff_id: d.staff_id,
      staff_name: d.staff?.full_name ?? null,
      created_at: d.created_at.toISOString(),
    }))
  )
}
export const GET = withErrorHandler(getHandler, "GET /api/panel/settings/closed-days")

// POST /api/panel/settings/closed-days — kapalı gün oluştur
// Body: { date: "2024-12-25", staff_id?: string, reason?: string }
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const body = await req.json().catch(() => null) as {
    date?: string
    staff_id?: string
    reason?: string
  } | null

  if (!body) return err("Geçersiz JSON")
  if (!body.date) return err("date alanı zorunlu")

  // ISO tarih formatı doğrula (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(body.date)) return err("Geçersiz tarih formatı. Beklenen: YYYY-MM-DD")

  const parsedDate = new Date(`${body.date}T00:00:00`)
  if (isNaN(parsedDate.getTime())) return err("Geçersiz tarih")

  // staff_id verilmişse tenant'a ait olduğunu doğrula
  if (body.staff_id) {
    const staff = await db.staff.findUnique({ where: { id: body.staff_id } })
    if (!staff || staff.tenant_id !== tenantId) return err("Personel bulunamadı", 404)
  }

  // Aynı tarih + staff kombinasyonu zaten var mı?
  const existing = await db.closedDay.findFirst({
    where: {
      tenant_id: tenantId,
      date: parsedDate,
      staff_id: body.staff_id ?? null,
    },
  })
  if (existing) return err("Bu tarih zaten kapalı gün olarak işaretlenmiş", 409)

  const closed = await db.closedDay.create({
    data: {
      tenant_id: tenantId,
      date: parsedDate,
      staff_id: body.staff_id ?? null,
      reason: body.reason?.trim() ?? null,
    },
  })

  return ok(
    {
      id: closed.id,
      date: closed.date.toISOString().slice(0, 10),
      staff_id: closed.staff_id,
      reason: closed.reason,
    },
    201
  )
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/settings/closed-days")

// DELETE /api/panel/settings/closed-days?id=xxx — kapalı günü sil
async function deleteHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const id = req.nextUrl.searchParams.get("id")

  if (!id) return err("id parametresi gerekli")

  const closedDay = await db.closedDay.findUnique({ where: { id } })
  if (!closedDay) return err("Kapalı gün bulunamadı", 404)
  if (closedDay.tenant_id !== tenantId) return err("Yetkisiz kaynak", 403)

  await db.closedDay.delete({ where: { id } })

  return ok({ deleted: true })
}
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/panel/settings/closed-days")
