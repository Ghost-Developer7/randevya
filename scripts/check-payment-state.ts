import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaMssql } from "@prisma/adapter-mssql"

const adapter = new PrismaMssql(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

async function main() {
  const email = "mhmtkara.0793@gmail.com"

  const tenant = await db.tenant.findFirst({
    where: { owner_email: email },
    include: { plan: true },
  })

  if (!tenant) {
    console.error(`Tenant bulunamadi: ${email}`)
    process.exit(1)
  }

  console.log(`\n=== Tenant ===`)
  console.log(`id: ${tenant.id}`)
  console.log(`company: ${tenant.company_name}`)
  console.log(`plan_id: ${tenant.plan_id} (${tenant.plan.name} - ${tenant.plan.price_monthly} TL)`)

  console.log(`\n=== Abonelikler (son 10) ===`)
  const subs = await db.tenantSubscription.findMany({
    where: { tenant_id: tenant.id },
    orderBy: { created_at: "desc" },
    take: 10,
    include: { plan: { select: { name: true } } },
  })
  for (const s of subs) {
    console.log(`  [${s.status}] ${s.plan.name} | paytr_ref=${s.paytr_ref} | starts=${s.starts_at.toISOString()} ends=${s.ends_at.toISOString()}`)
  }

  console.log(`\n=== PendingPayments (son 10) ===`)
  const pendings = await db.pendingPayment.findMany({
    where: { tenant_id: tenant.id },
    orderBy: { created_at: "desc" },
    take: 10,
  })
  for (const p of pendings) {
    console.log(`  [${p.status}] merchant_oid=${p.merchant_oid} | ${p.billing_period} | total=${p.total_amount} | ${p.created_at.toISOString()}`)
  }

  console.log(`\n=== Invoice kayıtları (son 5) ===`)
  const invoices = await db.invoice.findMany({
    where: { subscription: { tenant_id: tenant.id } },
    orderBy: { created_at: "desc" },
    take: 5,
  })
  for (const inv of invoices) {
    console.log(`  [${inv.status}] ${inv.invoice_number} | net=${inv.net_amount} kdv=${inv.kdv_amount} total=${inv.total_amount}`)
  }
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); process.exit(1) })
