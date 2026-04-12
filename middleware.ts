import { NextRequest, NextResponse } from "next/server"

// ─── Ana domainler — bu hostlarda tenant çözümlemesi yapılmaz ────────────────
const RANDEVYA_DOMAIN = "randevya.com"
const MAIN_HOSTS = [RANDEVYA_DOMAIN, `www.${RANDEVYA_DOMAIN}`]

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? ""
  const hostClean = host.split(":")[0] // port'u kaldır
  const pathname = req.nextUrl.pathname

  // ─── Statik dosyalar, Next.js internal → dokunma ───────────────────────────
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // ─── Localhost (geliştirme ortamı) ─────────────────────────────────────────
  // DEV_TENANT_ID env varsa dev ortamda tenant sayfalarını test edebilirsin
  if (hostClean === "localhost" || hostClean === "127.0.0.1") {
    const devTenant = process.env.DEV_TENANT_ID
    if (devTenant) {
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-tenant-id", devTenant)
      requestHeaders.set("x-tenant-host", host)
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
    return NextResponse.next()
  }

  // ─── Ana domain → pazarlama sayfası ────────────────────────────────────────
  if (MAIN_HOSTS.includes(hostClean)) {
    return NextResponse.next()
  }

  // ─── Tenant domain çözümleme ──────────────────────────────────────────────
  const identifier = resolveTenantIdentifier(hostClean)
  if (!identifier) {
    return NextResponse.next()
  }

  // Request header'a tenant bilgisi yaz — server component ve API route'lar okur
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-tenant-id", identifier)
  requestHeaders.set("x-tenant-host", host)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

// ─── Host'tan tenant identifier çıkar ────────────────────────────────────────
function resolveTenantIdentifier(host: string): string | null {
  // Subdomain kontrolü: kuafor.randevya.com → slug:kuafor
  const escapedDomain = RANDEVYA_DOMAIN.replace(".", "\\.")
  const subdomainMatch = host.match(new RegExp(`^(.+)\\.${escapedDomain}$`))

  if (subdomainMatch) {
    const slug = subdomainMatch[1]
    // www ve app subdomain'leri tenant değil
    if (slug === "www" || slug === "app") return null
    return `slug:${slug}`
  }

  // Randevya alt domaini değilse → custom domain
  // Örn: takvim.drmehmetbey.com, randevu.guzelliksalonu.com
  if (!host.endsWith(`.${RANDEVYA_DOMAIN}`) && host !== RANDEVYA_DOMAIN) {
    return `custom:${host}`
  }

  return null
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
