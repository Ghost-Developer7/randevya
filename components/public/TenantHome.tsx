import Link from "next/link"
import { db } from "@/lib/db"
import { resolveTenantByRawId } from "@/lib/tenant"
import type { ThemeConfig } from "@/types"

type TenantData = {
  company_name: string
  logo_url: string | null
  theme_config: ThemeConfig
  is_white_label: boolean
}

type Service = { id: string; name: string; description?: string | null; duration_min: number }
type Staff = { id: string; full_name: string; title?: string | null; photo_url?: string | null }

async function fetchTenantData(tenantId: string): Promise<{
  tenant: TenantData | null
  services: Service[]
  staff: Staff[]
}> {
  const tenant = await resolveTenantByRawId(tenantId)
  if (!tenant) return { tenant: null, services: [], staff: [] }

  const [plan, services, staff] = await Promise.all([
    db.plan.findUnique({ where: { id: tenant.plan_id }, select: { custom_domain: true } }),
    db.service.findMany({
      where: { tenant_id: tenant.id, is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, duration_min: true },
    }),
    db.staff.findMany({
      where: { tenant_id: tenant.id, is_active: true },
      orderBy: { full_name: "asc" },
      select: { id: true, full_name: true, title: true, photo_url: true },
    }),
  ])

  return {
    tenant: {
      company_name: tenant.company_name,
      logo_url: tenant.logo_url,
      theme_config: JSON.parse(tenant.theme_config) as ThemeConfig,
      is_white_label: plan?.custom_domain ?? false,
    },
    services,
    staff,
  }
}

export default async function TenantHome({ tenantId }: { tenantId: string }) {
  const data = await fetchTenantData(tenantId)

  if (!data.tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">İşletme Bulunamadı</h1>
          <p className="mt-2 text-sm text-zinc-500">Bu adreste kayıtlı bir işletme yok.</p>
        </div>
      </div>
    )
  }

  const { tenant, services, staff } = data
  const theme = tenant.theme_config || {}
  const isWhiteLabel = tenant.is_white_label ?? false

  return (
    <div
      className="min-h-screen bg-zinc-50"
      style={
        {
          "--color-primary": theme.primary_color || "#2a5cff",
          "--color-secondary": theme.secondary_color || "#ff4d2e",
          "--font-main": theme.font || "Inter, sans-serif",
          "--border-radius": theme.border_radius || "12px",
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.company_name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {tenant.company_name?.charAt(0) || "R"}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-zinc-900">{tenant.company_name}</h1>
              {theme.tagline && <p className="text-xs text-zinc-500">{theme.tagline}</p>}
            </div>
          </div>
          <Link
            href="/randevu"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-opacity"
          >
            Randevu Al
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-white to-zinc-50 py-16 sm:py-24">
        {theme.cover_image_url && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={theme.cover_image_url} alt="" className="w-full h-full object-cover opacity-10" />
          </div>
        )}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
            {theme.tagline || `${tenant.company_name}'a Hoş Geldiniz`}
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Hizmetlerimizi inceleyin ve hemen online randevu alın.
          </p>
          <Link
            href="/randevu"
            className="mt-8 inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            Randevu Al
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h3 className="text-2xl font-bold text-zinc-900 mb-8">Hizmetlerimiz</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-5 rounded-2xl bg-white border border-zinc-200 hover:shadow-md transition-shadow"
                >
                  <h4 className="text-base font-semibold text-zinc-900">{service.name}</h4>
                  {service.description && (
                    <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{service.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {service.duration_min} dakika
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Staff */}
      {staff.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h3 className="text-2xl font-bold text-zinc-900 mb-8">Ekibimiz</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {staff.map((member) => (
                <div key={member.id} className="text-center">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-20 h-20 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center mx-auto">
                      <span className="text-xl font-bold text-zinc-400">{member.full_name.charAt(0)}</span>
                    </div>
                  )}
                  <p className="mt-3 text-sm font-medium text-zinc-900">{member.full_name}</p>
                  {member.title && <p className="text-xs text-zinc-500">{member.title}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-zinc-400">
            {tenant.company_name}
            {!isWhiteLabel && (
              <>
                {" "}&middot;{" "}
                <a
                  href="https://randevya.com"
                  className="hover:text-zinc-600 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Randevya
                </a>{" "}
                ile desteklenmektedir.
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  )
}
