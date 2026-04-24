import { db } from "@/lib/db"
import { redis, tenantCacheKey, TENANT_CACHE_TTL } from "@/lib/redis"
import type { TenantPublic, ThemeConfig } from "@/types"

// Prisma'dan gelen tenant'ı public tipe dönüştür
export function mapTenantToPublic(tenant: {
  id: string
  domain_slug: string
  company_name: string
  sector: string
  theme_config: string
  logo_url: string | null
}): TenantPublic {
  return {
    id: tenant.id,
    domain_slug: tenant.domain_slug,
    company_name: tenant.company_name,
    sector: tenant.sector,
    logo_url: tenant.logo_url,
    theme_config: JSON.parse(tenant.theme_config) as ThemeConfig,
  }
}

// domain_slug veya custom_domain ile tenant bul
export async function getTenantByHost(host: string): Promise<TenantPublic | null> {
  // custom_domain kontrolü (ör: takvim.drmehmetbey.com)
  let tenant = await db.tenant.findFirst({
    where: { custom_domain: host, is_active: true },
    select: {
      id: true,
      domain_slug: true,
      company_name: true,
      sector: true,
      theme_config: true,
      logo_url: true,
    },
  })

  // subdomain / slug kontrolü (ör: host = "app.randevya.com", path prefix slug ile eşlenir)
  if (!tenant) {
    const slug = host.split(".")[0]
    tenant = await db.tenant.findFirst({
      where: { domain_slug: slug, is_active: true },
      select: {
        id: true,
        domain_slug: true,
        company_name: true,
        sector: true,
        theme_config: true,
        logo_url: true,
      },
    })
  }

  if (!tenant) return null
  return mapTenantToPublic(tenant)
}

// Tenant ID'yi doğrula ve tam kaydı getir (API route'ları için)
export async function getTenantById(id: string) {
  return db.tenant.findUnique({
    where: { id, is_active: true },
  })
}

// Proxy'den gelen ham x-tenant-id değerini (slug:xxx, custom:xxx, veya UUID)
// tenant kaydına çözümler. Redis cache kullanır.
// Hem getTenantFromRequest hem de server component'lerden paylaşılır.
export async function resolveTenantByRawId(raw: string) {
  const cacheKey = tenantCacheKey(raw)
  try {
    const cached = await redis.get<string>(cacheKey)
    if (cached) {
      return db.tenant.findUnique({ where: { id: cached, is_active: true } })
    }
  } catch {
    // Redis hata verirse devam et
  }

  let tenant = null
  if (raw.startsWith("slug:")) {
    const slug = raw.slice(5)
    tenant = await db.tenant.findUnique({ where: { domain_slug: slug, is_active: true } })
    // Slug bulunamazsa aynı subdomainin custom_domain olarak set edilmiş olabileceğini kontrol et
    // (ör: admin ozgenailstudio.randevya.com'u custom_domain olarak kaydettiyse)
    if (!tenant) {
      const fullHost = `${slug}.randevya.com`
      tenant = await db.tenant.findFirst({ where: { custom_domain: fullHost, is_active: true } })
    }
  } else if (raw.startsWith("custom:")) {
    const domain = raw.slice(7)
    tenant = await db.tenant.findFirst({ where: { custom_domain: domain, is_active: true } })
  } else {
    tenant = await db.tenant.findUnique({ where: { id: raw, is_active: true } })
  }

  if (tenant) {
    try {
      await redis.set(cacheKey, tenant.id, { ex: TENANT_CACHE_TTL })
    } catch {
      // Cache yazma hata verirse sessizce devam et
    }
  }

  return tenant
}

// Plan limitlerini kontrol et
export async function checkPlanLimit(
  tenantId: string,
  resource: "staff" | "services"
): Promise<{ allowed: boolean; current: number; max: number }> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  })

  if (!tenant) return { allowed: false, current: 0, max: 0 }

  if (resource === "staff") {
    const current = await db.staff.count({ where: { tenant_id: tenantId, is_active: true } })
    const max = tenant.plan.max_staff
    return { allowed: current < max, current, max }
  }

  const current = await db.service.count({ where: { tenant_id: tenantId, is_active: true } })
  const max = tenant.plan.max_services
  return { allowed: current < max, current, max }
}

// Plan özellik kontrolü — boolean feature'lar için
export async function checkPlanFeature(
  tenantId: string,
  feature: "whatsapp_enabled" | "custom_domain" | "analytics" | "priority_support" | "waitlist_enabled"
): Promise<boolean> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: { select: { whatsapp_enabled: true, custom_domain: true, analytics: true, priority_support: true, waitlist_enabled: true } } },
  })
  if (!tenant) return false
  return !!tenant.plan[feature]
}
