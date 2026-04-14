import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, type AdminRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { logError } from "@/lib/logger"
import { redis, tenantCacheKey, TENANT_CACHE_TTL } from "@/lib/redis"
import type { ApiSuccess, ApiError } from "@/types"

// ─── Response builder'lar ─────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function err(message: string, status = 400, code?: string): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message, code }, { status })
}

// ─── withErrorHandler — global try-catch sarıcı ───────────────────────────────
// Tüm route handler'ları bu ile sarılır.
// Beklenmeyen hatalar yakalanır, ErrorLogs tablosuna yazılır, 500 döner.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (req: NextRequest, ...rest: any[]) => Promise<NextResponse>

export function withErrorHandler<T extends AnyHandler>(fn: T, label: string): T {
  return (async (req: NextRequest, ...rest: unknown[]): Promise<NextResponse> => {
    try {
      return await fn(req, ...rest)
    } catch (error) {
      let tenantId: string | null = null
      let userEmail: string | null = null
      let userRole: string | null = null

      try {
        const session = await getServerSession(authOptions)
        if (session) {
          tenantId = session.user.tenant_id || null
          userEmail = session.user.email || null
          userRole = session.user.admin_role
            ? `${session.user.role}:${session.user.admin_role}`
            : session.user.role || null
        }
      } catch {
        // session alınamazsa devam et
      }

      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        null

      await logError({
        endpoint: label,
        method: req.method,
        error,
        statusCode: 500,
        tenantId,
        userEmail,
        userRole,
        ip,
      })

      console.error(`[${label}] Beklenmeyen hata:`, error)

      return err("Sunucu hatası oluştu", 500, "INTERNAL_ERROR")
    }
  }) as T
}

// ─── Tenant çözümleme ─────────────────────────────────────────────────────────

export async function getTenantFromRequest(req: NextRequest) {
  const raw = req.headers.get("x-tenant-id")
  if (!raw) return null

  // ── Redis cache kontrolü ──────────────────────────────────────────────────
  const cacheKey = tenantCacheKey(raw)
  try {
    const cached = await redis.get<string>(cacheKey)
    if (cached) {
      // Cache'te tenant ID var → direkt DB'den çek (ID ile hızlı)
      return db.tenant.findUnique({ where: { id: cached, is_active: true } })
    }
  } catch {
    // Redis hata verirse devam et
  }

  // ── DB'den çözümle ────────────────────────────────────────────────────────
  let tenant = null

  if (raw.startsWith("slug:")) {
    const slug = raw.slice(5)
    tenant = await db.tenant.findUnique({ where: { domain_slug: slug, is_active: true } })
  } else if (raw.startsWith("custom:")) {
    const domain = raw.slice(7)
    tenant = await db.tenant.findFirst({ where: { custom_domain: domain, is_active: true } })
  } else {
    tenant = await db.tenant.findUnique({ where: { id: raw, is_active: true } })
  }

  // ── Sonucu Redis'e yaz (5 dk TTL) ────────────────────────────────────────
  if (tenant) {
    try {
      await redis.set(cacheKey, tenant.id, { ex: TENANT_CACHE_TTL })
    } catch {
      // Cache yazma hata verirse sessizce devam et
    }
  }

  return tenant
}

// ─── Auth guard'lar ───────────────────────────────────────────────────────────

export async function requireTenantSession() {
  const session = await getServerSession(authOptions)
  if (!session) return { session: null, error: err("Giriş gerekli", 401) }
  if (session.user.role === "TENANT_OWNER") return { session, error: null }

  // Admin kullanıcı — ilk aktif tenant'ı kullan (panel önizleme)
  if (session.user.role === "PLATFORM_ADMIN") {
    const firstTenant = await db.tenant.findFirst({ where: { is_active: true }, select: { id: true } })
    if (firstTenant) {
      // session objesini klonla, tenant_id'yi set et
      const adminAsSession = {
        ...session,
        user: { ...session.user, tenant_id: firstTenant.id, role: "TENANT_OWNER" as const },
      }
      return { session: adminAsSession, error: null }
    }
  }

  return { session: null, error: err("Yetkisiz", 403) }
}

/** Herhangi bir admin rolü yeterli */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session) return { session: null, error: err("Giriş gerekli", 401) }
  if (session.user.role !== "PLATFORM_ADMIN") return { session: null, error: err("Yetkisiz", 403) }
  return { session, error: null }
}

/** Belirli admin rolleri zorunlu. Boş array: herhangi admin yeterli */
export async function requireAdminRole(...roles: AdminRole[]) {
  const session = await getServerSession(authOptions)
  if (!session) return { session: null, error: err("Giriş gerekli", 401) }
  if (session.user.role !== "PLATFORM_ADMIN") return { session: null, error: err("Yetkisiz", 403) }
  if (roles.length > 0 && !roles.includes(session.user.admin_role as AdminRole)) {
    return { session: null, error: err("Bu işlem için yetkiniz yok", 403) }
  }
  return { session, error: null }
}

/** Sadece SUPER_ADMIN */
export async function requireSuperAdmin() {
  return requireAdminRole("SUPER_ADMIN")
}

/** SUPER_ADMIN veya SUPPORT */
export async function requireSupportAccess() {
  return requireAdminRole("SUPER_ADMIN", "SUPPORT")
}

/** SUPER_ADMIN veya BILLING */
export async function requireBillingAccess() {
  return requireAdminRole("SUPER_ADMIN", "BILLING")
}

// ─── Request body parse ───────────────────────────────────────────────────────

export async function parseBody<T>(req: NextRequest): Promise<{ body: T | null; error: NextResponse | null }> {
  try {
    const body = (await req.json()) as T
    return { body, error: null }
  } catch {
    return { body: null, error: err("Geçersiz JSON", 400) }
  }
}

// ─── Tenant ID guard ──────────────────────────────────────────────────────────

export function assertTenantOwner(sessionTenantId: string, resourceTenantId: string) {
  if (sessionTenantId !== resourceTenantId) return err("Yetkisiz kaynak", 403)
  return null
}
