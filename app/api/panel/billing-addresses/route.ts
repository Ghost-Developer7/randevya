import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/panel/billing-addresses — fatura adreslerini listele
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const addresses = await db.billingAddress.findMany({
    where: { tenant_id: session!.user.tenant_id },
    orderBy: [{ is_default: "desc" }, { created_at: "desc" }],
  })

  return ok({ addresses })
}

// POST /api/panel/billing-addresses — yeni fatura adresi oluştur
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz istek gövdesi")

  const { type, label, full_name, tc_kimlik, company_name, tax_office, tax_number, address, city, district, phone, is_default } = body

  // Tip kontrolü
  if (!type || !["BIREYSEL", "KURUMSAL"].includes(type)) {
    return err("Geçersiz fatura tipi. BIREYSEL veya KURUMSAL olmalı")
  }

  // Ortak alan kontrolü
  if (!address || !city || !district || !phone) {
    return err("Adres, il, ilçe ve telefon zorunludur")
  }

  // Bireysel alan kontrolü
  if (type === "BIREYSEL") {
    if (!full_name) return err("Ad soyad zorunludur")
    if (!tc_kimlik || tc_kimlik.length !== 11 || !/^\d{11}$/.test(tc_kimlik)) {
      return err("TC Kimlik No 11 haneli olmalıdır")
    }
  }

  // Kurumsal alan kontrolü
  if (type === "KURUMSAL") {
    if (!company_name) return err("Firma adı zorunludur")
    if (!tax_office) return err("Vergi dairesi zorunludur")
    if (!tax_number) return err("Vergi numarası zorunludur")
  }

  // Varsayılan adres yapma
  if (is_default) {
    await db.billingAddress.updateMany({
      where: { tenant_id: tenantId, is_default: true },
      data: { is_default: false },
    })
  }

  const created = await db.billingAddress.create({
    data: {
      tenant_id: tenantId,
      type,
      label: label || null,
      full_name: type === "BIREYSEL" ? full_name : null,
      tc_kimlik: type === "BIREYSEL" ? tc_kimlik : null,
      company_name: type === "KURUMSAL" ? company_name : null,
      tax_office: type === "KURUMSAL" ? tax_office : null,
      tax_number: type === "KURUMSAL" ? tax_number : null,
      address,
      city,
      district,
      phone,
      is_default: is_default ?? false,
    },
  })

  return ok({ address: created }, 201)
}

export const GET = withErrorHandler(getHandler as never, "GET /api/panel/billing-addresses")
export const POST = withErrorHandler(postHandler, "POST /api/panel/billing-addresses")
