import { NextRequest } from "next/server"
import { ok, err, requireSuperAdmin, withErrorHandler } from "@/lib/api-helpers"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// POST /api/admin/rate-limit — rate limit temizle
// Body: { email: string }
async function postHandler(req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  const email = body?.email?.trim().toLowerCase()

  if (!email) return err("E-posta adresi zorunlu")

  // Tüm rate limit key'lerini temizle
  const keys = [
    `rl:login:${email}`,
    `rl:register:${email}`,
    `rl:forgot-password:${email}`,
  ]

  let cleared = 0
  for (const key of keys) {
    const deleted = await redis.del(key)
    if (deleted) cleared++
  }

  return ok({ cleared, email, message: `${email} için ${cleared} rate limit kaydı temizlendi` })
}

// GET /api/admin/rate-limit?email=xxx — rate limit durumunu sorgula
async function getHandler(req: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase()
  if (!email) return err("email query parametresi zorunlu")

  const loginCount = await redis.zcard(`rl:login:${email}`)

  return ok({
    email,
    login_attempts: loginCount,
    limit: 5,
    blocked: loginCount >= 5,
  })
}

export const POST = withErrorHandler(postHandler, "POST /api/admin/rate-limit")
export const GET = withErrorHandler(getHandler, "GET /api/admin/rate-limit")
