import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PLATFORM_HOSTS = new Set([
  "randevya.com",
  "www.randevya.com",
])

function isPlatformDomain(host: string): boolean {
  const h = host.split(":")[0] // port'u kaldır (localhost:3003)
  return PLATFORM_HOSTS.has(h) || h === "localhost"
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

  // ─── Custom domain (müşteri işletme domaini) ────────────────────────────

  // Panel ve admin erişimi custom domain'de engelle
  if (pathname.startsWith("/panel") || pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // x-tenant-id header'ını REQUEST'e ekle — server component'ler ve API route'lar okur
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-tenant-id", `custom:${host}`)

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
