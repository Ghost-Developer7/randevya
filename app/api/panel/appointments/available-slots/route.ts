import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { getAvailableSlots } from "@/lib/slots"

// GET /api/panel/appointments/available-slots?serviceId=xxx&date=YYYY-MM-DD[&staffId=xxx]
// Panel için oturum tabanlı slot sorgusu — tenant sahibi yeni randevu eklerken kullanır.
async function getHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const { searchParams } = req.nextUrl
  const serviceId = searchParams.get("serviceId")
  const date = searchParams.get("date")
  const staffId = searchParams.get("staffId") ?? undefined

  if (!serviceId) return err("serviceId zorunlu")
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return err("date zorunlu (YYYY-MM-DD)")

  const slots = await getAvailableSlots({ tenantId, serviceId, staffId, date })
  return ok(slots)
}
export const GET = withErrorHandler(getHandler, "GET /api/panel/appointments/available-slots")
