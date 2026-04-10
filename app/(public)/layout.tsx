import { headers } from "next/headers"

async function getTenantConfig() {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")
  if (!tenantId) return null

  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3003"}/api/tenant`,
      {
        headers: { "x-tenant-id": tenantId },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch {
    return null
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantConfig()

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">
            İşletme Bulunamadı
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Bu adreste kayıtlı bir işletme yok. Adresi kontrol edin.
          </p>
        </div>
      </div>
    )
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
