import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, parseBody, assertTenantOwner, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import type { UpdateServiceRequest } from "@/types"

// PATCH /api/panel/services/[id]
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const service = await db.service.findUnique({ where: { id } })
  if (!service) return err("Hizmet bulunamadı", 404)

  const ownerErr = assertTenantOwner(tenantId, service.tenant_id)
  if (ownerErr) return ownerErr

  const { body, error: bodyErr } = await parseBody<UpdateServiceRequest>(req)
  if (bodyErr) return bodyErr

  const { name, description, duration_min, is_active } = body!

  const updated = await db.service.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(duration_min !== undefined && { duration_min }),
      ...(is_active !== undefined && { is_active }),
    },
  })

  return ok(updated)
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/panel/services/[id]")

// DELETE /api/panel/services/[id] — pasife al
async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const service = await db.service.findUnique({ where: { id } })
  if (!service) return err("Hizmet bulunamadı", 404)

  const ownerErr = assertTenantOwner(tenantId, service.tenant_id)
  if (ownerErr) return ownerErr

  const upcoming = await db.appointment.count({
    where: {
      service_id: id,
      tenant_id: tenantId,
      status: { in: ["PENDING", "CONFIRMED"] },
      start_time: { gt: new Date() },
    },
  })

  if (upcoming > 0) {
    return err(`Bu hizmet için ${upcoming} bekleyen randevu var.`, 422)
  }

  await db.service.update({ where: { id }, data: { is_active: false } })

  return ok({ deactivated: true })
}
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/panel/services/[id]")
