import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/error-logs
// Query: ?page=1&limit=50&tenantId=&search=&from=&to=&method=
async function handler(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)))
  const skip = (page - 1) * limit

  const tenantId = searchParams.get("tenantId")
  const search = searchParams.get("search")?.trim()
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const method = searchParams.get("method")?.toUpperCase()

  const where: Record<string, unknown> = {}

  if (tenantId) where.tenant_id = tenantId
  if (method) where.method = method

  if (from || to) {
    where.created_at = {}
    if (from) (where.created_at as Record<string, Date>).gte = new Date(from)
    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59)
      ;(where.created_at as Record<string, Date>).lte = toDate
    }
  }

  if (search) {
    where.OR = [
      { error_msg: { contains: search } },
      { endpoint: { contains: search } },
      { user_email: { contains: search } },
    ]
  }

  const [total, logs] = await Promise.all([
    db.errorLog.count({ where }),
    db.errorLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: {
        tenant: { select: { company_name: true, domain_slug: true } },
      },
    }),
  ])

  return ok({
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  })
}

export const GET = withErrorHandler(handler, "GET /api/admin/error-logs")

// DELETE /api/admin/error-logs — SUPER_ADMIN temizleyebilir
async function deleteHandler(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const body = await req.json().catch(() => null) as { olderThanDays?: number } | null
  const days = body?.olderThanDays ?? 30

  if (days < 1) return err("olderThanDays en az 1 olmalı")

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { count } = await db.errorLog.deleteMany({
    where: { created_at: { lt: cutoff } },
  })

  return ok({ deleted: count, cutoff })
}

export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/admin/error-logs")
