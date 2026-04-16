import crypto from "crypto"
import { db } from "@/lib/db"

const PAYTR_API_URL = "https://www.paytr.com/odeme/api/get-token"
const PAYTR_REFUND_URL = "https://www.paytr.com/odeme/iade"
const PAYTR_REPORT_URL = "https://www.paytr.com/rapor/odeme-detayi"

// ─── KDV & Fiyatlandırma sabitleri ──────────────────────────────────────────
export const KDV_RATE = 0.20
export const YEARLY_MULTIPLIER = 9 // 9 ay öde, 12 ay kullan (3 ay hediye)

export function calculatePricing(priceMonthly: number, billingPeriod: "MONTHLY" | "YEARLY") {
  const netAmount = billingPeriod === "YEARLY"
    ? priceMonthly * YEARLY_MULTIPLIER
    : priceMonthly
  const kdvAmount = Math.round(netAmount * KDV_RATE * 100) / 100
  const totalAmount = Math.round((netAmount + kdvAmount) * 100) / 100
  const paymentAmountKurus = Math.round(totalAmount * 100)
  return { netAmount, kdvAmount, totalAmount, paymentAmountKurus }
}

// ─── Token üretme (iframe için) ──────────────────────────────────────────────

export type PayTRTokenParams = {
  merchantOid: string      // benzersiz sipariş numarası (max 64 karakter)
  email: string
  paymentAmount: number    // KURUŞ cinsinden
  userBasket: string       // JSON string (Base64 encode edilmemiş, fonksiyon içinde encode edilir)
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
  const merchantId = process.env.PAYTR_MERCHANT_ID
  const merchantKey = process.env.PAYTR_MERCHANT_KEY
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT
  const baseUrl = process.env.NEXTAUTH_URL

  if (!merchantId || !merchantKey || !merchantSalt) {
    return { success: false, error: "PayTR API bilgileri eksik (env değişkenleri)" }
  }
  if (!baseUrl) {
    return { success: false, error: "NEXTAUTH_URL tanımlı değil" }
  }

  const testMode = process.env.PAYTR_TEST_MODE === "1" ? "1" : "0"
  const noInstallment = "0"
  const maxInstallment = "0"
  const currency = "TL"

  // user_basket Base64 encode (PayTR gereksinimi) — hem hash'a hem form'a bu değer girer
  const encodedBasket = Buffer.from(params.userBasket, "utf-8").toString("base64")

  // Hash sırası: merchant_id | user_ip | merchant_oid | email | payment_amount
  //            | user_basket (base64) | no_installment | max_installment | currency | test_mode
  const hashStr =
    merchantId +
    params.userIp +
    params.merchantOid +
    params.email +
    params.paymentAmount +
    encodedBasket +
    noInstallment +
    maxInstallment +
    currency +
    testMode

  // Token: HMAC_SHA256(key = merchant_key, data = hash_str + merchant_salt), base64
  // (PayTR resmi örnekleri — PHP/Node ikisi de bu şekilde)
  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr + merchantSalt)
    .digest("base64")

  const formData = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: params.userIp,
    merchant_oid: params.merchantOid,
    email: params.email,
    payment_amount: String(params.paymentAmount),
    paytr_token: paytrToken,
    user_basket: encodedBasket,
    debug_on: testMode === "1" ? "1" : "0",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: params.userName,
    user_address: params.userAddress,
    user_phone: params.userPhone,
    merchant_ok_url: `${baseUrl}/panel/odeme-basarili`,
    merchant_fail_url: `${baseUrl}/panel/odeme-basarisiz`,
    timeout_limit: "30",
    currency,
    test_mode: testMode,
    lang: "tr",
  })

  try {
    // 15 saniye timeout — Vercel fonksiyonunu bekletmemek için
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    let res: Response
    try {
      res = await fetch(PAYTR_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    const rawBody = await res.text()

    let data: { status?: string; token?: string; reason?: string } = {}
    try {
      data = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      console.error("[PayTR] JSON parse hatası. HTTP:", res.status, "body:", rawBody.slice(0, 500))
      return {
        success: false,
        error: `PayTR geçersiz yanıt döndü (HTTP ${res.status})`,
      }
    }

    if (data.status !== "success") {
      console.error("[PayTR] Token reddedildi:", data.reason, "HTTP:", res.status)
      return { success: false, error: data.reason ?? `PayTR token alınamadı (HTTP ${res.status})` }
    }

    return { success: true, token: data.token }
  } catch (e: unknown) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "PayTR isteği zaman aşımına uğradı"
          : e.message
        : "Bağlantı hatası"
    console.error("[PayTR] createPayTRToken hatası:", msg)
    return { success: false, error: msg }
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

// ─── Ödeme Detay Servisi — belirli bir günün ödemelerini sorgular ───────────
// Webhook kaçırıldığında manuel mutabakat için kullanılır.
// date formatı: "YYYY-MM-DD"
// API response: { status: "success", detail_list: { sales: [...], returns: [...] } }
export type PayTRSaleRecord = {
  merchant_oid: string
  payment_amount?: number
  payment_total?: number
  paid_date?: string
  [key: string]: unknown
}

export async function queryPayTRPaymentsByDate(
  date: string
): Promise<{
  success: boolean
  sales?: PayTRSaleRecord[]
  returns?: PayTRSaleRecord[]
  error?: string
}> {
  const merchantId = process.env.PAYTR_MERCHANT_ID
  const merchantKey = process.env.PAYTR_MERCHANT_KEY
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT

  if (!merchantId || !merchantKey || !merchantSalt) {
    return { success: false, error: "PayTR env değişkenleri eksik" }
  }

  // hash: HMAC_SHA256(merchant_key, merchant_id + date + merchant_salt) → base64
  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(merchantId + date + merchantSalt)
    .digest("base64")

  const body = new URLSearchParams({
    merchant_id: merchantId,
    date,
    paytr_token: paytrToken,
  })

  try {
    const res = await fetch(PAYTR_REPORT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    const raw = await res.text()
    let data: {
      status?: string
      detail_list?: { sales?: PayTRSaleRecord[]; returns?: PayTRSaleRecord[] }
      err_msg?: string
    } = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      return { success: false, error: `PayTR geçersiz yanıt (HTTP ${res.status})` }
    }

    if (data.status !== "success") {
      return { success: false, error: data.err_msg ?? `PayTR rapor hatası (HTTP ${res.status})` }
    }

    return {
      success: true,
      sales: data.detail_list?.sales ?? [],
      returns: data.detail_list?.returns ?? [],
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Bağlantı hatası" }
  }
}

// ─── Fatura numarası üretici ─────────────────────────────────────────────────

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  const last = await db.invoice.findFirst({
    where: { invoice_number: { startsWith: prefix } },
    orderBy: { invoice_number: "desc" },
  })

  const seq = last ? parseInt(last.invoice_number.split("-")[2]) + 1 : 1
  return `${prefix}${String(seq).padStart(4, "0")}`
}

// ─── Ödeme başarılı — abonelik kaydı oluştur ─────────────────────────────────

export async function handleSuccessfulPayment({
  tenantId,
  planId,
  merchantOid,
  billingPeriod,
  netAmount,
  totalAmount,
  billingAddressId,
  couponId,
}: {
  tenantId: string
  planId: string
  merchantOid: string
  billingPeriod: "MONTHLY" | "YEARLY"
  netAmount: number
  totalAmount: number
  billingAddressId: string
  couponId?: string
}): Promise<void> {
  const now = new Date()
  const endsAt = new Date(now)

  if (billingPeriod === "YEARLY") {
    endsAt.setFullYear(endsAt.getFullYear() + 1)
  } else {
    endsAt.setMonth(endsAt.getMonth() + 1)
  }

  // Mevcut aktif aboneliği EXPIRED yap
  await db.tenantSubscription.updateMany({
    where: { tenant_id: tenantId, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  })

  // KDV hesapla
  const kdvAmount = Math.round((totalAmount - netAmount) * 100) / 100

  // Yeni abonelik kaydı
  const subscription = await db.tenantSubscription.create({
    data: {
      tenant_id: tenantId,
      plan_id: planId,
      paytr_ref: merchantOid,
      billing_period: billingPeriod,
      net_amount: netAmount,
      total_amount: totalAmount,
      billing_address_id: billingAddressId,
      coupon_id: couponId ?? null,
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

  // Fatura kaydı oluştur
  const invoiceNumber = await generateInvoiceNumber()
  await db.invoice.create({
    data: {
      subscription_id: subscription.id,
      billing_address_id: billingAddressId,
      invoice_number: invoiceNumber,
      net_amount: netAmount,
      kdv_rate: 20,
      kdv_amount: kdvAmount,
      total_amount: totalAmount,
      status: "FATURA_BEKLIYOR",
    },
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

  // PayTR iade API'si return_amount'u TL cinsinden istiyor (nokta ayraçlı)
  const returnAmountTL = (amount / 100).toFixed(2)

  const hashStr = merchantId + merchantOid + returnAmountTL + merchantSalt
  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64")

  const formData = new URLSearchParams({
    merchant_id: merchantId,
    merchant_oid: merchantOid,
    return_amount: returnAmountTL,
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

  return expiring.map((s) => s.tenant.owner_email)
}
