import { config } from "dotenv"
config({ path: ".env" })

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaMssql } from "@prisma/adapter-mssql"
import bcrypt from "bcryptjs"

const adapter = new PrismaMssql(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seed başlıyor...")

  // ── Planları oluştur ────────────────────────────────────────────────────────
  const planBaslangic = await prisma.plan.upsert({
    where: { id: "plan-baslangic" },
    update: {},
    create: {
      id: "plan-baslangic",
      name: "Başlangıç",
      price_monthly: 299,
      max_staff: 2,
      max_services: 5,
      whatsapp_enabled: false,
      custom_domain: false,
      waitlist_enabled: true,
      analytics: false,
      priority_support: false,
    },
  })

  const planPro = await prisma.plan.upsert({
    where: { id: "plan-pro" },
    update: {},
    create: {
      id: "plan-pro",
      name: "Pro",
      price_monthly: 599,
      max_staff: 10,
      max_services: 30,
      whatsapp_enabled: true,
      custom_domain: true,
      waitlist_enabled: true,
      analytics: true,
      priority_support: false,
    },
  })

  await prisma.plan.upsert({
    where: { id: "plan-kurumsal" },
    update: {},
    create: {
      id: "plan-kurumsal",
      name: "Kurumsal",
      price_monthly: 999,
      max_staff: 9999,
      max_services: 9999,
      whatsapp_enabled: true,
      custom_domain: true,
      waitlist_enabled: true,
      analytics: true,
      priority_support: true,
    },
  })

  console.log("✅ Planlar oluşturuldu")

  // ── Test tenant 1: Kuaför ───────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("test1234", 10)

  const tenantKuafor = await prisma.tenant.upsert({
    where: { domain_slug: "test-kuafor" },
    update: {},
    create: {
      domain_slug: "test-kuafor",
      company_name: "Elit Kuaför",
      sector: "Kuaför",
      theme_config: JSON.stringify({
        primary_color: "#6c48ff",
        secondary_color: "#ff4d2e",
        font: "Inter",
        border_radius: "12px",
        tagline: "Saçlarınız için en iyi bakım",
      }),
      logo_url: null,
      owner_email: "test@elit-kuafor.com",
      owner_name: "Ayşe Kaya",
      password_hash: passwordHash,
      plan_id: planPro.id,
      is_active: true,
    },
  })

  // ── Test tenant 2: Klinik ───────────────────────────────────────────────────
  const tenantKlinik = await prisma.tenant.upsert({
    where: { domain_slug: "test-klinik" },
    update: {},
    create: {
      domain_slug: "test-klinik",
      company_name: "Dr. Mehmet Kara Kliniği",
      sector: "Sağlık",
      theme_config: JSON.stringify({
        primary_color: "#00b894",
        secondary_color: "#2a5cff",
        font: "Inter",
        border_radius: "8px",
        tagline: "Sağlığınız bizim önceliğimiz",
      }),
      logo_url: null,
      owner_email: "test@drmehmetkara.com",
      owner_name: "Dr. Mehmet Kara",
      password_hash: passwordHash,
      plan_id: planBaslangic.id,
      is_active: true,
    },
  })

  console.log("✅ Test tenant'lar oluşturuldu")

  // ── Kuaför — Personel ───────────────────────────────────────────────────────
  const workHoursHaftaici = JSON.stringify({
    mon: [{ start: "09:00", end: "18:00" }],
    tue: [{ start: "09:00", end: "18:00" }],
    wed: [{ start: "09:00", end: "18:00" }],
    thu: [{ start: "09:00", end: "18:00" }],
    fri: [{ start: "09:00", end: "18:00" }],
    sat: [{ start: "10:00", end: "16:00" }],
    sun: [],
  })

  const staffAyse = await prisma.staff.upsert({
    where: { id: "staff-ayse" },
    update: {},
    create: {
      id: "staff-ayse",
      tenant_id: tenantKuafor.id,
      full_name: "Ayşe Yılmaz",
      title: "Uzman Saç Stilisti",
      work_hours: workHoursHaftaici,
      is_active: true,
    },
  })

  const staffMehmet = await prisma.staff.upsert({
    where: { id: "staff-mehmet" },
    update: {},
    create: {
      id: "staff-mehmet",
      tenant_id: tenantKuafor.id,
      full_name: "Mehmet Demir",
      title: "Berber",
      work_hours: workHoursHaftaici,
      is_active: true,
    },
  })

  // ── Kuaför — Hizmetler ──────────────────────────────────────────────────────
  const serviceKesim = await prisma.service.upsert({
    where: { id: "service-kesim" },
    update: {},
    create: {
      id: "service-kesim",
      tenant_id: tenantKuafor.id,
      name: "Saç Kesimi",
      description: "Yıkama dahil saç kesimi",
      duration_min: 45,
      is_active: true,
    },
  })

  const serviceBoya = await prisma.service.upsert({
    where: { id: "service-boya" },
    update: {},
    create: {
      id: "service-boya",
      tenant_id: tenantKuafor.id,
      name: "Saç Boyama",
      description: "Tek renk veya röfle",
      duration_min: 90,
      is_active: true,
    },
  })

  // ── StaffService atamaları ──────────────────────────────────────────────────
  await prisma.staffService.upsert({
    where: { staff_id_service_id: { staff_id: staffAyse.id, service_id: serviceKesim.id } },
    update: {},
    create: { tenant_id: tenantKuafor.id, staff_id: staffAyse.id, service_id: serviceKesim.id },
  })

  await prisma.staffService.upsert({
    where: { staff_id_service_id: { staff_id: staffAyse.id, service_id: serviceBoya.id } },
    update: {},
    create: { tenant_id: tenantKuafor.id, staff_id: staffAyse.id, service_id: serviceBoya.id },
  })

  await prisma.staffService.upsert({
    where: { staff_id_service_id: { staff_id: staffMehmet.id, service_id: serviceKesim.id } },
    update: {},
    create: { tenant_id: tenantKuafor.id, staff_id: staffMehmet.id, service_id: serviceKesim.id },
  })

  console.log("✅ Personel ve hizmetler oluşturuldu")

  // ── Platform SUPER_ADMIN ────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Mehmet+123", 10)

  await prisma.adminUser.upsert({
    where: { email: "tmkmuhendislik@gmail.com" },
    update: {},
    create: {
      email: "tmkmuhendislik@gmail.com",
      password_hash: adminHash,
      full_name: "Mehmet Kara",
      role: "SUPER_ADMIN",
      is_active: true,
    },
  })

  console.log("✅ Platform admin oluşturuldu")
  console.log("")
  console.log("─────────────────────────────────────────")
  console.log("📌 Test giriş bilgileri:")
  console.log("   Kuaför panel: test@elit-kuafor.com / test1234")
  console.log("   Klinik panel: test@drmehmetkara.com / test1234")
  console.log("   Platform admin: tmkmuhendislik@gmail.com / Mehmet+123")
  console.log("")
  console.log("🔗 Test URL'leri (dev):")
  console.log("   http://test-kuafor.localhost:3000")
  console.log("   http://test-klinik.localhost:3000")
  console.log("─────────────────────────────────────────")
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
