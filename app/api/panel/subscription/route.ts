import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { createPayTRToken, getActiveSubscription, calculatePricing, handleSuccessfulPayment } from "@/lib/paytr"
import { db } from "@/lib/db"
import crypto from "crypto"

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
      id: sub.id,
      plan_name: sub.plan.name,
      billing_period: sub.billing_period,
      net_amount: sub.net_amount,
      total_amount: sub.total_amount,
      starts_at: sub.starts_at.toISOString(),
      ends_at: sub.ends_at.toISOString(),
      status: sub.status,
    },
  })
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/subscription")

// POST /api/panel/subscription — PayTR iframe token oluştur (veya kuponla bedelsiz abonelik)
// Body: { plan_id, billing_period, billing_address_id, coupon_code? }
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const body = await req.json().catch(() => null)
  const planId: string = body?.plan_id
  const billingPeriod: string = body?.billing_period
  const billingAddressId: string = body?.billing_address_id
  const couponCode: string | undefined = body?.coupon_code

  if (!planId) return err("plan_id zorunlu")
  if (!billingPeriod || !["MONTHLY", "YEARLY"].includes(billingPeriod)) {
    return err("billing_period MONTHLY veya YEARLY olmalı")
  }
  if (!billingAddressId) return err("billing_address_id zorunlu")

  const plan = await db.plan.findUnique({ where: { id: planId } })
  if (!plan) return err("Plan bulunamadı", 404)

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { owner_name: true, owner_email: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  // Fatura adresi doğrula
  const billingAddress = await db.billingAddress.findUnique({ where: { id: billingAddressId } })
  if (!billingAddress || billingAddress.tenant_id !== tenantId) {
    return err("Fatura adresi bulunamadı", 404)
  }

  // Fiyat hesapla (KDV dahil)
  const pricing = calculatePricing(
    Number(plan.price_monthly),
    billingPeriod as "MONTHLY" | "YEARLY"
  )

  // ─── Kupon kontrolü ──────────────────────────────────────────────────
  let couponId: string | undefined
  let discountPercent = 0
  let finalTotalAmount = pricing.totalAmount
  let finalNetAmount = pricing.netAmount
  let discountAmount = 0

  if (couponCode) {
    const normalizedCode = couponCode.trim().toUpperCase()
    const coupon = await db.coupon.findUnique({ where: { code: normalizedCode } })

    if (!coupon) return err("Geçersiz kupon kodu")
    if (!coupon.is_active) return err("Bu kupon devre dışı")

    const now = new Date()
    if (now < coupon.valid_from || now > coupon.valid_until) return err("Kupon süresi geçmiş veya henüz geçerli değil")
    if (coupon.used_count >= coupon.max_uses) return err("Kupon kullanım limiti dolmuş")
    if (coupon.plan_id && coupon.plan_id !== planId) return err("Bu kupon seçili plan için geçerli değil")

    // Tenant daha önce kullanmış mı?
    const alreadyUsed = await db.couponUsage.findFirst({
      where: { coupon_id: coupon.id, tenant_id: tenantId },
    })
    if (alreadyUsed) return err("Bu kuponu daha önce kullandınız")

    couponId = coupon.id
    discountPercent = coupon.discount_percent
    discountAmount = Math.round(pricing.totalAmount * discountPercent / 100 * 100) / 100
    finalTotalAmount = Math.round((pricing.totalAmount - discountAmount) * 100) / 100
    finalNetAmount = Math.round((pricing.netAmount * (100 - discountPercent) / 100) * 100) / 100
  }

  // ─── %100 indirim — bedelsiz abonelik ──────────────────────────────
  if (discountPercent === 100 && couponId) {
    // PayTR'a istek atma, doğrudan abonelik oluştur
    await handleSuccessfulPayment({
      tenantId,
      planId,
      // merchant_oid: PayTR sadece alfanumerik kabul ediyor (alt çizgi/tire yasak)
      merchantOid: `FREE${crypto.randomBytes(6).toString("hex")}${Date.now()}`,
      billingPeriod: billingPeriod as "MONTHLY" | "YEARLY",
      netAmount: 0,
      totalAmount: 0,
      billingAddressId,
      couponId,
    })

    // Kupon kullanım kaydı + sayaç güncelle
    const sub = await getActiveSubscription(tenantId)
    await db.couponUsage.create({
      data: {
        coupon_id: couponId,
        tenant_id: tenantId,
        subscription_id: sub?.id,
        discount_amount: pricing.totalAmount,
        original_amount: pricing.totalAmount,
        final_amount: 0,
      },
    })
    await db.coupon.update({
      where: { id: couponId },
      data: { used_count: { increment: 1 } },
    })

    return ok({ free: true, subscription_id: sub?.id })
  }

  // ─── Normal ödeme akışı (indirimli veya indirimsiz) ────────────────
  // merchant_oid: PayTR sadece alfanumerik kabul ediyor (alt çizgi/tire yasak)
  const shortId = crypto.randomBytes(6).toString("hex")
  const merchantOid = `PAY${shortId}${Date.now()}`

  // PendingPayment kaydı oluştur
  await db.pendingPayment.create({
    data: {
      tenant_id: tenantId,
      plan_id: planId,
      billing_period: billingPeriod,
      billing_address_id: billingAddressId,
      merchant_oid: merchantOid,
      net_amount: finalNetAmount,
      total_amount: finalTotalAmount,
      coupon_id: couponId ?? null,
      status: "PENDING",
    },
  })

  const periodLabel = billingPeriod === "YEARLY" ? "Yıllık" : "Aylık"
  const userBasket = JSON.stringify([[`${plan.name} (${periodLabel})`, String(finalTotalAmount), 1]])

  const userAddress = `${billingAddress.address}, ${billingAddress.district}/${billingAddress.city}`
  const userPhone = billingAddress.phone

  const userIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"

  const paymentAmountKurus = Math.round(finalTotalAmount * 100)

  const result = await createPayTRToken({
    merchantOid,
    email: tenant.owner_email,
    paymentAmount: paymentAmountKurus,
    userBasket,
    userIp,
    userName: tenant.owner_name,
    userAddress,
    userPhone,
  })

  if (!result.success) {
    await db.pendingPayment.update({
      where: { merchant_oid: merchantOid },
      data: { status: "FAILED" },
    })
    return err(result.error ?? "PayTR token alınamadı", 502)
  }

  return ok({ token: result.token, merchant_oid: merchantOid })
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/subscription")
