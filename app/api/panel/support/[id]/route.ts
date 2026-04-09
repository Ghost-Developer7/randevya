import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { sendSupportTicketReply } from "@/lib/email"

type Context = { params: Promise<{ id: string }> }

// GET /api/panel/support/[id] — talep detayı + tüm mesajlar
async function getHandler(_req: NextRequest, { params }: Context) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params

  const ticket = await db.supportTicket.findUnique({
    where: { id, tenant_id: session!.user.tenant_id },
    include: {
      messages: {
        orderBy: { created_at: "asc" },
        include: { admin: { select: { full_name: true } } },
      },
    },
  })

  if (!ticket) return err("Talep bulunamadı", 404)

  return ok(ticket)
}

export const GET = withErrorHandler(getHandler, "GET /api/panel/support/[id]")

// POST /api/panel/support/[id] — tenant yanıt yazar
async function postHandler(req: NextRequest, { params }: Context) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id } = await params
  const tenantId = session!.user.tenant_id

  const body = await req.json().catch(() => null) as { content?: string } | null
  if (!body?.content?.trim()) return err("content zorunlu")

  const ticket = await db.supportTicket.findUnique({
    where: { id, tenant_id: tenantId },
    include: { tenant: { select: { company_name: true, owner_email: true, owner_name: true } } },
  })
  if (!ticket) return err("Talep bulunamadı", 404)
  if (ticket.status === "CLOSED") return err("Kapalı talebe yanıt yazılamaz")
  if (ticket.status === "RESOLVED") return err("Çözülmüş talep. Yeni talep açmak ister misiniz?")

  const [message] = await Promise.all([
    db.supportMessage.create({
      data: {
        ticket_id: id,
        sender: "TENANT",
        content: body.content.trim(),
      },
    }),
    // Tekrar aktif hale getir
    db.supportTicket.update({ where: { id }, data: { status: "OPEN" } }),
  ])

  // Admin ekibine bildirim (SUPPORT + SUPER_ADMIN)
  db.adminUser.findMany({
    where: { is_active: true, role: { in: ["SUPER_ADMIN", "SUPPORT"] } },
    select: { email: true, full_name: true },
  }).then((admins) => {
    admins.forEach((admin) => {
      sendSupportTicketReply({
        toEmail: admin.email,
        toName: admin.full_name,
        senderName: ticket.tenant.company_name,
        ticketSubject: ticket.subject,
        ticketId: id,
        replyContent: body.content!.trim(),
        viewUrl: `${process.env.NEXTAUTH_URL}/admin/support/${id}`,
      }).catch(() => {})
    })
  }).catch(() => {})

  return ok(message, 201)
}

export const POST = withErrorHandler(postHandler, "POST /api/panel/support/[id]")
