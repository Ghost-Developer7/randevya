import { headers } from "next/headers"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { resolveTenantByRawId } from "@/lib/tenant"
import type { ThemeConfig } from "@/types"

type TenantConfig = {
  id: string
  company_name: string
  logo_url: string | null
  theme_config: ThemeConfig
  is_white_label: boolean
}

async function getTenantConfig(): Promise<TenantConfig | null> {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")
  if (!tenantId) return null

  const tenant = await resolveTenantByRawId(tenantId)
  if (!tenant) return null

  const plan = await db.plan.findUnique({
    where: { id: tenant.plan_id },
    select: { custom_domain: true },
  })

  return {
    id: tenant.id,
    company_name: tenant.company_name,
    logo_url: tenant.logo_url,
    theme_config: JSON.parse(tenant.theme_config) as ThemeConfig,
    is_white_label: plan?.custom_domain ?? false,
  }
}

// ─── Dinamik SEO metadata ────────────────────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantConfig()
  if (!tenant) return {}

  return {
    title: {
      default: `${tenant.company_name} - Online Randevu`,
      template: `%s | ${tenant.company_name}`,
    },
    description: `${tenant.company_name} online randevu sistemi. Hizmetlerimizi inceleyin ve hemen randevu alın.`,
    openGraph: {
      title: `${tenant.company_name} - Online Randevu`,
      description: `${tenant.company_name} online randevu sistemi.`,
      siteName: tenant.company_name,
      ...(tenant.logo_url ? { images: [tenant.logo_url] } : {}),
    },
    ...(tenant.logo_url
      ? {
          icons: {
            icon: tenant.logo_url,
            apple: tenant.logo_url,
          },
        }
      : {}),
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantConfig()

  // Platform domaini üzerinden erişim (sozlesmeler vb.) — tenant chrome'suz göster
  if (!tenant) {
    return <>{children}</>
  }

  const theme = tenant.theme_config || {}

  return (
    <div
      style={
        {
          "--color-primary": theme.primary_color || "#2a5cff",
          "--color-secondary": theme.secondary_color || "#ff4d2e",
          "--font-main": theme.font || "Inter, sans-serif",
          "--border-radius": theme.border_radius || "12px",
        } as React.CSSProperties
      }
    >
      {/* Top bar */}
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
              <h1 className="text-lg font-bold text-zinc-900">
                {tenant.company_name}
              </h1>
              {theme.tagline && (
                <p className="text-xs text-zinc-500">{theme.tagline}</p>
              )}
            </div>
          </div>
          <a
            href="/randevu"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-opacity"
          >
            Randevu Al
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
