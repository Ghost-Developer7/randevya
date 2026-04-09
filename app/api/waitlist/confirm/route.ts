import { NextRequest } from "next/server"
import { ok, err, withErrorHandler } from "@/lib/api-helpers"
import { confirmWaitlistSlot } from "@/lib/waitlist"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

// GET /api/waitlist/confirm?entry=xxx — bekleme listesi onay linki
// Email içindeki butona tıklandığında bu endpoint çağrılır,
// sonra frontend'e yönlendirilir
async function getHandler(req: NextRequest) {
  const entryId = req.nextUrl.searchParams.get("entry")
  const tenantId = req.nextUrl.searchParams.get("tenant")

  if (!entryId || !tenantId) return err("entry ve tenant parametreleri zorunlu")

  const result = await confirmWaitlistSlot(entryId, tenantId)

  if (!result.success) return err(result.message, 410)

  return ok({ confirmed: true, message: result.message })
}
const handlerWithError = withErrorHandler(getHandler, "GET /api/waitlist/confirm")
export const GET = withRateLimit(handlerWithError, "rl:waitlist-confirm", RATE_LIMITS.publicBooking)
