import { NextRequest } from "next/server"
import { ok, err, requireSuperAdmin, requireAdminSession, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

const VALID_TYPES = ["KVKK", "PRIVACY_POLICY", "TERMS_OF_USE", "COOKIE_POLICY", "DISTANCE_SALES"]

// GET /api/admin/legal — tüm sözleşme versiyonlarını listele
async function getHandler() {
  const { error } = await requireAdminSession()
  if (error) return error

  const docs = await db.legalDocument.findMany({
    orderBy: [{ type: "asc" }, { created_at: "desc" }],
    include: { _count: { select: { consents: true } } },
    select: {
      id: true,
      type: true,
      title: true,
      version: true,
      is_active: true,
      created_at: true,
      _count: true,
    },
  })

  return ok({ documents: docs })
}

export const GET = withErrorHandler(getHandler as never, "GET /api/admin/legal")

// POST /api/admin/legal — yeni sözleşme versiyonu yayınla (SUPER_ADMIN)
// Aynı type için önceki aktif versiyon otomatik devre dışı bırakılır
async function postHandler(req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await req.json().catch(() => null) as {
    type?: string
    title?: string
    content?: string
    version?: string
  } | null

  if (!body) return err("Geçersiz JSON")
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return err(`type geçersiz. Geçerli değerler: ${VALID_TYPES.join(", ")}`)
  }
  if (!body.title?.trim()) return err("title zorunlu")
  if (!body.content?.trim()) return err("content zorunlu")
  if (!body.version?.trim()) return err("version zorunlu (örn: '1.1')")

  // Aynı type'ın mevcut aktif versiyonunu kapat
  await db.legalDocument.updateMany({
    where: { type: body.type, is_active: true },
    data: { is_active: false },
  })

  const doc = await db.legalDocument.create({
    data: {
      type: body.type,
      title: body.title.trim(),
      content: body.content.trim(),
      version: body.version.trim(),
      is_active: true,
    },
  })

  return ok(doc, 201)
}

export const POST = withErrorHandler(postHandler, "POST /api/admin/legal")
