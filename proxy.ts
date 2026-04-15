import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PLATFORM_HOSTS = new Set([
  "randevya.com",
  "www.randevya.com",
])

function isPlatformDomain(host: string): boolean {
  const h = host.split(":")[0]
  if (PLATFORM_HOSTS.has(h) || h === "localhost") return true
  return false
}

function getSubdomainTenantId(host: string): string | null {
  const h = host.split(":")[0]
  // xxx.randevya.com → slug:xxx
  if (h.endsWith(".randevya.com")) {
    const sub = h.replace(".randevya.com", "")
    if (sub && sub !== "www") return `slug:${sub}`
  }
  // Dev: xxx.localhost → slug:xxx (hosts dosyasiyla test icin)
  // Not: tarayici .localhost subdomainlerini desteklemez, bu yuzden
  // xxx.randevya.com seklinde hosts dosyasina eklenmeli
  return null
}

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? ""
  const pathname = req.nextUrl.pathname

  // ─── Platform domaini (randevya.com / localhost) ─────────────────────────
  if (isPlatformDomain(host)) {
    // Tenant'a özel rotalar platform domaininde çalışmaz
    if (pathname.startsWith("/randevu")) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Platform sayfaları normal akışta devam eder
    return NextResponse.next()
  }

  // ─── Subdomain veya custom domain ───────────────────────────────────────

  // Panel ve admin erişimi tenant domain'de engelle
  if (pathname.startsWith("/panel") || pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Subdomain (xxx.randevya.com) veya custom domain
  const subTenantId = getSubdomainTenantId(host)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-tenant-id", subTenantId || `custom:${host.split(":")[0]}`)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    // Static assets ve Next.js internal dosyalarını hariç tut
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
}
