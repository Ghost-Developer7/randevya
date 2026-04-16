/**
 * Manuel ödeme mutabakat scripti
 *
 * Webhook kaçırıldığında çalıştırılır. Tek bir PendingPayment'i PayTR'den
 * sorgular; ödeme başarılı ise abonelik + fatura oluşturur.
 *
 * Kullanım:
 *   npx tsx scripts/reconcile-payment.ts <merchant_oid> [--force]
 *
 * --force: PayTR sorgulaması başarısız olsa bile manuel tamamla (dikkatli kullan).
 */
import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaMssql } from "@prisma/adapter-mssql"
import crypto from "crypto"

const PAYTR_REPORT_URL = "https://www.paytr.com/rapor/odeme-detayi"

const adapter = new PrismaMssql(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

async function queryPayTR(date: string) {
  const merchantId = process.env.PAYTR_MERCHANT_ID!
  const merchantKey = process.env.PAYTR_MERCHANT_KEY!
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT!

  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(merchantId + date + merchantSalt)
    .digest("base64")

  const body = new URLSearchParams({
    merchant_id: merchantId,
    date,
    paytr_token: paytrToken,
  })

  const res = await fetch(PAYTR_REPORT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  const raw = await res.text()
  return { status: res.status, body: raw, parsed: (() => { try { return JSON.parse(raw) } catch { return null } })() }
}

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

async function completePayment(merchantOid: string) {
  const pending = await db.pendingPayment.findUnique({
    where: { merchant_oid: merchantOid },
  })
  if (!pending) throw new Error(`PendingPayment bulunamadı: ${merchantOid}`)
  if (pending.status !== "PENDING") {
    console.log(`  Zaten işlenmiş: ${pending.status}`)
    return
  }

  const now = new Date()
  const endsAt = new Date(now)
  if (pending.billing_period === "YEARLY") endsAt.setFullYear(endsAt.getFullYear() + 1)
  else endsAt.setMonth(endsAt.getMonth() + 1)

  // Eski aktif abonelikleri EXPIRED yap
  await db.tenantSubscription.updateMany({
    where: { tenant_id: pending.tenant_id, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  })

  const kdvAmount = Math.round((Number(pending.total_amount) - Number(pending.net_amount)) * 100) / 100

  const subscription = await db.tenantSubscription.create({
    data: {
      tenant_id: pending.tenant_id,
      plan_id: pending.plan_id,
      paytr_ref: merchantOid,
      billing_period: pending.billing_period,
      net_amount: pending.net_amount,
      total_amount: pending.total_amount,
      billing_address_id: pending.billing_address_id,
      coupon_id: pending.coupon_id ?? null,
      starts_at: now,
      ends_at: endsAt,
      status: "ACTIVE",
    },
  })

  await db.tenant.update({
    where: { id: pending.tenant_id },
    data: { plan_id: pending.plan_id },
  })

  const invoiceNumber = await generateInvoiceNumber()
  await db.invoice.create({
    data: {
      subscription_id: subscription.id,
      billing_address_id: pending.billing_address_id,
      invoice_number: invoiceNumber,
      net_amount: pending.net_amount,
      kdv_rate: 20,
      kdv_amount: kdvAmount,
      total_amount: pending.total_amount,
      status: "FATURA_BEKLIYOR",
    },
  })

  await db.pendingPayment.update({
    where: { merchant_oid: merchantOid },
    data: { status: "COMPLETED" },
  })

  console.log(`  ✓ Abonelik oluşturuldu: ${subscription.id}`)
  console.log(`  ✓ Fatura: ${invoiceNumber}`)
  console.log(`  ✓ Tenant plan_id → ${pending.plan_id}`)
}

async function main() {
  const merchantOid = process.argv[2]
  const force = process.argv.includes("--force")

  if (!merchantOid) {
    console.error("Kullanım: npx tsx scripts/reconcile-payment.ts <merchant_oid> [--force]")
    process.exit(1)
  }

  const pending = await db.pendingPayment.findUnique({ where: { merchant_oid: merchantOid } })
  if (!pending) {
    console.error(`PendingPayment bulunamadı: ${merchantOid}`)
    process.exit(1)
  }

  console.log(`PendingPayment:`)
  console.log(`  merchant_oid: ${pending.merchant_oid}`)
  console.log(`  status: ${pending.status}`)
  console.log(`  total: ${pending.total_amount} TL`)
  console.log(`  created: ${pending.created_at.toISOString()}`)

  // Ödemenin yapıldığı tarihi (UTC → yerel) PayTR'e sor
  const createdDate = pending.created_at
  const datesToCheck = [
    new Date(createdDate.getTime() - 24 * 3600_000),
    createdDate,
    new Date(createdDate.getTime() + 24 * 3600_000),
  ].map((d) => d.toISOString().split("T")[0])

  console.log(`\nPayTR sorgulanıyor (${datesToCheck.join(", ")})...`)

  let matched: { merchant_oid: string; payment_total?: number } | null = null
  for (const date of datesToCheck) {
    const q = await queryPayTR(date)
    if (q.parsed?.status === "success") {
      const sales: Array<{ merchant_oid: string; payment_total?: number }> =
        q.parsed.detail_list?.sales ?? q.parsed.payments ?? []
      console.log(`  ${date}: ${sales.length} başarılı satış bulundu`)
      const found = sales.find((p) => p.merchant_oid === merchantOid)
      if (found) {
        matched = found
        console.log(`  ✓ Eşleşti:`, JSON.stringify(found))
        break
      }
    } else {
      console.log(`  ${date}: ${q.parsed?.err_msg ?? q.body.slice(0, 200)}`)
    }
  }

  if (!matched && !force) {
    console.error(
      `\n✗ PayTR kayıtlarında ${merchantOid} bulunamadı. Ödeme başarısız olmuş olabilir.\n` +
        `   Emin isen --force ile tekrar çalıştırabilirsin.`
    )
    process.exit(2)
  }

  if (matched) {
    const expectedKurus = Math.round(Number(pending.total_amount) * 100)
    const paidKurus = matched.payment_total ?? 0
    if (paidKurus !== expectedKurus) {
      console.warn(
        `  ! Ödenen tutar (${paidKurus} kuruş) beklenen tutarla (${expectedKurus} kuruş) eşleşmiyor`
      )
    }
  }

  console.log(`\nAbonelik + fatura oluşturuluyor...`)
  await completePayment(merchantOid)
  console.log(`\n✓ Tamamlandı.`)
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); process.exit(1) })
