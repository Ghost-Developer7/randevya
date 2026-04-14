import { NextRequest, NextResponse } from "next/server"
import { verifyPayTRWebhook, handleSuccessfulPayment, getActiveSubscription } from "@/lib/paytr"
import { sendPaymentConfirmation, sendAdminNewPurchaseNotify } from "@/lib/email"
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
    return new NextResponse("INVALID_HASH", { status: 400 })
  }

  // PendingPayment tablosundan metadata'yı çek
  const pending = await db.pendingPayment.findUnique({
    where: { merchant_oid: merchantOid },
  })

  if (!pending) {
    console.error("[PayTR] PendingPayment bulunamadı:", merchantOid)
    return new NextResponse("OK")
  }

  // Zaten işlenmiş mi kontrol et (duplicate webhook)
  if (pending.status !== "PENDING") {
    console.log(`[PayTR] Zaten işlenmiş: ${merchantOid} (${pending.status})`)
    return new NextResponse("OK")
  }

  if (status === "success") {
    try {
      await handleSuccessfulPayment({
        tenantId: pending.tenant_id,
        planId: pending.plan_id,
        merchantOid,
        billingPeriod: pending.billing_period as "MONTHLY" | "YEARLY",
        netAmount: Number(pending.net_amount),
        totalAmount: Number(pending.total_amount),
        billingAddressId: pending.billing_address_id,
        couponId: pending.coupon_id ?? undefined,
      })

      // PendingPayment status güncelle
      await db.pendingPayment.update({
        where: { merchant_oid: merchantOid },
        data: { status: "COMPLETED" },
      })

      // Kupon kullanım kaydı
      if (pending.coupon_id) {
        const sub = await getActiveSubscription(pending.tenant_id)
        const coupon = await db.coupon.findUnique({ where: { id: pending.coupon_id } })
        if (coupon) {
          const originalTotal = Number(pending.total_amount) / (1 - coupon.discount_percent / 100)
          await db.couponUsage.create({
            data: {
              coupon_id: pending.coupon_id,
              tenant_id: pending.tenant_id,
              subscription_id: sub?.id,
              discount_amount: Math.round((originalTotal - Number(pending.total_amount)) * 100) / 100,
              original_amount: Math.round(originalTotal * 100) / 100,
              final_amount: Number(pending.total_amount),
            },
          })
          await db.coupon.update({
            where: { id: pending.coupon_id },
            data: { used_count: { increment: 1 } },
          })
        }
      }

      // Ödeme onay emaili gönder
      const tenant = await db.tenant.findUnique({
        where: { id: pending.tenant_id },
        include: { plan: true },
      })
      if (tenant) {
        const endsAt = new Date()
        if (pending.billing_period === "YEARLY") {
          endsAt.setFullYear(endsAt.getFullYear() + 1)
        } else {
          endsAt.setMonth(endsAt.getMonth() + 1)
        }

        await sendPaymentConfirmation({
          tenantId: tenant.id,
          tenantEmail: tenant.owner_email,
          tenantName: tenant.owner_name,
          planName: tenant.plan.name,
          totalAmount: Number(pending.total_amount).toFixed(2),
          billingPeriod: pending.billing_period as "MONTHLY" | "YEARLY",
          nextRenewalDate: endsAt.toLocaleDateString("tr-TR", {
            day: "numeric", month: "long", year: "numeric",
          }),
        }).catch((e) => console.error("[PayTR] Email gönderimi hatası:", e))

        // Admin'lere yeni satın alma bildirimi
        const admins = await db.adminUser.findMany({
          where: { is_active: true, role: { in: ["SUPER_ADMIN", "BILLING"] } },
          select: { email: true },
        })
        if (admins.length > 0) {
          sendAdminNewPurchaseNotify({
            adminEmails: admins.map((a) => a.email),
            tenantName: tenant.owner_name,
            tenantEmail: tenant.owner_email,
            planName: tenant.plan.name,
            billingPeriod: pending.billing_period as "MONTHLY" | "YEARLY",
            totalAmount: Number(pending.total_amount).toFixed(2),
          }).catch((e) => console.error("[PayTR] Admin bildirim hatası:", e))
        }
      }

      console.log(`[PayTR] Abonelik oluşturuldu: ${pending.tenant_id} → plan ${pending.plan_id}`)
    } catch (e) {
      console.error("[PayTR] handleSuccessfulPayment hatası:", e)
    }
  } else {
    // Başarısız ödeme
    await db.pendingPayment.update({
      where: { merchant_oid: merchantOid },
      data: { status: "FAILED" },
    })
    console.log(`[PayTR] Başarısız ödeme: ${merchantOid}`)
  }

  // PayTR "OK" bekler
  return new NextResponse("OK")
}
export const POST = withErrorHandler(postHandler, "POST /api/webhooks/paytr")
