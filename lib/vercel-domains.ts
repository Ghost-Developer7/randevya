/**
 * Vercel Domain API entegrasyonu.
 * Custom domain'leri Vercel projesine programatik olarak ekler/kaldırır/doğrular.
 *
 * Gerekli env değişkenleri:
 *   VERCEL_API_TOKEN    — Vercel hesap token'ı (Settings → Tokens)
 *   VERCEL_PROJECT_ID   — Proje ID'si (Project Settings → General → Project ID)
 *   VERCEL_TEAM_ID      — (opsiyonel) Team hesabı kullanıyorsan
 */

const VERCEL_API = "https://api.vercel.com"

function getHeaders() {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error("VERCEL_API_TOKEN env değişkeni tanımlı değil")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

function teamQuery(): string {
  const teamId = process.env.VERCEL_TEAM_ID
  return teamId ? `?teamId=${teamId}` : ""
}

function projectId(): string {
  const id = process.env.VERCEL_PROJECT_ID
  if (!id) throw new Error("VERCEL_PROJECT_ID env değişkeni tanımlı değil")
  return id
}

// ─── Domain ekle ─────────────────────────────────────────────────────────────
export async function addDomainToVercel(domain: string): Promise<{
  success: boolean
  error?: string
  verified?: boolean
}> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${projectId()}/domains${teamQuery()}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: domain }),
      }
    )

    const data = await res.json()

    if (res.ok) {
      return { success: true, verified: data.verified ?? false }
    }

    // Domain zaten ekliyse sorun yok
    if (data.error?.code === "domain_already_in_use") {
      return { success: true, verified: true }
    }

    return {
      success: false,
      error: data.error?.message || `Vercel API hata: ${res.status}`,
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Vercel API bağlantı hatası",
    }
  }
}

// ─── Domain kaldır ───────────────────────────────────────────────────────────
export async function removeDomainFromVercel(domain: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${projectId()}/domains/${domain}${teamQuery()}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    )

    if (res.ok || res.status === 404) {
      return { success: true }
    }

    const data = await res.json()
    return {
      success: false,
      error: data.error?.message || `Vercel API hata: ${res.status}`,
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Vercel API bağlantı hatası",
    }
  }
}

// ─── Domain doğrulama durumunu kontrol et ────────────────────────────────────
export async function verifyDomainOnVercel(domain: string): Promise<{
  success: boolean
  verified: boolean
  error?: string
}> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${projectId()}/domains/${domain}${teamQuery()}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    )

    if (!res.ok) {
      return { success: false, verified: false, error: `Domain bulunamadı (${res.status})` }
    }

    const data = await res.json()
    return { success: true, verified: data.verified ?? false }
  } catch (e) {
    return {
      success: false,
      verified: false,
      error: e instanceof Error ? e.message : "Vercel API bağlantı hatası",
    }
  }
}

// ─── Domain DNS konfigürasyon bilgisini getir ────────────────────────────────
export async function getDomainConfig(domain: string): Promise<{
  success: boolean
  configured: boolean
  error?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  misconfigured?: any
}> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v6/domains/${domain}/config${teamQuery()}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    )

    if (!res.ok) {
      return { success: false, configured: false, error: `Kontrol başarısız (${res.status})` }
    }

    const data = await res.json()
    return {
      success: true,
      configured: !data.misconfigured,
      misconfigured: data.misconfigured ? data : undefined,
    }
  } catch (e) {
    return {
      success: false,
      configured: false,
      error: e instanceof Error ? e.message : "Vercel API bağlantı hatası",
    }
  }
}
