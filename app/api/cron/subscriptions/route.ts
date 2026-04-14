import { NextRequest, NextResponse } from "next/server"
import { notifyExpiringSubscriptions } from "@/lib/paytr"
import { sendSubscriptionExpiredEmail } from "@/lib/email"
import { db } from "@/lib/db"
import { removeDomainFromVercel } from "@/lib/vercel-domains"
import { withErrorHandler } from "@/lib/api-helpers"

// GET /api/cron/subscriptions — abonelik bitmeden 3 gün önce uyarı + süresi dolmuşları pasife al + plan düşür
// Vercel Cron: her gün saat 08:00'da çalışır
// vercel.json: { "crons": [{ "path": "/api/cron/subscriptions", "schedule": "0 5 * * *" }] }
async function getHandler(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  const results = { notified: 0, deactivated: 0, downgraded: 0, domains_removed: 0, errors: 0 }

  // 1. Bitmek üzere olan abonelikleri bildir
  try {
    const emails = await notifyExpiringSubscriptions()
    for (const email of emails) {
      console.log(`[Cron/subscriptions] Uyarı gönderildi: ${email}`)
      results.notified++
    }
  } catch (e) {
    console.error("[Cron/subscriptions] Bildirim hatası:", e)
    results.errors++
  }

  // 2. Süresi dolmuş aktif abonelikleri EXPIRED yap
  try {
    // Önce süresi dolacak aboneliklerin tenant ID'lerini al (plan düşürme için)
    const expiringSubs = await db.tenantSubscription.findMany({
      where: { status: "ACTIVE", ends_at: { lt: new Date() } },
      select: { id: true, tenant_id: true },
    })

    if (expiringSubs.length > 0) {
      // Abonelikleri EXPIRED yap
      await db.tenantSubscription.updateMany({
        where: { id: { in: expiringSubs.map((s) => s.id) } },
        data: { status: "EXPIRED" },
      })
      results.deactivated = expiringSubs.length

      // 3. Plan düşürme — en ucuz (deneme) planına düşür
      const trialPlan = await db.plan.findFirst({
        orderBy: { price_monthly: "asc" },
      })

      if (trialPlan) {
        const tenantIds = [...new Set(expiringSubs.map((s) => s.tenant_id))]

        for (const tenantId of tenantIds) {
          // Bu tenant'ın başka aktif aboneliği var mı kontrol et
          const otherActive = await db.tenantSubscription.findFirst({
            where: { tenant_id: tenantId, status: "ACTIVE", ends_at: { gt: new Date() } },
          })

          // Başka aktif aboneliği yoksa plan düşür
          if (!otherActive) {
            const tenant = await db.tenant.findUnique({
              where: { id: tenantId },
              select: { id: true, custom_domain: true, plan_id: true },
            })

            if (tenant) {
              // Plan düşür
              await db.tenant.update({
                where: { id: tenantId },
                data: { plan_id: trialPlan.id },
              })
              results.downgraded++

              // Abonelik süresi doldu e-postası gönder
              const fullTenant = await db.tenant.findUnique({
                where: { id: tenantId },
                include: { plan: true },
              })
              if (fullTenant) {
                sendSubscriptionExpiredEmail({
                  tenantId,
                  tenantEmail: fullTenant.owner_email,
                  tenantName: fullTenant.owner_name,
                  planName: fullTenant.plan.name,
                }).catch((e) => console.error(`[Cron/subscriptions] Expired email hatası (${tenantId}):`, e))
              }

              // Custom domain varsa ve yeni plan'da custom_domain yoksa → kaldır
              if (tenant.custom_domain && !trialPlan.custom_domain) {
                try {
                  await removeDomainFromVercel(tenant.custom_domain)
                  await db.tenant.update({
                    where: { id: tenantId },
                    data: { custom_domain: null },
                  })
                  results.domains_removed++
                  console.log(`[Cron/subscriptions] Domain kaldırıldı: ${tenant.custom_domain} (tenant: ${tenantId})`)
                } catch (e) {
                  console.error(`[Cron/subscriptions] Domain kaldırma hatası (${tenant.custom_domain}):`, e)
                  results.errors++
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("[Cron/subscriptions] Expire/downgrade hatası:", e)
    results.errors++
  }

  return NextResponse.json({ success: true, ran_at: new Date().toISOString(), ...results })
}
export const GET = withErrorHandler(getHandler, "GET /api/cron/subscriptions")
