import { NextRequest } from "next/server"
import { ok, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/panel/notifications — bildirim logları
async function getHandler(req: NextRequest) {
  let tenantId: string

  const { session, error } = await requireTenantSession()
  if (error) {
    const adminSession = await getServerSession(authOptions)
    if (adminSession?.user?.role === "PLATFORM_ADMIN") {
      const first = await db.tenant.findFirst({ where: { is_active: true }, select: { id: true } })
      if (!first) return ok({ notifications: [] })
      tenantId = first.id
    } else {
      return error
    }
  } else {
    tenantId = session!.user.tenant_id
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"))
  const limit = 50

  const [logs, total] = await Promise.all([
    db.notificationLog.findMany({
      where: { tenant_id: tenantId },
      orderBy: { sent_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notificationLog.count({ where: { tenant_id: tenantId } }),
  ])

  return ok({
    notifications: logs.map((n) => ({
      id: n.id,
      channel: n.channel,
      recipient: n.recipient,
      event_type: n.event_type,
      status: n.status,
      error_msg: n.error_msg,
      sent_at: n.sent_at.toISOString(),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
export const GET = withErrorHandler(getHandler, "GET /api/panel/notifications")
