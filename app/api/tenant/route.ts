import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, withErrorHandler } from "@/lib/api-helpers"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { db } from "@/lib/db"
import type { ThemeConfig } from "@/types"

// GET /api/tenant — mevcut host'un tenant config'ini döndür
async function getHandler(req: NextRequest) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  // Plan bilgisi: white-label kontrolü için
  const plan = await db.plan.findUnique({
    where: { id: tenant.plan_id },
    select: { custom_domain: true },
  })

  return ok({
    id: tenant.id,
    domain_slug: tenant.domain_slug,
    company_name: tenant.company_name,
    sector: tenant.sector,
    logo_url: tenant.logo_url,
    theme_config: JSON.parse(tenant.theme_config) as ThemeConfig,
    is_white_label: plan?.custom_domain ?? false,
  })
}
const handlerWithError = withErrorHandler(getHandler, "GET /api/tenant")
export const GET = withRateLimit(handlerWithError, "rl:tenant", RATE_LIMITS.publicSlots)
