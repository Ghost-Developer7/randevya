import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, parseBody, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// GET /api/admin/tenants — tüm tenant listesi
// ?page=1&limit=20&search=xxx&active=true
async function getHandler(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20))
  const search = searchParams.get("search") ?? ""
  const activeOnly = searchParams.get("active") === "true"

  const where = {
    ...(activeOnly && { is_active: true }),
    ...(search && {
      OR: [
        { company_name: { contains: search } },
        { owner_email: { contains: search } },
        { domain_slug: { contains: search } },
      ],
    }),
  }

  const [tenants, total] = await Promise.all([
    db.tenant.findMany({
      where,
      include: {
        plan: { select: { name: true, price_monthly: true } },
        _count: { select: { appointments: true, staff: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.tenant.count({ where }),
  ])

  return ok({
    tenants: tenants.map((t) => ({
      id: t.id,
      domain_slug: t.domain_slug,
      custom_domain: t.custom_domain,
      company_name: t.company_name,
      sector: t.sector,
      owner_email: t.owner_email,
      owner_name: t.owner_name,
      is_active: t.is_active,
      created_at: t.created_at.toISOString(),
      plan: t.plan,
      stats: t._count,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
export const GET = withErrorHandler(getHandler, "GET /api/admin/tenants")

// POST /api/admin/tenants — yeni tenant oluştur (admin elle ekler)
async function postHandler(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { body, error: bodyErr } = await parseBody<{
    domain_slug: string
    company_name: string
    sector: string
    owner_email: string
    owner_name: string
    password: string
    plan_id: string
  }>(req)
  if (bodyErr) return bodyErr

  const { domain_slug, company_name, sector, owner_email, owner_name, password, plan_id } = body!

  if (!domain_slug || !company_name || !owner_email || !owner_name || !password || !plan_id) {
    return err("Tüm alanlar zorunlu")
  }

  // Slug benzersizliği
  const existing = await db.tenant.findUnique({ where: { domain_slug } })
  if (existing) return err("Bu domain_slug zaten kullanımda", 409)

  const passwordHash = await bcrypt.hash(password, 10)

  const defaultTheme = {
    primary_color: "#2a5cff",
    secondary_color: "#ff4d2e",
    font: "Inter",
    border_radius: "12px",
  }

  const tenant = await db.tenant.create({
    data: {
      domain_slug,
      company_name,
      sector,
      owner_email: owner_email.toLowerCase(),
      owner_name,
      password_hash: passwordHash,
      plan_id,
      theme_config: JSON.stringify(defaultTheme),
      is_active: true,
    },
  })

  return ok({ id: tenant.id, domain_slug: tenant.domain_slug }, 201)
}
export const POST = withErrorHandler(postHandler, "POST /api/admin/tenants")
