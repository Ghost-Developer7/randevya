import { NextRequest } from "next/server"
import { ok, err, requireBillingAccess, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/invoices/[id] — fatura detayı
async function getHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireBillingAccess()
  if (error) return error

  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      billing_address: true,
      subscription: {
        include: {
          tenant: { select: { id: true, company_name: true, owner_email: true, owner_name: true } },
          plan: { select: { name: true, price_monthly: true } },
        },
      },
    },
  })

  if (!invoice) return err("Fatura bulunamadı", 404)

  return ok({ invoice })
}

export const GET = withErrorHandler(getHandler, "GET /api/admin/invoices/[id]")
