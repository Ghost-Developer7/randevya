/**
 * gkhnmlym@gmail.com (Ghost Hunter) tenant'ına reklam/demo amaçlı dummy veri basar.
 *
 * Kullanım:
 *   npx tsx scripts/seed-gokhan-demo.ts
 */
import { config } from "dotenv"
config({ path: ".env.local" })
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaMssql } from "@prisma/adapter-mssql"

const adapter = new PrismaMssql(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

const OWNER_EMAIL = "gkhnmlym@gmail.com"

async function main() {
  const tenant = await db.tenant.findFirst({
    where: { owner_email: OWNER_EMAIL },
    include: {
      staff: { where: { is_active: true } },
      services: true,
      staff_services: true,
    },
  })
  if (!tenant) {
    console.error(`Tenant bulunamadı: ${OWNER_EMAIL}`)
    process.exit(1)
  }
  console.log(`Tenant: ${tenant.company_name} / ${tenant.id}`)
  console.log(`Mevcut staff: ${tenant.staff.length}, service: ${tenant.services.length}\n`)

  const tenantId = tenant.id
  const existingServiceNames = new Set(tenant.services.map((s) => s.name.toLowerCase()))

  // ── Hizmetler: yoksa ekle ─────────────────────────────────────────────
  const servicesToAdd = [
    { name: "Saç Boyama", description: "Tek renk veya röfle boyama", duration_min: 90 },
    { name: "Sakal Tıraşı", description: "Profesyonel sakal şekillendirme", duration_min: 20 },
    { name: "Saç Yıkama + Fön", description: "Şampuan, krem, fön çekimi", duration_min: 30 },
    { name: "Saç Bakımı", description: "Keratin bakım uygulaması", duration_min: 60 },
    { name: "Cilt Bakımı", description: "Yüz temizliği ve maske", duration_min: 45 },
    { name: "Manikür", description: "El ve tırnak bakımı", duration_min: 40 },
  ]

  for (const s of servicesToAdd) {
    if (existingServiceNames.has(s.name.toLowerCase())) continue
    await db.service.create({
      data: {
        tenant_id: tenantId,
        name: s.name,
        description: s.description,
        duration_min: s.duration_min,
        is_active: true,
      },
    })
  }
  console.log(`✓ Hizmetler güncellendi`)

  // Güncel listeleri oku
  const services = await db.service.findMany({ where: { tenant_id: tenantId, is_active: true } })
  const staffList = await db.staff.findMany({ where: { tenant_id: tenantId, is_active: true } })
  console.log(`  Toplam hizmet: ${services.length}, Toplam personel: ${staffList.length}`)

  // ── StaffService atamaları: tüm personele tüm hizmetleri ata (yoksa) ──
  const existingPairs = new Set(
    (await db.staffService.findMany({ where: { tenant_id: tenantId } })).map(
      (p) => `${p.staff_id}::${p.service_id}`
    )
  )
  for (const st of staffList) {
    for (const sv of services) {
      const key = `${st.id}::${sv.id}`
      if (existingPairs.has(key)) continue
      await db.staffService.create({
        data: { tenant_id: tenantId, staff_id: st.id, service_id: sv.id },
      })
    }
  }
  console.log(`✓ StaffService atamaları tamamlandı`)

  // ── Fake müşteriler ─────────────────────────────────────────────────
  const customers = [
    { name: "Elif Demir", phone: "05321112233", email: "elif.demir@mail.com" },
    { name: "Mehmet Kaya", phone: "05332223344", email: "mehmet.kaya@mail.com" },
    { name: "Ayşe Yılmaz", phone: "05343334455", email: "ayse.yilmaz@mail.com" },
    { name: "Ali Öztürk", phone: "05354445566", email: "ali.ozturk@mail.com" },
    { name: "Fatma Şen", phone: "05365556677", email: "fatma.sen@mail.com" },
    { name: "Hasan Çelik", phone: "05376667788", email: "hasan.celik@mail.com" },
    { name: "Zehra Arslan", phone: "05387778899", email: "zehra.arslan@mail.com" },
    { name: "Burak Koç", phone: "05398889900", email: "burak.koc@mail.com" },
    { name: "Selin Aktaş", phone: "05401112233", email: "selin.aktas@mail.com" },
    { name: "Emre Yıldız", phone: "05412223344", email: "emre.yildiz@mail.com" },
    { name: "Deniz Aydın", phone: "05423334455", email: "deniz.aydin@mail.com" },
    { name: "Gül Özkan", phone: "05434445566", email: "gul.ozkan@mail.com" },
    { name: "Okan Tekin", phone: "05445556677", email: "okan.tekin@mail.com" },
    { name: "Neslihan Kurt", phone: "05456667788", email: "neslihan.kurt@mail.com" },
    { name: "Serkan Aksoy", phone: "05467778899", email: "serkan.aksoy@mail.com" },
    { name: "Merve Güneş", phone: "05478889900", email: "merve.gunes@mail.com" },
    { name: "Tolga Şahin", phone: "05481112233", email: "tolga.sahin@mail.com" },
    { name: "Ece Polat", phone: "05492223344", email: "ece.polat@mail.com" },
    { name: "Kerem Aslan", phone: "05503334455", email: "kerem.aslan@mail.com" },
    { name: "Pınar Eren", phone: "05514445566", email: "pinar.eren@mail.com" },
  ]

  const notes = [
    null,
    null,
    null,
    "Kısa kesim tercih ediyorum",
    "Alerjim var, doğal ürün kullanın lütfen",
    "Fotoğraf göstereceğim",
    "Hafif dalgalı olsun",
    "İlk defa geliyorum",
    null,
    null,
  ]

  // ── Randevu sayısını kontrol et ──────────────────────────────────────
  const existingAppointments = await db.appointment.count({ where: { tenant_id: tenantId } })
  console.log(`\nMevcut randevu: ${existingAppointments}`)

  const now = new Date()
  const appointmentsToCreate = 80
  let created = 0
  let skipped = 0

  // Gün ve saat bazlı çakışma kontrolü için in-memory set (staff_id + startTime ms)
  const usedSlots = new Set<string>()
  const existing = await db.appointment.findMany({
    where: { tenant_id: tenantId },
    select: { staff_id: true, start_time: true, end_time: true },
  })
  for (const e of existing) {
    usedSlots.add(`${e.staff_id}::${e.start_time.getTime()}`)
  }

  for (let i = 0; i < appointmentsToCreate; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const staff = staffList[Math.floor(Math.random() * staffList.length)]
    const service = services[Math.floor(Math.random() * services.length)]

    // Tarih dağılımı: %70 geçmiş 30 gün, %30 gelecek 14 gün
    const isPast = Math.random() < 0.7
    const dayOffset = isPast
      ? -Math.floor(Math.random() * 30)
      : Math.floor(Math.random() * 14) + 1

    const start = new Date(now)
    start.setDate(start.getDate() + dayOffset)
    const hour = 9 + Math.floor(Math.random() * 9) // 09-17
    const minuteChoice = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
    start.setHours(hour, minuteChoice, 0, 0)

    // Pazar günü atla
    if (start.getDay() === 0) {
      skipped++
      continue
    }

    const slotKey = `${staff.id}::${start.getTime()}`
    if (usedSlots.has(slotKey)) {
      skipped++
      continue
    }
    usedSlots.add(slotKey)

    const end = new Date(start)
    end.setMinutes(end.getMinutes() + service.duration_min)

    let status: string
    if (start < now) {
      const r = Math.random()
      status = r < 0.65 ? "COMPLETED" : r < 0.8 ? "CONFIRMED" : r < 0.92 ? "NO_SHOW" : "CANCELLED"
    } else {
      status = Math.random() < 0.35 ? "PENDING" : "CONFIRMED"
    }

    try {
      await db.appointment.create({
        data: {
          tenant_id: tenantId,
          staff_id: staff.id,
          service_id: service.id,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          start_time: start,
          end_time: end,
          status,
          notes: notes[Math.floor(Math.random() * notes.length)],
        },
      })
      created++
    } catch {
      skipped++
    }
  }
  console.log(`✓ Randevular: ${created} yaratıldı, ${skipped} atlandı`)

  // ── Waitlist (bekleme listesi) ────────────────────────────────────────
  const upcomingAppointments = await db.appointment.findMany({
    where: { tenant_id: tenantId, start_time: { gte: now }, status: "CONFIRMED" },
    take: 4,
  })
  const existingWaitlistCount = await db.waitlistEntry.count({ where: { tenant_id: tenantId } })
  if (existingWaitlistCount < 3 && upcomingAppointments.length > 0) {
    const waitlistCustomers = [
      { name: "Zeynep Aksoy", phone: "05531112233", email: "zeynep.aksoy@mail.com" },
      { name: "Cem Uluç", phone: "05542223344", email: "cem.uluc@mail.com" },
      { name: "Nihan Bozkurt", phone: "05553334455", email: "nihan.bozkurt@mail.com" },
    ]
    for (let i = 0; i < Math.min(3, upcomingAppointments.length); i++) {
      const c = waitlistCustomers[i]
      await db.waitlistEntry.create({
        data: {
          tenant_id: tenantId,
          appointment_id: upcomingAppointments[i].id,
          customer_name: c.name,
          customer_phone: c.phone,
          customer_email: c.email,
          queue_order: i + 1,
          status: "WAITING",
        },
      })
    }
    console.log(`✓ 3 bekleme listesi kaydı eklendi`)
  } else {
    console.log(`• Bekleme listesi atlandı (mevcut: ${existingWaitlistCount})`)
  }

  // ── Kapalı günler ─────────────────────────────────────────────────────
  const closedCount = await db.closedDay.count({ where: { tenant_id: tenantId } })
  if (closedCount === 0) {
    // Gelecekte 2 kapalı gün (tüm işletme), 1 personel izin günü
    const future1 = new Date(now)
    future1.setDate(future1.getDate() + 7)
    future1.setHours(0, 0, 0, 0)
    const future2 = new Date(now)
    future2.setDate(future2.getDate() + 20)
    future2.setHours(0, 0, 0, 0)
    const staffLeave = new Date(now)
    staffLeave.setDate(staffLeave.getDate() + 4)
    staffLeave.setHours(0, 0, 0, 0)

    await db.closedDay.create({
      data: { tenant_id: tenantId, date: future1, reason: "Resmi tatil" },
    })
    await db.closedDay.create({
      data: { tenant_id: tenantId, date: future2, reason: "Bayram kapanışı" },
    })
    if (staffList.length > 0) {
      await db.closedDay.create({
        data: {
          tenant_id: tenantId,
          staff_id: staffList[0].id,
          date: staffLeave,
          reason: "Yıllık izin",
        },
      })
    }
    console.log(`✓ 3 kapalı gün kaydı eklendi`)
  } else {
    console.log(`• Kapalı gün atlandı (mevcut: ${closedCount})`)
  }

  // ── Notification logs (aktivite izi için) ────────────────────────────
  const notifCount = await db.notificationLog.count({ where: { tenant_id: tenantId } })
  if (notifCount < 10) {
    const events = [
      "appointment.created",
      "appointment.confirmed",
      "appointment.reminder",
      "appointment.cancelled",
    ]
    const sampleCustomers = customers.slice(0, 15)
    for (let i = 0; i < 20; i++) {
      const c = sampleCustomers[i % sampleCustomers.length]
      const daysAgo = Math.floor(Math.random() * 20)
      const sentAt = new Date(now)
      sentAt.setDate(sentAt.getDate() - daysAgo)
      sentAt.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0)
      await db.notificationLog.create({
        data: {
          tenant_id: tenantId,
          channel: Math.random() < 0.7 ? "EMAIL" : "WHATSAPP",
          recipient: Math.random() < 0.5 ? c.email : c.phone,
          event_type: events[Math.floor(Math.random() * events.length)],
          status: Math.random() < 0.95 ? "SENT" : "FAILED",
          sent_at: sentAt,
        },
      })
    }
    console.log(`✓ 20 bildirim log kaydı eklendi`)
  } else {
    console.log(`• Bildirim log atlandı (mevcut: ${notifCount})`)
  }

  // ── Özet ──────────────────────────────────────────────────────────────
  const finalCounts = {
    staff: await db.staff.count({ where: { tenant_id: tenantId } }),
    services: await db.service.count({ where: { tenant_id: tenantId } }),
    staff_services: await db.staffService.count({ where: { tenant_id: tenantId } }),
    appointments: await db.appointment.count({ where: { tenant_id: tenantId } }),
    waitlist: await db.waitlistEntry.count({ where: { tenant_id: tenantId } }),
    closed_days: await db.closedDay.count({ where: { tenant_id: tenantId } }),
    notifications: await db.notificationLog.count({ where: { tenant_id: tenantId } }),
  }
  console.log(`\n─── Son durum ───`)
  console.log(JSON.stringify(finalCounts, null, 2))
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); process.exit(1) })
