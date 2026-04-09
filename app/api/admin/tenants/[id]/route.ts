import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// PATCH /api/admin/tenants/[id] — tenant güncelle (aktif/pasif, plan değiştir)
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params

  const tenant = await db.tenant.findUnique({ where: { id } })
  if (!tenant) return err("Tenant bulunamadı", 404)

  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz JSON")

  const { is_active, plan_id, custom_domain } = body as {
    is_active?: boolean
    plan_id?: string
    custom_domain?: string | null
  }

  // Plan değişiyorsa var olduğunu kontrol et
  if (plan_id) {
    const plan = await db.plan.findUnique({ where: { id: plan_id } })
    if (!plan) return err("Plan bulunamadı", 404)
  }

  const updated = await db.tenant.update({
    where: { id },
    data: {
      ...(is_active !== undefined && { is_active }),
      ...(plan_id !== undefined && { plan_id }),
      ...(custom_domain !== undefined && { custom_domain: custom_domain ?? null }),
    },
  })

  return ok({
    id: updated.id,
    is_active: updated.is_active,
    plan_id: updated.plan_id,
    custom_domain: updated.custom_domain,
  })
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/admin/tenants/[id]")

// DELETE /api/admin/tenants/[id] — tenant'ı kalıcı pasife al
async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params

  await db.tenant.update({ where: { id }, data: { is_active: false } })

  return ok({ deactivated: true })
}
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/admin/tenants/[id]")
