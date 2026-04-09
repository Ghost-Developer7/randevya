import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/services — tenant'ın aktif hizmet listesi
// ?staffId=xxx  filtresi ile sadece o personelin verdiği hizmetleri getirir
async function getHandler(req: NextRequest) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  const staffId = req.nextUrl.searchParams.get("staffId")

  const services = staffId
    ? await db.service.findMany({
        where: {
          tenant_id: tenant.id,
          is_active: true,
          staff_services: { some: { staff_id: staffId } },
        },
        orderBy: { name: "asc" },
      })
    : await db.service.findMany({
        where: { tenant_id: tenant.id, is_active: true },
        orderBy: { name: "asc" },
      })

  return ok(
    services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      duration_min: s.duration_min,
    }))
  )
}
export const GET = withErrorHandler(getHandler, "GET /api/services")
