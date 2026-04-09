import { NextRequest } from "next/server"
import { ok, err, requireSupportAccess, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { sendSupportTicketReply } from "@/lib/email"

type Context = { params: Promise<{ id: string }> }

// GET /api/admin/support/[id] — talep detayı + mesaj geçmişi
async function getHandler(_req: NextRequest, { params }: Context) {
  const { error } = await requireSupportAccess()
  if (error) return error

  const { id } = await params

  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      tenant: { select: { company_name: true, domain_slug: true, owner_email: true, owner_name: true } },
      messages: {
        orderBy: { created_at: "asc" },
        include: { admin: { select: { full_name: true, role: true } } },
      },
    },
  })

  if (!ticket) return err("Talep bulunamadı", 404)

  return ok(ticket)
}

export const GET = withErrorHandler(getHandler, "GET /api/admin/support/[id]")

// POST /api/admin/support/[id] — yanıt yaz
async function postHandler(req: NextRequest, { params }: Context) {
  const { session, error } = await requireSupportAccess()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => null) as { content?: string } | null

  if (!body?.content?.trim()) return err("content zorunlu")

  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      tenant: { select: { owner_email: true, owner_name: true, company_name: true } },
    },
  })
  if (!ticket) return err("Talep bulunamadı", 404)
  if (ticket.status === "CLOSED") return err("Kapalı talebe yanıt yazılamaz")

  const adminId = session!.user.id === "env-admin" ? null : session!.user.id
  const adminName = session!.user.name ?? "Platform Admin"

  const [message] = await Promise.all([
    db.supportMessage.create({
      data: {
        ticket_id: id,
        sender: "ADMIN",
        admin_id: adminId,
        content: body.content.trim(),
      },
    }),
    // Talep durumunu IN_PROGRESS'e çek (hala açıksa)
    ticket.status === "OPEN"
      ? db.supportTicket.update({ where: { id }, data: { status: "IN_PROGRESS" } })
      : Promise.resolve(),
  ])

  // Tenant'a email bildirimi
  sendSupportTicketReply({
    toEmail: ticket.tenant.owner_email,
    toName: ticket.tenant.owner_name,
    senderName: adminName,
    ticketSubject: ticket.subject,
    ticketId: id,
    replyContent: body.content.trim(),
    viewUrl: `${process.env.NEXTAUTH_URL}/panel/destek/${id}`,
  }).catch(() => {})

  return ok(message, 201)
}

export const POST = withErrorHandler(postHandler, "POST /api/admin/support/[id]")

// PATCH /api/admin/support/[id] — durum/öncelik güncelle
async function patchHandler(req: NextRequest, { params }: Context) {
  const { error } = await requireSupportAccess()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => null) as {
    status?: string
    priority?: string
  } | null

  if (!body) return err("Geçersiz JSON")

  const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
  const VALID_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"]

  const updateData: Record<string, string> = {}
  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) return err("Geçersiz status")
    updateData.status = body.status
  }
  if (body.priority) {
    if (!VALID_PRIORITIES.includes(body.priority)) return err("Geçersiz priority")
    updateData.priority = body.priority
  }

  if (Object.keys(updateData).length === 0) return err("Güncellenecek alan yok")

  const ticket = await db.supportTicket.findUnique({ where: { id } })
  if (!ticket) return err("Talep bulunamadı", 404)

  const updated = await db.supportTicket.update({ where: { id }, data: updateData })

  return ok(updated)
}

export const PATCH = withErrorHandler(patchHandler, "PATCH /api/admin/support/[id]")
