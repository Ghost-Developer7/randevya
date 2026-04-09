import { NextRequest } from "next/server"
import { ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"

// GET /api/legal/[type] — sözleşmenin tam içeriği
// type: KVKK | PRIVACY_POLICY | TERMS_OF_USE | COOKIE_POLICY | DISTANCE_SALES
async function getHandler(_req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params

  const VALID_TYPES = ["KVKK", "PRIVACY_POLICY", "TERMS_OF_USE", "COOKIE_POLICY", "DISTANCE_SALES"]
  const typeUpper = type.toUpperCase()

  if (!VALID_TYPES.includes(typeUpper)) {
    return err("Geçersiz sözleşme türü. Geçerli değerler: " + VALID_TYPES.join(", "), 400)
  }

  const doc = await db.legalDocument.findFirst({
    where: { type: typeUpper, is_active: true },
    select: { id: true, type: true, title: true, content: true, version: true, created_at: true },
  })

  if (!doc) return err("Sözleşme bulunamadı", 404)

  return ok(doc)
}

export const GET = withErrorHandler(getHandler, "GET /api/legal/[type]")
