import { NextRequest, NextResponse } from "next/server"
import { ok, err, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// POST /api/admin/tenant-preview — preview cookie set/clear
async function postHandler(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return err("Gecersiz istek")

  // Clear preview
  if (body.action === "clear") {
    const res = NextResponse.json({ success: true })
    res.cookies.set("admin_preview_tenant", "", { maxAge: 0, path: "/" })
    return res
  }

  // Set preview
  const { tenant_id } = body
  if (!tenant_id) return err("tenant_id gerekli")

  const tenant = await db.tenant.findFirst({
    where: { id: tenant_id, is_active: true },
    select: { id: true, company_name: true },
  })
  if (!tenant) return err("Tenant bulunamadi")

  const res = NextResponse.json({ success: true, data: { tenant_id: tenant.id, company_name: tenant.company_name } })
  res.cookies.set("admin_preview_tenant", tenant.id, {
    maxAge: 60 * 60 * 4, // 4 saat
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  })
  return res
}

export const POST = withErrorHandler(postHandler, "POST /api/admin/tenant-preview")
