import { NextRequest, NextResponse } from "next/server"
import { notifyUpcomingAppointments } from "@/lib/notifications"
import { withErrorHandler } from "@/lib/api-helpers"

// GET /api/cron/reminders — 24 saat öncesi hatırlatma
// Vercel Cron Job: her gün saat 10:00'da çalışır
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 7 * * *" }] }
async function getHandler(req: NextRequest) {
  // Cron secret ile korunur (yetkisiz çağrı engeli)
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  try {
    await notifyUpcomingAppointments()
    return NextResponse.json({ success: true, ran_at: new Date().toISOString() })
  } catch (e) {
    console.error("[Cron/reminders] Hata:", e)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
export const GET = withErrorHandler(getHandler, "GET /api/cron/reminders")
