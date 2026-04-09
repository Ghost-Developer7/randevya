import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, parseBody, assertTenantOwner, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import type { UpdateStaffRequest } from "@/types"

// PATCH /api/panel/staff/[id] — personel güncelle
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const staff = await db.staff.findUnique({ where: { id } })
  if (!staff) return err("Personel bulunamadı", 404)

  const ownerErr = assertTenantOwner(tenantId, staff.tenant_id)
  if (ownerErr) return ownerErr

  const { body, error: bodyErr } = await parseBody<UpdateStaffRequest>(req)
  if (bodyErr) return bodyErr

  const { full_name, title, work_hours, is_active, photo_url } = body!

  const updated = await db.staff.update({
    where: { id },
    data: {
      ...(full_name !== undefined && { full_name: full_name.trim() }),
      ...(title !== undefined && { title: title?.trim() ?? null }),
      ...(work_hours !== undefined && { work_hours: JSON.stringify(work_hours) }),
      ...(is_active !== undefined && { is_active }),
      ...(photo_url !== undefined && { photo_url }),
    },
  })

  return ok({ id: updated.id, full_name: updated.full_name, is_active: updated.is_active })
}
export const PATCH = withErrorHandler(patchHandler, "PATCH /api/panel/staff/[id]")

// DELETE /api/panel/staff/[id] — personel pasife al (silme değil)
async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const staff = await db.staff.findUnique({ where: { id } })
  if (!staff) return err("Personel bulunamadı", 404)

  const ownerErr = assertTenantOwner(tenantId, staff.tenant_id)
  if (ownerErr) return ownerErr

  // Gelecekteki randevuları kontrol et
  const upcoming = await db.appointment.count({
    where: {
      staff_id: id,
      tenant_id: tenantId,
      status: { in: ["PENDING", "CONFIRMED"] },
      start_time: { gt: new Date() },
    },
  })

  if (upcoming > 0) {
    return err(`Bu personelin ${upcoming} bekleyen randevusu var. Önce randevuları iptal edin.`, 422)
  }

  await db.staff.update({ where: { id }, data: { is_active: false } })

  return ok({ deactivated: true })
}
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/panel/staff/[id]")

// PUT /api/panel/staff/[id]/services  →  hizmet atamaları güncelle
// Body: { service_ids: string[] }
async function putHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id: staffId } = await params
  const tenantId = session!.user.tenant_id

  const staff = await db.staff.findUnique({ where: { id: staffId } })
  if (!staff) return err("Personel bulunamadı", 404)

  const ownerErr = assertTenantOwner(tenantId, staff.tenant_id)
  if (ownerErr) return ownerErr

  const body = await req.json().catch(() => null)
  const serviceIds: string[] = body?.service_ids ?? []

  // Tüm mevcut atamaları sil, yenileri ekle
  await db.staffService.deleteMany({ where: { staff_id: staffId, tenant_id: tenantId } })

  if (serviceIds.length > 0) {
    await db.staffService.createMany({
      data: serviceIds.map((sid) => ({
        tenant_id: tenantId,
        staff_id: staffId,
        service_id: sid,
      })),
    })
  }

  return ok({ updated: true, service_count: serviceIds.length })
}
export const PUT = withErrorHandler(putHandler, "PUT /api/panel/staff/[id]")
