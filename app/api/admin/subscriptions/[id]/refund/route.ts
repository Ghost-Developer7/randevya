import { NextRequest } from "next/server"
import { ok, err, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { refundPayment } from "@/lib/paytr"

// POST /api/admin/subscriptions/[id]/refund — admin iade başlatır
async function postHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => null) as { amount?: number } | null

  const subscription = await db.tenantSubscription.findUnique({
    where: { id },
    include: { plan: true, tenant: true },
  })

  if (!subscription) return err("Abonelik bulunamadı", 404)
  if (!subscription.paytr_ref) return err("Bu aboneliğe ait PayTR referansı yok")
  if (subscription.status === "REFUNDED") return err("Bu abonelik zaten iade edildi", 409)

  // Varsayılan iade tutarı: plan aylık ücreti (kuruş)
  const amount = body?.amount ?? Math.round((subscription.plan.price_monthly ?? 0) * 100)
  if (!amount || amount <= 0) return err("Geçersiz iade tutarı")

  const result = await refundPayment({
    merchantOid: subscription.paytr_ref,
    amount,
    subscriptionId: subscription.id,
  })

  if (!result.success) return err(result.error ?? "İade işlemi başarısız", 502)

  return ok({
    refunded: true,
    subscription_id: subscription.id,
    tenant: subscription.tenant.company_name,
    amount_kurus: amount,
  })
}
export const POST = withErrorHandler(postHandler, "POST /api/admin/subscriptions/[id]/refund")
