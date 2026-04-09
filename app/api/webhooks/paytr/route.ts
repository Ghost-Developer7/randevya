import { NextRequest, NextResponse } from "next/server"
import { verifyPayTRWebhook, handleSuccessfulPayment } from "@/lib/paytr"
import { db } from "@/lib/db"
import { withErrorHandler } from "@/lib/api-helpers"

// POST /api/webhooks/paytr — PayTR'dan gelen ödeme bildirimi
// PayTR form-encoded POST gönderir, JSON değil
async function postHandler(req: NextRequest) {
  const formData = await req.formData()

  const merchantOid = formData.get("merchant_oid") as string
  const status = formData.get("status") as string
  const totalAmount = formData.get("total_amount") as string
  const hash = formData.get("hash") as string

  // Hash doğrulama
  const valid = verifyPayTRWebhook({ merchantOid, status, totalAmount, hash })
  if (!valid) {
    console.error("[PayTR] Geçersiz hash:", { merchantOid, status })
    // PayTR FAILED beklediğinde "OK" dönmezse tekrar dener
    return new NextResponse("INVALID_HASH", { status: 400 })
  }

  if (status === "success") {
    // merchant_oid formatı: {tenantId}_{planId}_{timestamp}
    const parts = merchantOid.split("_")
    if (parts.length < 2) {
      console.error("[PayTR] Geçersiz merchant_oid:", merchantOid)
      return new NextResponse("OK") // Yine de OK dön, PayTR tekrar denemez
    }

    const tenantId = parts[0]
    const planId = parts[1]

    // Tenant var mı?
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      console.error("[PayTR] Tenant bulunamadı:", tenantId)
      return new NextResponse("OK")
    }

    try {
      await handleSuccessfulPayment({ tenantId, planId, merchantOid })
      console.log(`[PayTR] Abonelik oluşturuldu: ${tenantId} → plan ${planId}`)
    } catch (e) {
      console.error("[PayTR] handleSuccessfulPayment hatası:", e)
    }
  } else {
    console.log(`[PayTR] Başarısız ödeme: ${merchantOid}`)
  }

  // PayTR "OK" beklier
  return new NextResponse("OK")
}
export const POST = withErrorHandler(postHandler, "POST /api/webhooks/paytr")
