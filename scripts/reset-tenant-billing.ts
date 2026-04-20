/**
 * Tenant'ın ödeme / abonelik / fatura kayıtlarını temizler.
 * Yeni üye gibi sıfırlar, ardından deneme süresi DOLMUŞ bir TRIAL abonelik yaratır.
 *
 * Kullanım:
 *   npx tsx scripts/reset-tenant-billing.ts <owner_email>
 */
import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaMssql } from "@prisma/adapter-mssql"

const adapter = new PrismaMssql(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error("Kullanım: npx tsx scripts/reset-tenant-billing.ts <owner_email>")
    process.exit(1)
  }

  const tenant = await db.tenant.findFirst({ where: { owner_email: email } })
  if (!tenant) {
    console.error(`Tenant bulunamadı: ${email}`)
    process.exit(1)
  }

  console.log(`Tenant: ${tenant.company_name} (${tenant.domain_slug}) / ${tenant.id}\n`)

  // Fatura sayısı
  const invoiceCount = await db.invoice.count({
    where: { subscription: { tenant_id: tenant.id } },
  })
  const subCount = await db.tenantSubscription.count({ where: { tenant_id: tenant.id } })
  const pendingCount = await db.pendingPayment.count({ where: { tenant_id: tenant.id } })
  const couponUsageCount = await db.couponUsage.count({ where: { tenant_id: tenant.id } })

  console.log(`Silinecek kayıtlar:`)
  console.log(`  Invoice         : ${invoiceCount}`)
  console.log(`  Subscription    : ${subCount}`)
  console.log(`  PendingPayment  : ${pendingCount}`)
  console.log(`  CouponUsage     : ${couponUsageCount}`)

  // Invoice → Subscription'a bağlı, önce onu sil
  await db.invoice.deleteMany({
    where: { subscription: { tenant_id: tenant.id } },
  })
  console.log(`  ✓ Invoice silindi`)

  // CouponUsage → Subscription'a bağlı olabilir
  await db.couponUsage.deleteMany({ where: { tenant_id: tenant.id } })
  console.log(`  ✓ CouponUsage silindi`)

  // Subscription
  await db.tenantSubscription.deleteMany({ where: { tenant_id: tenant.id } })
  console.log(`  ✓ Subscription silindi`)

  // PendingPayment
  await db.pendingPayment.deleteMany({ where: { tenant_id: tenant.id } })
  console.log(`  ✓ PendingPayment silindi`)

  // Tenant plan_id'yi en ucuz plana (Başlangıç) sıfırla
  const starterPlan = await db.plan.findFirst({ orderBy: { price_monthly: "asc" } })
  if (!starterPlan) {
    console.error("Hiç plan yok — seed çalıştırılmamış olabilir")
    process.exit(1)
  }
  await db.tenant.update({
    where: { id: tenant.id },
    data: { plan_id: starterPlan.id },
  })
  console.log(`  ✓ Tenant plan_id → ${starterPlan.name} (${starterPlan.id})\n`)

  // 14 günlük TRIAL — ama bitiş tarihi dün (dolmuş)
  const now = new Date()
  const trialStart = new Date(now)
  trialStart.setDate(trialStart.getDate() - 15) // 15 gün önce başlamış
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() - 1) // dün bitmiş

  await db.tenantSubscription.create({
    data: {
      tenant_id: tenant.id,
      plan_id: starterPlan.id,
      billing_period: "MONTHLY",
      net_amount: 0,
      total_amount: 0,
      starts_at: trialStart,
      ends_at: trialEnd,
      status: "EXPIRED",
      paytr_ref: "TRIAL",
    },
  })
  console.log(
    `  ✓ Dolmuş TRIAL abonelik yaratıldı (starts: ${trialStart.toISOString().slice(0, 10)}, ends: ${trialEnd.toISOString().slice(0, 10)}, status: EXPIRED)\n`
  )

  console.log(`Tenant artık "deneme süresi dolmuş yeni üye" durumunda.`)
  console.log(`Panele girince abonelik uyarısı görünmeli, paket seçimi istemeli.`)
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); process.exit(1) })
