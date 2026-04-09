import { NextRequest } from "next/server"
import { ok, requireSupportAccess, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/support — tüm destek taleplerini listele
// Query: ?page=1&limit=20&status=OPEN&tenantId=&search=&priority=
async function handler(req: NextRequest) {
  const { error } = await requireSupportAccess()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))
  const skip = (page - 1) * limit
  const status = searchParams.get("status")
  const tenantId = searchParams.get("tenantId")
  const search = searchParams.get("search")?.trim()
  const priority = searchParams.get("priority")

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (tenantId) where.tenant_id = tenantId
  if (priority) where.priority = priority
  if (search) where.subject = { contains: search }

  const [total, tickets] = await Promise.all([
    db.supportTicket.count({ where }),
    db.supportTicket.findMany({
      where,
      orderBy: { updated_at: "desc" },
      skip,
      take: limit,
      include: {
        tenant: { select: { company_name: true, domain_slug: true, owner_email: true } },
        messages: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: { content: true, sender: true, created_at: true },
        },
        _count: { select: { messages: true } },
      },
    }),
  ])

  return ok({
    tickets,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  })
}

export const GET = withErrorHandler(handler, "GET /api/admin/support")
