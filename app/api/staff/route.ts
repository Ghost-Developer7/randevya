import { NextRequest } from "next/server"
import { getTenantFromRequest, ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import type { WorkHours } from "@/types"

// GET /api/staff — tenant'ın aktif personel listesi
// ?serviceId=xxx  filtresi ile sadece o hizmeti veren personeli getirir
async function getHandler(req: NextRequest) {
  const tenant = await getTenantFromRequest(req)
  if (!tenant) return err("Tenant bulunamadı", 404)

  const serviceId = req.nextUrl.searchParams.get("serviceId")

  const staff = serviceId
    ? await db.staff.findMany({
        where: {
          tenant_id: tenant.id,
          is_active: true,
          staff_services: { some: { service_id: serviceId } },
        },
        orderBy: { full_name: "asc" },
      })
    : await db.staff.findMany({
        where: { tenant_id: tenant.id, is_active: true },
        orderBy: { full_name: "asc" },
      })

  return ok(
    staff.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      title: s.title,
      photo_url: s.photo_url,
      work_hours: JSON.parse(s.work_hours) as WorkHours,
    }))
  )
}
export const GET = withErrorHandler(getHandler, "GET /api/staff")
