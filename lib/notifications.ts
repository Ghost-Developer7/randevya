/**
 * Merkezi bildirim orchestrator.
 * Tüm API route'ları ve background job'lar bu modülü çağırır.
 * Email + WhatsApp kanallarını paralel çalıştırır.
 */

import { db } from "@/lib/db"
import {
  sendAppointmentConfirm,
  sendAppointmentCancel,
  sendAppointmentReminder,
  sendWaitlistNotify,
  sendBusinessNewAppointment,
} from "@/lib/email"
import {
  sendWaAppointmentConfirm,
  sendWaAppointmentCancel,
  sendWaAppointmentReminder,
  sendWaWaitlistNotify,
} from "@/lib/whatsapp"

// Tenant'ın plan özelliklerini çek (cache yok — çok sık çağrılmaz)
async function getTenantPlan(tenantId: string) {
  return db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      owner_email: true,
      company_name: true,
      logo_url: true,
      plan: { select: { whatsapp_enabled: true } },
    },
  })
}

// ─── Randevu oluşturuldu ─────────────────────────────────────────────────────

export async function notifyAppointmentCreated(appointmentId: string): Promise<void> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      staff: { select: { full_name: true } },
      service: { select: { name: true } },
    },
  })
  if (!appointment) return

  const tenant = await getTenantPlan(appointment.tenant_id)
  if (!tenant) return

  const base = {
    tenantId: appointment.tenant_id,
    companyName: tenant.company_name,
    customerName: appointment.customer_name,
    customerEmail: appointment.customer_email,
    customerPhone: appointment.customer_phone,
    serviceName: appointment.service.name,
    staffName: appointment.staff.full_name,
    startTime: appointment.start_time,
  }

  // Email + İşletme email + (plan izin veriyorsa) WhatsApp — paralel gönder
  const tasks: Promise<unknown>[] = [
    sendAppointmentConfirm({ ...base, logoUrl: tenant.logo_url }),
    sendBusinessNewAppointment({
      ...base,
      businessEmail: tenant.owner_email,
    }),
  ]

  if (tenant.plan.whatsapp_enabled) {
    tasks.push(sendWaAppointmentConfirm(base))
  }

  await Promise.allSettled(tasks)
}

// ─── Randevu iptal edildi ────────────────────────────────────────────────────

export async function notifyAppointmentCancelled(appointmentId: string): Promise<void> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: { select: { name: true } },
    },
  })
  if (!appointment) return

  const tenant = await getTenantPlan(appointment.tenant_id)
  if (!tenant) return

  const base = {
    tenantId: appointment.tenant_id,
    companyName: tenant.company_name,
    customerName: appointment.customer_name,
    customerEmail: appointment.customer_email,
    customerPhone: appointment.customer_phone,
    serviceName: appointment.service.name,
    startTime: appointment.start_time,
  }

  const tasks: Promise<unknown>[] = [sendAppointmentCancel(base)]

  if (tenant.plan.whatsapp_enabled) {
    tasks.push(sendWaAppointmentCancel(base))
  }

  await Promise.allSettled(tasks)
}

// ─── 24 saat öncesi hatırlatma (cron job çağırır) ────────────────────────────

export async function notifyUpcomingAppointments(): Promise<void> {
  const now = new Date()
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const appointments = await db.appointment.findMany({
    where: {
      start_time: { gte: windowStart, lte: windowEnd },
      status: "CONFIRMED",
    },
    include: {
      staff: { select: { full_name: true } },
      service: { select: { name: true } },
      tenant: {
        select: {
          company_name: true,
          logo_url: true,
          owner_email: true,
          plan: { select: { whatsapp_enabled: true } },
        },
      },
    },
  })

  for (const appointment of appointments) {
    const base = {
      tenantId: appointment.tenant_id,
      companyName: appointment.tenant.company_name,
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      customerPhone: appointment.customer_phone,
      serviceName: appointment.service.name,
      staffName: appointment.staff.full_name,
      startTime: appointment.start_time,
    }

    const tasks: Promise<unknown>[] = [sendAppointmentReminder(base)]

    if (appointment.tenant.plan.whatsapp_enabled) {
      tasks.push(sendWaAppointmentReminder(base))
    }

    await Promise.allSettled(tasks)
  }
}

// ─── Bekleme listesi slot açıldı ─────────────────────────────────────────────

export async function notifyWaitlistSlotOpened(
  entryId: string,
  baseUrl: string  // ör: "https://app.randevya.com"
): Promise<void> {
  const entry = await db.waitlistEntry.findUnique({
    where: { id: entryId },
    include: {
      appointment: {
        include: {
          service: { select: { name: true } },
          tenant: {
            select: {
              company_name: true,
              plan: { select: { whatsapp_enabled: true } },
            },
          },
        },
      },
    },
  })

  if (!entry) return

  const confirmUrl = `${baseUrl}/bekle/onayla?entry=${entryId}`

  const base = {
    tenantId: entry.tenant_id,
    customerName: entry.customer_name,
    customerEmail: entry.customer_email,
    customerPhone: entry.customer_phone,
    serviceName: entry.appointment.service.name,
    startTime: entry.appointment.start_time,
    confirmUrl,
    expireMinutes: 30,
  }

  const tasks: Promise<unknown>[] = [
    sendWaitlistNotify({ ...base, companyName: entry.appointment.tenant.company_name }),
  ]

  if (entry.appointment.tenant.plan.whatsapp_enabled) {
    tasks.push(sendWaWaitlistNotify(base))
  }

  await Promise.allSettled(tasks)
}
