import { ok, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/public/plans — Kayıt sayfası gibi herkese açık yerler için planları listele
async function getHandler() {
  const plans = await db.plan.findMany({
    orderBy: { price_monthly: "asc" },
  })

  return ok(
    plans.map((p) => ({
      id: p.id,
      name: p.name,
      price_monthly: Number(p.price_monthly),
      max_staff: p.max_staff,
      max_services: p.max_services,
      whatsapp_enabled: p.whatsapp_enabled,
      custom_domain: p.custom_domain,
      waitlist_enabled: p.waitlist_enabled,
      analytics: p.analytics,
      priority_support: p.priority_support,
    }))
  )
}

export const GET = withErrorHandler(getHandler as never, "GET /api/public/plans")
