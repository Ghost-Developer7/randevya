import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, assertTenantOwner, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  validateImageFile,
  cloudinaryFolders,
} from "@/lib/cloudinary"

/**
 * Cloudinary URL'sinden public_id çıkar.
 * URL formatı: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{ext}
 */
function extractPublicId(url: string): string | null {
  try {
    const uploadMarker = "/image/upload/"
    const idx = url.indexOf(uploadMarker)
    if (idx === -1) return null

    let rest = url.slice(idx + uploadMarker.length)
    rest = rest.replace(/^v\d+\//, "")

    const dotIdx = rest.lastIndexOf(".")
    if (dotIdx !== -1) rest = rest.slice(0, dotIdx)

    return rest || null
  } catch {
    return null
  }
}

// POST /api/panel/staff/[id]/photo — personel fotoğrafı yükle
async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id: staffId } = await params
  const tenantId = session!.user.tenant_id

  const staff = await db.staff.findUnique({ where: { id: staffId } })
  if (!staff) return err("Personel bulunamadı", 404)

  const ownerErr = assertTenantOwner(tenantId, staff.tenant_id)
  if (ownerErr) return ownerErr

  const formData = await req.formData().catch(() => null)
  if (!formData) return err("Geçersiz form verisi")

  const file = formData.get("file")
  if (!file || !(file instanceof File)) return err("'file' alanı gerekli")

  const validationError = validateImageFile(file)
  if (validationError) return err(validationError)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Eski fotoğrafı Cloudinary'den sil
  if (staff.photo_url) {
    const oldPublicId = extractPublicId(staff.photo_url)
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId).catch(() => {})
    }
  }

  const result = await uploadToCloudinary(buffer, file.type, {
    folder: cloudinaryFolders.staffPhoto(tenantId, staffId),
    maxWidth: 600,
    maxHeight: 600,
  })

  await db.staff.update({
    where: { id: staffId },
    data: { photo_url: result.url },
  })

  return ok({
    photo_url: result.url,
    bytes: result.bytes,
    format: result.format,
  })
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/staff/[id]/photo")

// DELETE /api/panel/staff/[id]/photo — personel fotoğrafını kaldır
async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const { id: staffId } = await params
  const tenantId = session!.user.tenant_id

  const staff = await db.staff.findUnique({ where: { id: staffId } })
  if (!staff) return err("Personel bulunamadı", 404)

  const ownerErr = assertTenantOwner(tenantId, staff.tenant_id)
  if (ownerErr) return ownerErr

  if (!staff.photo_url) return err("Silinecek fotoğraf yok", 404)

  const publicId = extractPublicId(staff.photo_url)
  if (publicId) {
    await deleteFromCloudinary(publicId).catch(() => {})
  }

  await db.staff.update({
    where: { id: staffId },
    data: { photo_url: null },
  })

  return ok({ removed: true })
}
export const DELETE = withErrorHandler(deleteHandler, "DELETE /api/panel/staff/[id]/photo")
