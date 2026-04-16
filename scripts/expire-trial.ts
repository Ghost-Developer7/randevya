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
    select: { id: true, company_name: true, domain_slug: true },
  })

  if (!tenant) {
    console.error(`Tenant bulunamadı: ${email}`)
    process.exit(1)
  }

  console.log(`Tenant: ${tenant.company_name} (${tenant.domain_slug}) / ${tenant.id}`)

  const subs = await db.tenantSubscription.findMany({
    where: { tenant_id: tenant.id },
    orderBy: { created_at: "desc" },
  })

  console.log(`\nMevcut abonelikler (${subs.length}):`)
  for (const s of subs) {
    console.log(`  ID: ${s.id}`)
    console.log(`  paytr_ref: ${s.paytr_ref}`)
    console.log(`  status: ${s.status}`)
    console.log(`  starts_at: ${s.starts_at.toISOString()}`)
    console.log(`  ends_at: ${s.ends_at.toISOString()}`)
    console.log()
  }

  // TRIAL aboneliğini bul
  const trial = subs.find((s) => s.paytr_ref === "TRIAL" && s.status === "ACTIVE")
  if (!trial) {
    console.log("Aktif TRIAL aboneliği bulunamadı.")
    process.exit(0)
  }

  // Dünden önce bitmiş gibi göster + EXPIRED yap
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 1)

  await db.tenantSubscription.update({
    where: { id: trial.id },
    data: {
      status: "EXPIRED",
      ends_at: pastDate,
    },
  })

  console.log(`\n✓ TRIAL aboneliği EXPIRED yapıldı (ends_at: ${pastDate.toISOString()})`)
  console.log("Tenant artık aktif paket almalı.")
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); process.exit(1) })
