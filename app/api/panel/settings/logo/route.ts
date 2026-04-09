import { NextRequest } from "next/server"
import { ok, err, requireTenantSession, withErrorHandler } from "@/lib/api-helpers"
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
 * Transformasyon parametreleri (örn. /w_400,h_400/) varsa onların ötesindeki parça alınır.
 */
function extractPublicId(url: string): string | null {
  try {
    const uploadMarker = "/image/upload/"
    const idx = url.indexOf(uploadMarker)
    if (idx === -1) return null

    // upload/ sonrasındaki parça: "v1234567890/randevya/tenants/xxx/logo/file.webp"
    let rest = url.slice(idx + uploadMarker.length)

    // Versiyon prefix'ini atla: v1234567890/
    rest = rest.replace(/^v\d+\//, "")

    // Uzantıyı kaldır
    const dotIdx = rest.lastIndexOf(".")
    if (dotIdx !== -1) rest = rest.slice(0, dotIdx)

    return rest || null
  } catch {
    return null
  }
}

// POST /api/panel/settings/logo — kiracı logosunu yükle
async function postHandler(req: NextRequest) {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const formData = await req.formData().catch(() => null)
  if (!formData) return err("Geçersiz form verisi")

  const file = formData.get("file")
  if (!file || !(file instanceof File)) return err("'file' alanı gerekli")

  const validationError = validateImageFile(file)
  if (validationError) return err(validationError)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Eski logoyu Cloudinary'den sil
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { logo_url: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  if (tenant.logo_url) {
    const oldPublicId = extractPublicId(tenant.logo_url)
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId).catch(() => {
        // Eski logo silinemese de yüklemeyi engelleme
      })
    }
  }

  const result = await uploadToCloudinary(buffer, file.type, {
    folder: cloudinaryFolders.tenantLogo(tenantId),
    maxWidth: 400,
    maxHeight: 400,
  })

  await db.tenant.update({
    where: { id: tenantId },
    data: { logo_url: result.url },
  })

  return ok({
    logo_url: result.url,
    bytes: result.bytes,
    format: result.format,
  })
}
export const POST = withErrorHandler(postHandler, "POST /api/panel/settings/logo")

// DELETE /api/panel/settings/logo — logoyu kaldır
async function deleteHandler() {
  const { session, error } = await requireTenantSession()
  if (error) return error

  const tenantId = session!.user.tenant_id

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { logo_url: true },
  })
  if (!tenant) return err("Tenant bulunamadı", 404)

  if (!tenant.logo_url) return err("Silinecek logo yok", 404)

  const publicId = extractPublicId(tenant.logo_url)
  if (publicId) {
    await deleteFromCloudinary(publicId).catch(() => {})
  }

  await db.tenant.update({
    where: { id: tenantId },
    data: { logo_url: null },
  })

  return ok({ removed: true })
}
export const DELETE = withErrorHandler(deleteHandler as never, "DELETE /api/panel/settings/logo")
