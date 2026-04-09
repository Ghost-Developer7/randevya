/**
 * Redis Sliding Window Rate Limiter
 * Upstash Redis kullanır (zaten projede mevcut)
 *
 * Algoritma: Sliding window — son N saniyedeki istek sayısını sayar.
 * Atomic MULTI/EXEC ile race condition yok.
 */

import { redis } from "@/lib/redis"
import { NextRequest, NextResponse } from "next/server"
import { err } from "@/lib/api-helpers"

export type RateLimitResult = {
  success: boolean     // istek kabul edildi mi?
  limit: number        // toplam limit
  remaining: number    // kalan hak
  resetAt: number      // Unix timestamp (ms) — pencere sıfırlanma zamanı
}

/**
 * Sliding window rate limiter.
 * @param key      Redis key (örn: "rl:register:1.2.3.4")
 * @param limit    Pencere başına maksimum istek
 * @param windowSec Pencere süresi (saniye)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowSec * 1000

  try {
    // Atomic pipeline: eski kayıtları temizle, yeni ekle, say
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(key, 0, windowStart)        // eski istekleri sil
    pipeline.zadd(key, { score: now, member: `${now}` })  // yeni isteği ekle
    pipeline.zcard(key)                                    // toplam sayı
    pipeline.expire(key, windowSec + 1)                   // TTL ayarla

    const results = await pipeline.exec()
    const count = (results?.[2] as number) ?? 0

    const remaining = Math.max(0, limit - count)
    const resetAt = now + windowSec * 1000

    return { success: count <= limit, limit, remaining, resetAt }
  } catch {
    // Redis hata verirse isteği geçir (fail open) — hizmeti kesmiyoruz
    return { success: true, limit, remaining: limit, resetAt: now + windowSec * 1000 }
  }
}

/**
 * IP adresini request'ten al.
 * Vercel'de x-forwarded-for header gelir.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

/**
 * Rate limit yanıt başlıkları ekle (RFC 6585 uyumlu)
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit))
  response.headers.set("X-RateLimit-Remaining", String(result.remaining))
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)))
  return response
}

/**
 * Rate limit HOF — route handler'ını sarar.
 * Limit aşılınca 429 döner, headers ekler.
 */

// Öntanımlı limitler
export const RATE_LIMITS = {
  // Public — misafir kullanıcılar
  publicBooking: { limit: 10, windowSec: 60 },       // 10/dk — randevu oluşturma
  publicSlots:   { limit: 30, windowSec: 60 },       // 30/dk — slot sorgulama
  publicRead:    { limit: 60, windowSec: 60 },       // 60/dk — tenant/staff/service okuma

  // Auth
  authLogin:     { limit: 5, windowSec: 15 * 60 },  // 5/15dk — brute force koruması
  authRegister:  { limit: 3, windowSec: 60 * 60 },  // 3/saat — kayıt

  // Panel — oturum açmış tenant
  panel:         { limit: 120, windowSec: 60 },      // 120/dk — genel panel

  // Admin
  admin:         { limit: 200, windowSec: 60 },      // 200/dk — admin işlemleri

  // Webhook
  webhook:       { limit: 5, windowSec: 10 },        // 5/10sn — PayTR webhook (DDoS koruması)
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (req: NextRequest, ...rest: any[]) => Promise<NextResponse>

/**
 * withRateLimit — rate limit + error handler kombinasyonu için HOF
 *
 * Örnek:
 *   export const POST = withRateLimit(handler, "rl:booking", RATE_LIMITS.publicBooking)
 */
export function withRateLimit<T extends AnyHandler>(
  fn: T,
  keyPrefix: string,
  config: { limit: number; windowSec: number }
): T {
  return (async (req: NextRequest, ...rest: unknown[]): Promise<NextResponse> => {
    const ip = getClientIp(req)
    const key = `${keyPrefix}:${ip}`

    const result = await rateLimit(key, config.limit, config.windowSec)

    if (!result.success) {
      const response = err(
        `Çok fazla istek gönderildi. ${Math.ceil((result.resetAt - Date.now()) / 1000)} saniye sonra tekrar deneyin.`,
        429,
        "RATE_LIMIT_EXCEEDED"
      )
      addRateLimitHeaders(response, result)
      return response
    }

    const response = await fn(req, ...rest)
    addRateLimitHeaders(response, result)
    return response
  }) as T
}
