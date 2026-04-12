import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { redis, tenantCacheKey } from "@/lib/redis"
import {
  addDomainToVercel,
  removeDomainFromVercel,
  verifyDomainOnVercel,
  getDomainConfig,
} from "@/lib/vercel-domains"

// ─── GET — Mevcut domain durumunu getir ──────────────────────────────────────
async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params
  const tenant = await db.tenant.findUnique({
    where: { id },
    select: { custom_domain: true, domain_slug: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  let vercelStatus = null
  let dnsStatus = null

  if (tenant.custom_domain) {
    const [verify, dns] = await Promise.all([
      verifyDomainOnVercel(tenant.custom_domain),
      getDomainConfig(tenant.custom_domain),
    ])
    vercelStatus = verify
    dnsStatus = dns
  }

  return ok({
    domain_slug: tenant.domain_slug,
    custom_domain: tenant.custom_domain,
    vercel: vercelStatus,
    dns: dnsStatus,
  })
}
export const GET = withErrorHandler(getHandler, "GET /api/admin/tenants/[id]/domain")

// ─── POST — Domain ekle, Vercel'e kaydet, DNS talimatı ver ──────────────────
// Body: { domain: "takvim.firmam.com" }
// Body: { action: "verify" }   → mevcut domain'i doğrula
// Body: { action: "remove" }   → domain'i kaldır
async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz JSON")

  const tenant = await db.tenant.findUnique({
    where: { id },
    select: { id: true, custom_domain: true, domain_slug: true, plan: { select: { custom_domain: true } } },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  const { action, domain } = body as { action?: string; domain?: string }

  // ── Domain kaldır ──────────────────────────────────────────────────────────
  if (action === "remove") {
    if (!tenant.custom_domain) return err("Bağlı domain yok")

    // Vercel'den kaldır
    const vercelResult = await removeDomainFromVercel(tenant.custom_domain)
    if (!vercelResult.success) {
      return err(`Vercel'den kaldırılamadı: ${vercelResult.error}`, 500)
    }

    // Redis cache temizle
    await redis.del(tenantCacheKey(`custom:${tenant.custom_domain}`)).catch(() => {})

    // DB'den kaldır
    await db.tenant.update({ where: { id }, data: { custom_domain: null } })

    return ok({ removed: true })
  }

  // ── Mevcut domain'i doğrula ────────────────────────────────────────────────
  if (action === "verify") {
    if (!tenant.custom_domain) return err("Bağlı domain yok")

    const [vercel, dns] = await Promise.all([
      verifyDomainOnVercel(tenant.custom_domain),
      getDomainConfig(tenant.custom_domain),
    ])

    return ok({
      domain: tenant.custom_domain,
      vercel_verified: vercel.verified,
      dns_configured: dns.configured,
    })
  }

  // ── Yeni domain bağla ──────────────────────────────────────────────────────
  if (!domain?.trim()) return err("domain alanı zorunlu")

  const domainClean = domain.toLowerCase().trim()

  // Format kontrolü
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domainClean)) {
    return err("Geçersiz domain formatı (örn: takvim.firmam.com)")
  }

  // Başka tenant kullanıyor mu?
  const taken = await db.tenant.findFirst({
    where: { custom_domain: domainClean, id: { not: id } },
  })
  if (taken) return err("Bu domain başka bir işletmeye bağlı", 409)

  // Eski domain varsa önce Vercel'den kaldır
  if (tenant.custom_domain && tenant.custom_domain !== domainClean) {
    await removeDomainFromVercel(tenant.custom_domain)
    await redis.del(tenantCacheKey(`custom:${tenant.custom_domain}`)).catch(() => {})
  }

  // 1. Vercel'e domain ekle
  const vercelResult = await addDomainToVercel(domainClean)
  if (!vercelResult.success) {
    return err(`Vercel'e eklenemedi: ${vercelResult.error}`, 500)
  }

  // 2. DB'ye kaydet
  await db.tenant.update({
    where: { id },
    data: { custom_domain: domainClean },
  })

  // 3. DNS durumunu kontrol et
  const dns = await getDomainConfig(domainClean)

  return ok({
    domain: domainClean,
    vercel_added: true,
    dns_configured: dns.configured,
    instructions: dns.configured
      ? null
      : {
          message: "Müşteriye aşağıdaki DNS ayarını yapmasını söyleyin:",
          records: [
            {
              type: "CNAME",
              name: domainClean.split(".")[0], // subdomain kısmı
              value: "cname.vercel-dns.com",
              note: "Alt domain için (ör: takvim.firmam.com)",
            },
            {
              type: "A",
              name: "@",
              value: "76.76.21.21",
              note: "Root domain için (ör: firmam.com)",
            },
          ],
          warning: "DNS değişikliklerinin yayılması 24 saate kadar sürebilir.",
        },
  })
}
export const POST = withErrorHandler(postHandler, "POST /api/admin/tenants/[id]/domain")
