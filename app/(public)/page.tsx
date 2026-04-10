import { headers } from "next/headers"
import Link from "next/link"

async function getTenantData() {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")
  if (!tenantId) return null

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3003"
  const hdrs = { "x-tenant-id": tenantId }

  const [tenantRes, servicesRes, staffRes] = await Promise.all([
    fetch(`${baseUrl}/api/tenant`, { headers: hdrs, next: { revalidate: 300 } }),
    fetch(`${baseUrl}/api/services`, { headers: hdrs, next: { revalidate: 300 } }),
    fetch(`${baseUrl}/api/staff`, { headers: hdrs, next: { revalidate: 300 } }),
  ])

  const [tenant, services, staff] = await Promise.all([
    tenantRes.ok ? tenantRes.json() : null,
    servicesRes.ok ? servicesRes.json() : null,
    staffRes.ok ? staffRes.json() : null,
  ])

  return {
    tenant: tenant?.data,
    services: services?.data || [],
    staff: staff?.data || [],
  }
}

export default async function TenantLandingPage() {
  const data = await getTenantData()

  if (!data?.tenant) {
    return null // layout handles the 404
  }

  const { tenant, services, staff } = data
  const theme = tenant.theme_config || {}

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-white to-zinc-50 py-16 sm:py-24">
        {theme.cover_image_url && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={theme.cover_image_url}
              alt=""
              className="w-full h-full object-cover opacity-10"
            />
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
            <h3 className="text-2xl font-bold text-zinc-900 mb-8">
              Hizmetlerimiz
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service: { id: string; name: string; description?: string; duration_min: number }) => (
                <div
                  key={service.id}
                  className="p-5 rounded-2xl bg-white border border-zinc-200 hover:shadow-md transition-shadow"
                >
                  <h4 className="text-base font-semibold text-zinc-900">
                    {service.name}
                  </h4>
                  {service.description && (
                    <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                      {service.description}
                    </p>
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
            <h3 className="text-2xl font-bold text-zinc-900 mb-8">
              Ekibimiz
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {staff.map((member: { id: string; full_name: string; title?: string; photo_url?: string }) => (
                <div key={member.id} className="text-center">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-20 h-20 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center mx-auto">
                      <span className="text-xl font-bold text-zinc-400">
                        {member.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="mt-3 text-sm font-medium text-zinc-900">
                    {member.full_name}
                  </p>
                  {member.title && (
                    <p className="text-xs text-zinc-500">{member.title}</p>
                  )}
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
            {tenant.company_name} &middot;{" "}
            <a
              href="https://randevya.com"
              className="hover:text-zinc-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Randevya
            </a>{" "}
            ile desteklenmektedir.
          </p>
        </div>
      </footer>
    </div>
  )
}
