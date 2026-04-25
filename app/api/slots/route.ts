import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, withErrorHandler } from "@/lib/api-helpers"
import { getAvailableSlots } from "@/lib/slots"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

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

  // Geçmiş tarih kontrolü — Türkiye yerel tarihi (UTC+3) ile karşılaştır
  const todayTR = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
  if (date < todayTR) {
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
const handlerWithError = withErrorHandler(getHandler, "GET /api/slots")
export const GET = withRateLimit(handlerWithError, "rl:slots", RATE_LIMITS.publicSlots)
