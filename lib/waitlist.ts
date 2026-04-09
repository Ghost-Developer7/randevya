import { db } from "@/lib/db"
import { redis } from "@/lib/redis"

// Bekleme listesi bildirimi için kaç dakika bekleneceği
const WAITLIST_NOTIFY_WINDOW_MIN = 30

// Bir randevu iptal edildiğinde sıradaki kişiye bildirim gönder
// Bu fonksiyon appointment iptal API'sinden çağrılır
export async function notifyNextInWaitlist(
  appointmentId: string,
  tenantId: string
): Promise<string | null> {   // entry ID döndürür — bildirim için gerekli
  // Sıradaki WAITING durumundaki kişiyi bul
  const next = await db.waitlistEntry.findFirst({
    where: {
      appointment_id: appointmentId,
      tenant_id: tenantId,
      status: "WAITING",
    },
    orderBy: { queue_order: "asc" },
  })

  if (!next) return null

  const expiresAt = new Date(Date.now() + WAITLIST_NOTIFY_WINDOW_MIN * 60 * 1000)

  // Durumu NOTIFIED yap, expires_at ayarla
  await db.waitlistEntry.update({
    where: { id: next.id },
    data: {
      status: "NOTIFIED",
      notified_at: new Date(),
      expires_at: expiresAt,
    },
  })

  // Redis'e TTL ile kaydet — süre dolunca sonrakine geç
  // Key: waitlist:{entryId} → appointmentId, tenantId
  if (redis) {
    await redis.setex(
      `waitlist:expire:${next.id}`,
      WAITLIST_NOTIFY_WINDOW_MIN * 60,
      JSON.stringify({ appointmentId, tenantId, entryId: next.id })
    )
  }

  // Entry ID döndür — çağıran taraf notifications.ts ile bildirimi tetikler
  return next.id
}

// Bildirim penceresi dolduğunda (Redis TTL veya cron) çağrılır
// O kişiyi EXPIRED yap, sıradakine bildir
export async function expireWaitlistEntry(entryId: string): Promise<{
  nextEntry: {
    id: string
    customer_name: string
    customer_email: string
    customer_phone: string
    appointment_id: string
    tenant_id: string
  } | null
}> {
  const entry = await db.waitlistEntry.findUnique({ where: { id: entryId } })
  if (!entry || entry.status !== "NOTIFIED") return { nextEntry: null }

  // Mevcut kişiyi EXPIRED yap
  await db.waitlistEntry.update({
    where: { id: entryId },
    data: { status: "EXPIRED" },
  })

  // Sıradaki WAITING kişiyi bul
  const next = await db.waitlistEntry.findFirst({
    where: {
      appointment_id: entry.appointment_id,
      tenant_id: entry.tenant_id,
      status: "WAITING",
    },
    orderBy: { queue_order: "asc" },
  })

  if (!next) return { nextEntry: null }

  const expiresAt = new Date(Date.now() + WAITLIST_NOTIFY_WINDOW_MIN * 60 * 1000)

  await db.waitlistEntry.update({
    where: { id: next.id },
    data: {
      status: "NOTIFIED",
      notified_at: new Date(),
      expires_at: expiresAt,
    },
  })

  if (redis) {
    await redis.setex(
      `waitlist:expire:${next.id}`,
      WAITLIST_NOTIFY_WINDOW_MIN * 60,
      JSON.stringify({
        appointmentId: entry.appointment_id,
        tenantId: entry.tenant_id,
        entryId: next.id,
      })
    )
  }

  return {
    nextEntry: {
      id: next.id,
      customer_name: next.customer_name,
      customer_email: next.customer_email,
      customer_phone: next.customer_phone,
      appointment_id: next.appointment_id,
      tenant_id: next.tenant_id,
    },
  }
}

// Bekleme listesindeki bir kişi slotu onayladı
// Race condition koruması: transaction ile ilk onaylayan kazanır
export async function confirmWaitlistSlot(
  entryId: string,
  tenantId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await db.$transaction(async (tx) => {
      // Kişinin hâlâ NOTIFIED durumunda ve süresi dolmamış olduğunu kontrol et
      const entry = await tx.waitlistEntry.findFirst({
        where: {
          id: entryId,
          tenant_id: tenantId,
          status: "NOTIFIED",
          expires_at: { gt: new Date() },
        },
        include: { appointment: true },
      })

      if (!entry) {
        return { success: false, message: "Süreniz dolmuş veya slot artık mevcut değil." }
      }

      // Randevuyu bu kişiye ata (appointment kaydını güncelle)
      await tx.appointment.update({
        where: { id: entry.appointment_id },
        data: {
          customer_name: entry.customer_name,
          customer_phone: entry.customer_phone,
          customer_email: entry.customer_email,
          status: "CONFIRMED",
        },
      })

      // Bu kişiyi CONFIRMED yap
      await tx.waitlistEntry.update({
        where: { id: entryId },
        data: { status: "CONFIRMED" },
      })

      // Diğer bekleyenleri CANCELLED yap
      await tx.waitlistEntry.updateMany({
        where: {
          appointment_id: entry.appointment_id,
          tenant_id: tenantId,
          status: { in: ["WAITING", "NOTIFIED"] },
          id: { not: entryId },
        },
        data: { status: "CANCELLED" },
      })

      return { success: true, message: "Randevunuz onaylandı." }
    })

    // Redis key'i temizle
    if (result.success && redis) {
      await redis.del(`waitlist:expire:${entryId}`)
    }

    return result
  } catch {
    return { success: false, message: "Bir hata oluştu, lütfen tekrar deneyin." }
  }
}

// Bekleme listesine ekle (sıra numarasını otomatik ver)
export async function addToWaitlist({
  tenantId,
  appointmentId,
  customerName,
  customerPhone,
  customerEmail,
}: {
  tenantId: string
  appointmentId: string
  customerName: string
  customerPhone: string
  customerEmail: string
}): Promise<{ id: string; queue_order: number }> {
  // Aynı kişi zaten listede mi?
  const existing = await db.waitlistEntry.findFirst({
    where: {
      appointment_id: appointmentId,
      customer_email: customerEmail,
      status: { in: ["WAITING", "NOTIFIED"] },
    },
  })

  if (existing) {
    return { id: existing.id, queue_order: existing.queue_order }
  }

  // Mevcut en yüksek sıra numarasını bul
  const last = await db.waitlistEntry.findFirst({
    where: { appointment_id: appointmentId, tenant_id: tenantId },
    orderBy: { queue_order: "desc" },
  })

  const queueOrder = (last?.queue_order ?? 0) + 1

  const entry = await db.waitlistEntry.create({
    data: {
      tenant_id: tenantId,
      appointment_id: appointmentId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      queue_order: queueOrder,
      status: "WAITING",
    },
  })

  return { id: entry.id, queue_order: entry.queue_order }
}
