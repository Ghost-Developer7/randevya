import { db } from "@/lib/db"
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
