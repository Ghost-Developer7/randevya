import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, parseBody, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { checkPlanLimit } from "@/lib/tenant"
import type { CreateServiceRequest } from "@/types"

// GET /api/panel/services
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const services = await db.service.findMany({
    where: { tenant_id: session!.user.tenant_id },
    orderBy: { name: "asc" },
  })

  return ok(services)
}
export const GET = withErrorHandler(getHandler as never, "GET /api/panel/services")

// POST /api/panel/services
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const limit = await checkPlanLimit(tenantId, "services")
  if (!limit.allowed) {
    return err(`Hizmet limitine ulaşıldı (${limit.current}/${limit.max}). Planı yükseltin.`, 403)
  }

  const { body, error: bodyErr } = await parseBody<CreateServiceRequest>(req)
  if (bodyErr) return bodyErr

  const { name, description, duration_min } = body!

  if (!name?.trim()) return err("name zorunlu")
  if (!duration_min || duration_min < 5) return err("duration_min en az 5 dakika olmalı")

  const service = await db.service.create({
    data: {
      tenant_id: tenantId,
      name: name.trim(),
      description: description?.trim() ?? null,
      duration_min,
      is_active: true,
    },
  })

  return ok(service, 201)
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/services")
