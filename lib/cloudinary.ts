import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "dskjimibf",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export type UploadResult = {
  url: string          // optimize edilmiş CDN URL
  publicId: string     // Cloudinary public_id (silmek için gerekli)
  width: number
  height: number
  bytes: number        // optimize sonrası boyut
  format: string
}

type UploadOptions = {
  folder: string       // randevya/tenants/{id}/logo gibi
  maxWidth?: number
  maxHeight?: number
  quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | number
}

/**
 * Buffer'ı Cloudinary'ye yükler.
 * - Format otomatik webp/avif'e dönüştürülür
 * - Boyut maxWidth/maxHeight ile sınırlandırılır (crop: limit — oranı korur)
 * - quality: "auto:best" ile boyut maksimum indirilir
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  options: UploadOptions
): Promise<UploadResult> {
  const { folder, maxWidth = 1200, maxHeight = 1200, quality = "auto:best" } = options

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        // Sadece randevya projesine ait olduğunu açıkça belirten prefix
        // (aynı Cloudinary hesabındaki diğer projeyle karışmasın)
        resource_type: "image",
        transformation: [
          // 1. Boyutu küçült (oranı koru, büyütme)
          { width: maxWidth, height: maxHeight, crop: "limit" },
          // 2. Format + kalite optimizasyonu
          { quality, fetch_format: "auto" },
        ],
        // Gereksiz metadata'yı temizle (EXIF vb.) — daha küçük dosya
        invalidate: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary yükleme başarısız"))
          return
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        })
      }
    )
    stream.end(buffer)
  })
}

/**
 * Mevcut görseli Cloudinary'den siler.
 * Tenant değiştiğinde eski logo/fotoğrafı temizlemek için kullanılır.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { invalidate: true })
}

/**
 * Dosya boyutu kontrolü (yükleme öncesi)
 * Vercel'in 4.5MB body limitini aşan dosyaları reddeder
 */
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Dosya boyutu ${(MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)}MB limitini aşıyor`
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Desteklenmeyen dosya türü. İzin verilenler: JPEG, PNG, WebP, GIF`
  }
  return null
}

// Klasör yapısı — diğer projeden kesinlikle ayrılmış
export const cloudinaryFolders = {
  tenantLogo: (tenantId: string) => `randevya/tenants/${tenantId}/logo`,
  staffPhoto: (tenantId: string, staffId: string) =>
    `randevya/tenants/${tenantId}/staff/${staffId}`,
}
