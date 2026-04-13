// Cloudflare Turnstile server-side doğrulama

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export async function verifyTurnstile(token: string, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.error("[Turnstile] TURNSTILE_SECRET_KEY tanımlı değil")
    return false
  }

  try {
    const body: Record<string, string> = { secret, response: token }
    if (ip) body.remoteip = ip

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return data.success === true
  } catch (err) {
    console.error("[Turnstile] Doğrulama hatası:", err)
    return false
  }
}
