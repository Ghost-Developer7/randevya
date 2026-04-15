import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaMssql } from "@prisma/adapter-mssql"
const adapter = new PrismaMssql(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })
async function main() {
  const first = await db.tenant.findFirst({ where: { is_active: true }, select: { id: true, company_name: true, owner_email: true } })
  console.log("findFirst tenant:", JSON.stringify(first))
  const all = await db.tenant.findMany({ where: { is_active: true }, select: { id: true, company_name: true, owner_email: true } })
  console.log("All tenants:", JSON.stringify(all))
  const admins = await db.adminUser.findMany({ select: { id: true, email: true, role: true } })
  console.log("Admin users:", JSON.stringify(admins))
}
main().then(() => db.$disconnect())
