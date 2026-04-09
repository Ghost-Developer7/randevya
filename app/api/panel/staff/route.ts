import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, parseBody, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { checkPlanLimit } from "@/lib/tenant"
import type { CreateStaffRequest } from "@/types"

// GET /api/panel/staff — personel listesi
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const staff = await db.staff.findMany({
    where: { tenant_id: session!.user.tenant_id },
    include: {
      staff_services: {
        include: { service: { select: { id: true, name: true } } },
      },
    },
    orderBy: { full_name: "asc" },
  })

  return ok(
    staff.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      title: s.title,
      photo_url: s.photo_url,
      work_hours: JSON.parse(s.work_hours),
      is_active: s.is_active,
      services: s.staff_services.map((ss) => ss.service),
    }))
  )
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/staff")

// POST /api/panel/staff — personel ekle
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  // Plan limiti kontrolü
  const limit = await checkPlanLimit(tenantId, "staff")
  if (!limit.allowed) {
    return err(`Personel limitine ulaşıldı (${limit.current}/${limit.max}). Planı yükseltin.`, 403)
  }

  const { body, error: bodyErr } = await parseBody<CreateStaffRequest>(req)
  if (bodyErr) return bodyErr

  const { full_name, title, work_hours } = body!

  if (!full_name?.trim()) return err("full_name zorunlu")
  if (!work_hours) return err("work_hours zorunlu")

  const staff = await db.staff.create({
    data: {
      tenant_id: tenantId,
      full_name: full_name.trim(),
      title: title?.trim() ?? null,
      work_hours: JSON.stringify(work_hours),
      is_active: true,
    },
  })

  return ok({ id: staff.id, full_name: staff.full_name }, 201)
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/staff")
