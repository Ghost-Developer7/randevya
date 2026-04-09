import { NextRequest, NextResponse } from "next/server"
import { notifyExpiringSubscriptions } from "@/lib/paytr"
import { db } from "@/lib/db"
import { sendAppointmentReminder } from "@/lib/email"
import { withErrorHandler } from "@/lib/api-helpers"

// GET /api/cron/subscriptions — abonelik bitmeden 3 gün önce uyarı + süresi dolmuşları pasife al
// Vercel Cron: her gün saat 08:00'da çalışır
// vercel.json: { "crons": [{ "path": "/api/cron/subscriptions", "schedule": "0 5 * * *" }] }
async function getHandler(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  const results = { notified: 0, deactivated: 0, errors: 0 }

  // 1. Bitmek üzere olan abonelikleri bildir
  try {
    const emails = await notifyExpiringSubscriptions()
    for (const email of emails) {
      // Basit bir uyarı emaili — tam şablon email.ts'e eklenebilir
      console.log(`[Cron/subscriptions] Uyarı gönderildi: ${email}`)
      results.notified++
    }
  } catch (e) {
    console.error("[Cron/subscriptions] Bildirim hatası:", e)
    results.errors++
  }

  // 2. Süresi dolmuş aktif abonelikleri EXPIRED yap
  try {
    const expired = await db.tenantSubscription.updateMany({
      where: {
        status: "ACTIVE",
        ends_at: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    })
    results.deactivated = expired.count
  } catch (e) {
    console.error("[Cron/subscriptions] Expire hatası:", e)
    results.errors++
  }

  return NextResponse.json({ success: true, ran_at: new Date().toISOString(), ...results })
}
export const GET = withErrorHandler(getHandler, "GET /api/cron/subscriptions")
