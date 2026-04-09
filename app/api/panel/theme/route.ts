import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, parseBody, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { redis, tenantCacheKey } from "@/lib/redis"
import type { UpdateThemeRequest, ThemeConfig } from "@/types"

// PATCH /api/panel/theme — tema + logo güncelle
async function patchHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const { body, error: bodyErr } = await parseBody<UpdateThemeRequest>(req)
  if (bodyErr) return bodyErr

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { theme_config: true, custom_domain: true, domain_slug: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  const currentTheme: ThemeConfig = JSON.parse(tenant.theme_config)

  const { logo_url, ...themeFields } = body!

  // Mevcut tema ile merge et
  const newTheme: ThemeConfig = { ...currentTheme, ...themeFields }

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      theme_config: JSON.stringify(newTheme),
      ...(logo_url !== undefined && { logo_url }),
    },
  })

  // Redis cache'i invalidate et (hem slug hem custom_domain için)
  try {
    const keysToDelete = [
      tenantCacheKey(`slug:${tenant.domain_slug}`),
      ...(tenant.custom_domain ? [tenantCacheKey(`custom:${tenant.custom_domain}`)] : []),
    ]
    await Promise.all(keysToDelete.map((k) => redis.del(k)))
  } catch {
    // Cache invalidation başarısız olsa bile devam et
  }

  return ok({ updated: true, theme: newTheme })
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/panel/theme")

// GET /api/panel/theme — mevcut tema ayarlarını getir
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenant = await db.tenant.findUnique({
    where: { id: session!.user.tenant_id },
    select: { theme_config: true, logo_url: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  return ok({
    theme: JSON.parse(tenant.theme_config) as ThemeConfig,
    logo_url: tenant.logo_url,
  })
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/theme")
