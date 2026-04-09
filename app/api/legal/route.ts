import { ok, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/legal — tüm aktif sözleşmelerin listesi (kayıt formunda kullanılır)
// İçerik döndürmez, sadece meta bilgi — içerik için /api/legal/[type]
async function getHandler() {
  const docs = await db.legalDocument.findMany({
    where: { is_active: true },
    select: { id: true, type: true, title: true, version: true, created_at: true },
    orderBy: { type: "asc" },
  })

  return ok({ documents: docs })
}

export const GET = withErrorHandler(getHandler as never, "GET /api/legal")
