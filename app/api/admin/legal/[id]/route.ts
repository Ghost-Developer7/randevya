import { NextRequest } from "next/server"
import { ok, err, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/admin/legal/[id] — tam içerikle sözleşmeyi görüntüle
async function getHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params

  const doc = await db.legalDocument.findUnique({
    where: { id },
    include: {
      _count: { select: { consents: true } },
    },
  })

  if (!doc) return err("Sözleşme bulunamadı", 404)

  return ok(doc)
}

export const GET = withErrorHandler(getHandler, "GET /api/admin/legal/[id]")

// PATCH /api/admin/legal/[id] — aktif/pasif yap (içerik değişikliği için POST kullanın)
async function patchHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => null) as { is_active?: boolean } | null

  if (!body || body.is_active === undefined) return err("is_active boolean zorunlu")

  const doc = await db.legalDocument.findUnique({ where: { id } })
  if (!doc) return err("Sözleşme bulunamadı", 404)

  // Aktifleştirme: aynı type'ın diğer aktif versiyonunu kapat
  if (body.is_active) {
    await db.legalDocument.updateMany({
      where: { type: doc.type, is_active: true, id: { not: id } },
      data: { is_active: false },
    })
  }

  const updated = await db.legalDocument.update({
    where: { id },
    data: { is_active: body.is_active },
  })

  return ok(updated)
}

export const PATCH = withErrorHandler(patchHandler, "PATCH /api/admin/legal/[id]")
