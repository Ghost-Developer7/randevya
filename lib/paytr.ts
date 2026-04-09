import crypto from "crypto"
import { db } from "@/lib/db"

const PAYTR_API_URL = "https://www.paytr.com/odeme/api/get-token"

// ─── Token üretme (iframe için) ──────────────────────────────────────────────

export type PayTRTokenParams = {
  tenantId: string
  planId: string
  merchantOid: string      // benzersiz sipariş numarası
  email: string
  paymentAmount: number    // KURUŞ cinsinden (₺299 = 29900)
  userBasket: string       // JSON string: [["Plan adı", "fiyat", 1]]
  userIp: string
  userName: string
  userAddress: string
  userPhone: string
}

export async function createPayTRToken(params: PayTRTokenParams): Promise<{
  success: boolean
  token?: string
  error?: string
}> {
  const merchantId = process.env.PAYTR_MERCHANT_ID!
  const merchantKey = process.env.PAYTR_MERCHANT_KEY!
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT!

  // Hash oluştur
  const hashStr =
    merchantId +
    params.userIp +
    params.merchantOid +
    params.email +
    params.paymentAmount +
    params.userBasket +
    "0" + // no_installment
    "0" + // max_installment
    "TL" +
    "1"   // test_mode — production'da "0" yap

  const paytrToken = crypto
    .createHmac("sha256", merchantKey + merchantSalt)
    .update(hashStr)
    .digest("base64")

  const formData = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: params.userIp,
    merchant_oid: params.merchantOid,
    email: params.email,
    payment_amount: String(params.paymentAmount),
    paytr_token: paytrToken,
    user_basket: params.userBasket,
    debug_on: "0",
    no_installment: "0",
    max_installment: "0",
    user_name: params.userName,
    user_address: params.userAddress,
    user_phone: params.userPhone,
    merchant_ok_url: `${process.env.NEXTAUTH_URL}/api/webhooks/paytr/ok`,
    merchant_fail_url: `${process.env.NEXTAUTH_URL}/api/webhooks/paytr/fail`,
    timeout_limit: "30",
    currency: "TL",
    test_mode: process.env.NODE_ENV === "production" ? "0" : "1",
    lang: "tr",
  })

  try {
    const res = await fetch(PAYTR_API_URL, {
      method: "POST",
      body: formData,
    })
    const data = (await res.json()) as { status: string; token?: string; reason?: string }

    if (data.status !== "success") {
      return { success: false, error: data.reason ?? "PayTR token alınamadı" }
    }

    return { success: true, token: data.token }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Bağlantı hatası" }
  }
}

// ─── Webhook doğrulama (PayTR'dan gelen bildirim) ────────────────────────────

export function verifyPayTRWebhook(params: {
  merchantOid: string
  status: string
  totalAmount: string
  hash: string
}): boolean {
  const merchantKey = process.env.PAYTR_MERCHANT_KEY!
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT!

  const hashStr = params.merchantOid + merchantSalt + params.status + params.totalAmount
  const expected = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64")

  return expected === params.hash
}

// ─── Ödeme başarılı — abonelik kaydı oluştur ─────────────────────────────────

export async function handleSuccessfulPayment({
  tenantId,
  planId,
  merchantOid,
}: {
  tenantId: string
  planId: string
  merchantOid: string
}): Promise<void> {
  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setMonth(endsAt.getMonth() + 1)  // 1 aylık abonelik

  // Mevcut aktif aboneliği EXPIRED yap
  await db.tenantSubscription.updateMany({
    where: { tenant_id: tenantId, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  })

  // Yeni abonelik kaydı
  await db.tenantSubscription.create({
    data: {
      tenant_id: tenantId,
      plan_id: planId,
      paytr_ref: merchantOid,
      starts_at: now,
      ends_at: endsAt,
      status: "ACTIVE",
    },
  })

  // Tenant'ın plan_id'sini güncelle
  await db.tenant.update({
    where: { id: tenantId },
    data: { plan_id: planId },
  })
}

// ─── Abonelik durumu kontrolü ─────────────────────────────────────────────────

export async function getActiveSubscription(tenantId: string) {
  return db.tenantSubscription.findFirst({
    where: {
      tenant_id: tenantId,
      status: "ACTIVE",
      ends_at: { gt: new Date() },
    },
    include: { plan: true },
    orderBy: { ends_at: "desc" },
  })
}

export async function isSubscriptionActive(tenantId: string): Promise<boolean> {
  const sub = await getActiveSubscription(tenantId)
  return sub !== null
}

// ─── İade (refund) ───────────────────────────────────────────────────────────

const PAYTR_REFUND_URL = "https://www.paytr.com/odeme/iade"

export async function refundPayment({
  merchantOid,
  amount,
  subscriptionId,
}: {
  merchantOid: string
  amount: number   // kuruş cinsinden
  subscriptionId: string
}): Promise<{ success: boolean; error?: string }> {
  const merchantId = process.env.PAYTR_MERCHANT_ID!
  const merchantKey = process.env.PAYTR_MERCHANT_KEY!
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT!

  const hashStr = merchantId + merchantOid + amount + merchantSalt
  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64")

  const formData = new URLSearchParams({
    merchant_id: merchantId,
    merchant_oid: merchantOid,
    return_amount: String(amount),
    paytr_token: paytrToken,
  })

  try {
    const res = await fetch(PAYTR_REFUND_URL, {
      method: "POST",
      body: formData,
    })
    const data = (await res.json()) as { status: string; err_no?: string; err_msg?: string }

    if (data.status !== "success") {
      return { success: false, error: data.err_msg ?? `PayTR hata: ${data.err_no}` }
    }

    // Aboneliği REFUNDED olarak işaretle
    await db.tenantSubscription.update({
      where: { id: subscriptionId },
      data: { status: "REFUNDED" },
    })

    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Bağlantı hatası" }
  }
}

// ─── Abonelik bitmeden 3 gün önce uyarı (cron çağırır) ───────────────────────

export async function notifyExpiringSubscriptions(): Promise<string[]> {
  const threeDaysLater = new Date()
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)
  const threeDaysLaterEnd = new Date(threeDaysLater)
  threeDaysLaterEnd.setHours(23, 59, 59)

  const expiring = await db.tenantSubscription.findMany({
    where: {
      status: "ACTIVE",
      ends_at: {
        gte: new Date(threeDaysLater.setHours(0, 0, 0)),
        lte: threeDaysLaterEnd,
      },
    },
    include: { tenant: true },
  })

  // Bildirim gönderilecek email listesi döndür
  return expiring.map((s) => s.tenant.owner_email)
}
