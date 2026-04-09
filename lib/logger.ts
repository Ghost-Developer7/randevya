import { db } from "@/lib/db"

export type LogErrorParams = {
  endpoint: string
  method: string
  error: unknown
  statusCode?: number
  tenantId?: string | null
  userEmail?: string | null
  userRole?: string | null
  ip?: string | null
}

/**
 * Merkezi hata loglayıcı.
 * Tüm beklenmeyen hatalar buraya yönlendirilir, ErrorLogs tablosuna yazılır.
 * DB'ye yazma da başarısız olursa console.error ile geri düşer.
 */
export async function logError(params: LogErrorParams): Promise<void> {
  const msg =
    params.error instanceof Error
      ? params.error.message
      : typeof params.error === "string"
        ? params.error
        : JSON.stringify(params.error)

  const stack = params.error instanceof Error ? params.error.stack : undefined

  try {
    await db.errorLog.create({
      data: {
        endpoint: params.endpoint.slice(0, 500),
        method: params.method.slice(0, 10),
        status_code: params.statusCode ?? 500,
        error_msg: msg.slice(0, 4000),
        stack_trace: stack ? stack.slice(0, 4000) : null,
        tenant_id: params.tenantId ?? null,
        user_email: params.userEmail ? params.userEmail.slice(0, 255) : null,
        user_role: params.userRole ? params.userRole.slice(0, 50) : null,
        ip_address: params.ip ? params.ip.slice(0, 100) : null,
      },
    })
  } catch (dbErr) {
    // Logger kendisi çökerse sistemi patlatma, sadece console'a yaz
    console.error("[ErrorLogger] DB yazma başarısız:", dbErr)
    console.error("[ErrorLogger] Orijinal hata:", {
      endpoint: params.endpoint,
      method: params.method,
      error: params.error,
      tenant_id: params.tenantId,
      user_email: params.userEmail,
    })
  }
}
