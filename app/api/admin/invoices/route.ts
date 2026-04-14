import { NextRequest } from "next/server"
import { ok, requireBillingAccess, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/invoices — fatura listesi (filtreli, sayfalı)
async function getHandler(req: NextRequest) {
  const { error } = await requireBillingAccess()
  if (error) return error

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")))
  const search = url.searchParams.get("search") ?? ""
  const status = url.searchParams.get("status") ?? ""

  const where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { invoice_number: { contains: search } },
      { subscription: { tenant: { company_name: { contains: search } } } },
    ]
  }

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: {
        subscription: {
          include: {
            tenant: { select: { id: true, company_name: true, owner_email: true } },
            plan: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.invoice.count({ where }),
  ])

  return ok({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      net_amount: inv.net_amount,
      kdv_rate: inv.kdv_rate,
      kdv_amount: inv.kdv_amount,
      total_amount: inv.total_amount,
      status: inv.status,
      pdf_url: inv.pdf_url,
      emailed_at: inv.emailed_at,
      created_at: inv.created_at,
      subscription: {
        id: inv.subscription.id,
        billing_period: inv.subscription.billing_period,
        status: inv.subscription.status,
        starts_at: inv.subscription.starts_at,
        ends_at: inv.subscription.ends_at,
        paytr_ref: inv.subscription.paytr_ref,
      },
      tenant: inv.subscription.tenant,
      plan_name: inv.subscription.plan.name,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
}

export const GET = withErrorHandler(getHandler, "GET /api/admin/invoices")
