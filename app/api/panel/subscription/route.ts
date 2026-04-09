import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { createPayTRToken, getActiveSubscription } from "@/lib/paytr"
import { db } from "@/lib/db"

// GET /api/panel/subscription — mevcut abonelik durumu
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const sub = await getActiveSubscription(session!.user.tenant_id)

  if (!sub) {
    return ok({ active: false, subscription: null })
  }

  return ok({
    active: true,
    subscription: {
      plan_name: sub.plan.name,
      starts_at: sub.starts_at.toISOString(),
      ends_at: sub.ends_at.toISOString(),
      status: sub.status,
    },
  })
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/subscription")

// POST /api/panel/subscription — PayTR iframe token oluştur
// Body: { plan_id: string }
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const body = await req.json().catch(() => null)
  const planId: string = body?.plan_id

  if (!planId) return err("plan_id zorunlu")

  const plan = await db.plan.findUnique({ where: { id: planId } })
  if (!plan) return err("Plan bulunamadı", 404)

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { owner_name: true, owner_email: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  // Benzersiz sipariş numarası: {tenantId}_{planId}_{timestamp}
  const merchantOid = `${tenantId}_${planId}_${Date.now()}`

  // Miktar kuruş cinsinden (₺299 = 29900)
  const paymentAmount = Math.round(Number(plan.price_monthly) * 100)

  const userBasket = JSON.stringify([[plan.name, String(plan.price_monthly), 1]])

  // İstemci IP'sini al
  const userIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"

  const result = await createPayTRToken({
    tenantId,
    planId,
    merchantOid,
    email: tenant.owner_email,
    paymentAmount,
    userBasket,
    userIp,
    userName: tenant.owner_name,
    userAddress: "Türkiye",
    userPhone: "05000000000", // İsteğe bağlı — işletme profilinde saklanabilir
  })

  if (!result.success) {
    return err(result.error ?? "PayTR token alınamadı", 502)
  }

  return ok({ token: result.token, merchant_oid: merchantOid })
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/subscription")
