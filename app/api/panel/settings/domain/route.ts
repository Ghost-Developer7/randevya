import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { redis, tenantCacheKey } from "@/lib/redis"
import dns from "dns/promises"

const RANDEVYA_CNAME_TARGET = "cname.vercel-dns.com"  // Vercel custom domain CNAME hedefi

// POST /api/panel/settings/domain — custom domain bağla veya doğrula
// Body: { domain: "takvim.firmam.com" } — bağlamak için
// Body: { action: "verify" }            — doğrulama kontrolü için
// Body: { action: "remove" }            — domain kaldırmak için
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz JSON")

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { custom_domain: true, domain_slug: true, plan: { select: { custom_domain: true } } },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  // Plan custom domain destekliyor mu?
  if (!tenant.plan.custom_domain) {
    return err("Planınız custom domain özelliğini desteklemiyor. Pro veya üstü bir plana geçin.", 403)
  }

  const { action, domain } = body as { action?: string; domain?: string }

  // ── Domain kaldır ──────────────────────────────────────────────────────────
  if (action === "remove") {
    if (tenant.custom_domain) {
      // Redis cache'i temizle
      await redis.del(tenantCacheKey(`custom:${tenant.custom_domain}`)).catch(() => {})
    }
    await db.tenant.update({ where: { id: tenantId }, data: { custom_domain: null } })
    return ok({ removed: true })
  }

  // ── Mevcut domain'i doğrula ────────────────────────────────────────────────
  if (action === "verify") {
    if (!tenant.custom_domain) return err("Bağlı domain yok")
    const verified = await checkCname(tenant.custom_domain)
    return ok({ domain: tenant.custom_domain, verified })
  }

  // ── Yeni domain bağla ──────────────────────────────────────────────────────
  if (!domain?.trim()) return err("domain zorunlu")

  const domainClean = domain.toLowerCase().trim()

  // Format kontrolü (alt domain veya bare domain)
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domainClean)) {
    return err("Geçersiz domain formatı")
  }

  // Başka bir tenant bu domain'i kullanıyor mu?
  const taken = await db.tenant.findFirst({
    where: { custom_domain: domainClean, id: { not: tenantId } },
  })
  if (taken) return err("Bu domain başka bir hesaba bağlı", 409)

  // Domain'i kaydet (henüz aktif değil — CNAME doğrulanmamış)
  await db.tenant.update({
    where: { id: tenantId },
    data: { custom_domain: domainClean },
  })

  // CNAME kontrolü yap
  const verified = await checkCname(domainClean)

  return ok({
    domain: domainClean,
    verified,
    instructions: verified
      ? null
      : {
          message: `DNS ayarlarına aşağıdaki CNAME kaydını ekleyin:`,
          record: { type: "CNAME", name: domainClean, value: RANDEVYA_CNAME_TARGET },
          note: "DNS değişikliklerinin yayılması 24 saate kadar sürebilir.",
        },
  })
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/settings/domain")

// GET /api/panel/settings/domain — mevcut domain durumu
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenant = await db.tenant.findUnique({
    where: { id: session!.user.tenant_id },
    select: { custom_domain: true, domain_slug: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  let verified = false
  if (tenant.custom_domain) {
    verified = await checkCname(tenant.custom_domain)
  }

  return ok({
    slug_url: `https://app.randevya.com/${tenant.domain_slug}`,
    custom_domain: tenant.custom_domain,
    verified,
    cname_target: RANDEVYA_CNAME_TARGET,
  })
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/settings/domain")

// DNS CNAME kaydını doğrula
async function checkCname(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveCname(domain)
    return records.some((r) => r.includes("vercel") || r === RANDEVYA_CNAME_TARGET)
  } catch {
    return false
  }
}
