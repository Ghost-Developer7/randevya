import { NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const RANDEVYA_DOMAIN = "randevya.com"
const TENANT_CACHE_TTL = 60 * 5 // 5 dakika

// Edge runtime'da çalışacak hafif Redis istemcisi
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? ""
  const pathname = req.nextUrl.pathname

  // Admin, API, Next.js internal ve static dosyalar için atla
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Tenant çözümleme: önce Redis cache, yoksa header'a slug yaz
  const tenantId = await resolveTenant(host, req)

  if (!tenantId) {
    // Platform ana sayfası veya 404
    if (host === RANDEVYA_DOMAIN || host === `www.${RANDEVYA_DOMAIN}`) {
      return NextResponse.next()
    }
    return NextResponse.rewrite(new URL("/not-found", req.url))
  }

  // Tenant bilgisini header'a ekle — server component'ler ve API route'lar okur
  const response = NextResponse.next()
  response.headers.set("x-tenant-id", tenantId)
  response.headers.set("x-tenant-host", host)
  return response
}

async function resolveTenant(host: string, req: NextRequest): Promise<string | null> {
  const cacheKey = `tenant_host:${host}`

  // 1. Redis cache kontrolü
  const redis = getRedis()
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey)
      if (cached) return cached
    } catch {
      // Redis hata verirse devam et
    }
  }

  // 2. DB sorgusu için API route'a proxy — middleware edge'de Prisma çalıştıramaz
  //    tenant ID'yi app'e bir header aracılığıyla geçiriyoruz; asıl çözümleme
  //    layout.tsx içinde getTenantByHost() ile yapılır.
  //    Bu middleware yalnızca custom domain → slug yönlendirmesini yapar.

  // Custom domain mi? (app.randevya.com veya alt domain değil)
  const isCustomDomain =
    !host.endsWith(`.${RANDEVYA_DOMAIN}`) && host !== RANDEVYA_DOMAIN

  // Subdomain: hiralamerkezi.randevya.com → slug = "hiralamerkezi"
  const subdomainMatch = host.match(new RegExp(`^(.+)\\.${RANDEVYA_DOMAIN.replace(".", "\\.")}$`))
  const slug = subdomainMatch?.[1] ?? null

  // Slug veya custom domain bilgisini header'a yaz; asıl DB sorgusu layout'ta
  if (isCustomDomain || slug) {
    const identifier = isCustomDomain ? `custom:${host}` : `slug:${slug}`
    return identifier  // layout.tsx bu değerle getTenantByHost çağırır
  }

  return null
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
