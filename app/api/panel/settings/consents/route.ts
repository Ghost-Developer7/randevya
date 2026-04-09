import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/panel/settings/consents
// Tenant'ın onayladığı tüm sözleşmeleri sözleşme metniyle birlikte döner
async function getHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const consents = await db.userConsent.findMany({
    where: { tenant_id: tenantId },
    include: {
      document: {
        select: { type: true, title: true, version: true, content: true },
      },
    },
    orderBy: { accepted_at: "asc" },
  })

  if (!consents.length) return ok({ consents: [] })

  return ok({
    consents: consents.map((c) => ({
      id: c.id,
      document_type: c.document.type,
      document_title: c.document.title,
      document_version: c.document.version,
      document_content: c.document.content,
      user_email: c.user_email,
      ip_address: c.ip_address,
      accepted_at: c.accepted_at,
      acceptance_note: `"Okudum, anladım ve onaylıyorum" — ${c.user_email} — IP: ${c.ip_address} — ${new Date(c.accepted_at).toLocaleString("tr-TR")}`,
    })),
  })
}

export const GET = withErrorHandler(getHandler as never, "GET /api/panel/settings/consents")
