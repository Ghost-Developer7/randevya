import { NextRequest } from "next/server"
import { ok, err, requireBillingAccess, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { uploadPdfToCloudinary, MAX_PDF_SIZE_BYTES, cloudinaryFolders } from "@/lib/cloudinary"
import { sendInvoiceEmail } from "@/lib/email"

// POST /api/admin/invoices/[id]/upload — fatura PDF yükle + email gönder
async function postHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireBillingAccess()
  if (error) return error

  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      subscription: {
        include: {
          tenant: { select: { id: true, company_name: true, owner_email: true, owner_name: true } },
          plan: { select: { name: true } },
        },
      },
    },
  })

  if (!invoice) return err("Fatura bulunamadı", 404)

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) return err("PDF dosyası zorunlu")
  if (file.type !== "application/pdf") return err("Sadece PDF dosyası yüklenebilir")
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return err(`Dosya boyutu ${(MAX_PDF_SIZE_BYTES / 1024 / 1024).toFixed(0)}MB limitini aşıyor`)
  }

  // PDF'i Cloudinary'ye yükle
  const buffer = Buffer.from(await file.arrayBuffer())
  const folder = cloudinaryFolders.invoicePdf(
    invoice.subscription.tenant.id,
    invoice.invoice_number
  )

  const uploaded = await uploadPdfToCloudinary(buffer, folder)

  // Invoice kaydını güncelle
  await db.invoice.update({
    where: { id },
    data: {
      pdf_url: uploaded.url,
      pdf_public_id: uploaded.publicId,
      status: "FATURA_YUKLENDI",
      emailed_at: new Date(),
    },
  })

  // Tenant'a fatura emaili gönder
  const tenant = invoice.subscription.tenant
  const billingPeriod = invoice.subscription.billing_period as "MONTHLY" | "YEARLY"

  await sendInvoiceEmail({
    tenantId: tenant.id,
    tenantEmail: tenant.owner_email,
    tenantName: tenant.owner_name,
    invoiceNumber: invoice.invoice_number,
    totalAmount: Number(invoice.total_amount).toFixed(2),
    planName: invoice.subscription.plan.name,
    billingPeriod,
    pdfUrl: uploaded.url,
  }).catch((e) => console.error("[Invoice] Email gönderimi hatası:", e))

  return ok({
    uploaded: true,
    pdf_url: uploaded.url,
    invoice_number: invoice.invoice_number,
  })
}

export const POST = withErrorHandler(postHandler, "POST /api/admin/invoices/[id]/upload")
