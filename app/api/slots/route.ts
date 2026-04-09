import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, withErrorHandler } from "@/lib/api-helpers"
import { getAvailableSlots } from "@/lib/slots"

// GET /api/slots?serviceId=xxx&date=YYYY-MM-DD[&staffId=xxx]
async function getHandler(req: NextRequest) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  const { searchParams } = req.nextUrl
  const serviceId = searchParams.get("serviceId")
  const date = searchParams.get("date")
  const staffId = searchParams.get("staffId") ?? undefined

  if (!serviceId) return err("serviceId zorunlu")
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return err("date zorunlu (YYYY-MM-DD)")

  // Geçmiş tarih kontrolü
  if (new Date(date) < new Date(new Date().toDateString())) {
    return err("Geçmiş tarih için slot sorgulanaması")
  }

  const slots = await getAvailableSlots({
    tenantId: tenant.id,
    serviceId,
    staffId,
    date,
  })

  return ok(slots)
}
export const GET = withErrorHandler(getHandler, "GET /api/slots")
