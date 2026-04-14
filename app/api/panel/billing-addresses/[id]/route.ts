import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// PUT /api/panel/billing-addresses/[id] — fatura adresi güncelle
async function putHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz istek gövdesi")

  const existing = await db.billingAddress.findUnique({ where: { id } })
  if (!existing || existing.tenant_id !== tenantId) {
    return err("Fatura adresi bulunamadı", 404)
  }

  const { type, label, full_name, tc_kimlik, company_name, tax_office, tax_number, address, city, district, phone, is_default } = body

  // Varsayılan adres yapma
  if (is_default) {
    await db.billingAddress.updateMany({
      where: { tenant_id: tenantId, is_default: true, id: { not: id } },
      data: { is_default: false },
    })
  }

  const updated = await db.billingAddress.update({
    where: { id },
    data: {
      type: type ?? existing.type,
      label: label !== undefined ? label : existing.label,
      full_name: full_name !== undefined ? full_name : existing.full_name,
      tc_kimlik: tc_kimlik !== undefined ? tc_kimlik : existing.tc_kimlik,
      company_name: company_name !== undefined ? company_name : existing.company_name,
      tax_office: tax_office !== undefined ? tax_office : existing.tax_office,
      tax_number: tax_number !== undefined ? tax_number : existing.tax_number,
      address: address ?? existing.address,
      city: city ?? existing.city,
      district: district ?? existing.district,
      phone: phone ?? existing.phone,
      is_default: is_default ?? existing.is_default,
    },
  })

  return ok({ address: updated })
}

// DELETE /api/panel/billing-addresses/[id] — fatura adresi sil
async function deleteHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const { id } = await params

  const existing = await db.billingAddress.findUnique({ where: { id } })
  if (!existing || existing.tenant_id !== tenantId) {
    return err("Fatura adresi bulunamadı", 404)
  }

  // Faturaya bağlı adres silinemez
  const invoiceCount = await db.invoice.count({ where: { billing_address_id: id } })
  if (invoiceCount > 0) {
    return err("Bu adres bir faturaya bağlı olduğu için silinemez", 409)
  }

  await db.billingAddress.delete({ where: { id } })

  return ok({ deleted: true })
}

export const PUT = withErrorHandler(putHandler, "PUT /api/panel/billing-addresses/[id]")
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/panel/billing-addresses/[id]")
