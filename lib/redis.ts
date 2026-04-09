import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const TENANT_CACHE_TTL = 60 * 5 // 5 dakika

export function tenantCacheKey(host: string) {
  return `tenant:${host}`
}
