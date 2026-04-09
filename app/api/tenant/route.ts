import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, withErrorHandler } from "@/lib/api-helpers"
import type { ThemeConfig } from "@/types"

// GET /api/tenant — mevcut host'un tenant config'ini döndür
async function getHandler(req: NextRequest) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  return ok({
    id: tenant.id,
    domain_slug: tenant.domain_slug,
    company_name: tenant.company_name,
    sector: tenant.sector,
    logo_url: tenant.logo_url,
    theme_config: JSON.parse(tenant.theme_config) as ThemeConfig,
  })
}
export const GET = withErrorHandler(getHandler, "GET /api/tenant")
