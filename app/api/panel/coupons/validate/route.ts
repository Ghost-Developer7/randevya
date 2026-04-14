import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// POST /api/panel/coupons/validate — kupon doğrulama
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const body = await req.json().catch(() => null)
  if (!body) return err("Geçersiz istek gövdesi")

  const { code, plan_id } = body
  if (!code) return err("Kupon kodu zorunlu")

  const normalizedCode = code.trim().toUpperCase()

  // 1. Kupon var mı?
  const coupon = await db.coupon.findUnique({ where: { code: normalizedCode } })
  if (!coupon) {
    return ok({ valid: false, reason: "Geçersiz kupon kodu" })
  }

  // 2. Aktif mi?
  if (!coupon.is_active) {
    return ok({ valid: false, reason: "Bu kupon devre dışı bırakılmış" })
  }

  // 3. Tarih aralığında mı?
  const now = new Date()
  if (now < coupon.valid_from) {
    return ok({ valid: false, reason: "Bu kupon henüz geçerli değil" })
  }
  if (now > coupon.valid_until) {
    return ok({ valid: false, reason: "Bu kuponun süresi dolmuş" })
  }

  // 4. Kullanım limiti aşılmış mı?
  if (coupon.used_count >= coupon.max_uses) {
    return ok({ valid: false, reason: "Bu kuponun kullanım limiti dolmuş" })
  }

  // 5. Plana uygun mu?
  if (coupon.plan_id && plan_id && coupon.plan_id !== plan_id) {
    return ok({ valid: false, reason: "Bu kupon seçili plan için geçerli değil" })
  }

  // 6. Bu tenant daha önce kullanmış mı?
  const alreadyUsed = await db.couponUsage.findFirst({
    where: { coupon_id: coupon.id, tenant_id: tenantId },
  })
  if (alreadyUsed) {
    return ok({ valid: false, reason: "Bu kuponu daha önce kullandınız" })
  }

  return ok({
    valid: true,
    coupon_id: coupon.id,
    discount_percent: coupon.discount_percent,
    code: coupon.code,
  })
}

export const POST = withErrorHandler(postHandler, "POST /api/panel/coupons/validate")
