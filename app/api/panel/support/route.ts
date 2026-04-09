import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { sendSupportTicketOpened } from "@/lib/email"

// GET /api/panel/support — tenant'ın kendi destek talepleri
async function getHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const where: Record<string, unknown> = { tenant_id: tenantId }
  if (status) where.status = status

  const tickets = await db.supportTicket.findMany({
    where,
    orderBy: { updated_at: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: { content: true, sender: true, created_at: true },
      },
    },
  })

  return ok({ tickets })
}

export const GET = withErrorHandler(getHandler, "GET /api/panel/support")

// POST /api/panel/support — yeni destek talebi aç
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id
  const body = await req.json().catch(() => null) as {
    subject?: string
    message?: string
    priority?: string
  } | null

  if (!body) return err("Geçersiz JSON")
  if (!body.subject?.trim()) return err("subject zorunlu")
  if (!body.message?.trim()) return err("message zorunlu (ilk mesaj)")

  const VALID_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"]
  const priority = body.priority && VALID_PRIORITIES.includes(body.priority)
    ? body.priority
    : "NORMAL"

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { company_name: true, owner_email: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  // Talep + ilk mesaj transaction ile oluştur
  const ticket = await db.supportTicket.create({
    data: {
      tenant_id: tenantId,
      subject: body.subject.trim(),
      priority,
      messages: {
        create: {
          sender: "TENANT",
          content: body.message.trim(),
        },
      },
    },
    include: { messages: true },
  })

  // Admin ekibine bildirim gönder (SUPPORT + SUPER_ADMIN)
  db.adminUser.findMany({
    where: {
      is_active: true,
      role: { in: ["SUPER_ADMIN", "SUPPORT"] },
    },
    select: { email: true },
  }).then((admins) => {
    const emails = admins.map((a) => a.email)
    if (emails.length) {
      sendSupportTicketOpened({
        adminEmails: emails,
        tenantName: tenant.company_name,
        tenantEmail: tenant.owner_email,
        ticketId: ticket.id,
        subject: ticket.subject,
        firstMessage: body.message!.trim(),
      }).catch(() => {})
    }
  }).catch(() => {})

  return ok(ticket, 201)
}

export const POST = withErrorHandler(postHandler, "POST /api/panel/support")
