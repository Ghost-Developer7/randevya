import { NextRequest } from "next/server"
import { ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { REQUIRED_CONSENTS_TENANT } from "@/prisma/legal-content"
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { sendWelcomeEmail } from "@/lib/email"

type RegisterRequest = {
  company_name: string
  sector: string
  owner_name: string
  owner_email: string
  password: string
  domain_slug: string
  // Zorunlu sözleşme onayları: ["KVKK","PRIVACY_POLICY","TERMS_OF_USE","DISTANCE_SALES"]
  consents: string[]
}

// POST /api/auth/register — yeni işletme kaydı
async function postHandler(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  const userAgent = req.headers.get("user-agent") ?? undefined

  const body = await req.json().catch(() => null) as RegisterRequest | null
  if (!body) return err("Geçersiz JSON")

  const { company_name, sector, owner_name, owner_email, password, domain_slug, consents } = body

  // Zorunlu alan kontrolü
  if (!company_name?.trim()) return err("company_name zorunlu")
  if (!sector?.trim()) return err("sector zorunlu")
  if (!owner_name?.trim()) return err("owner_name zorunlu")
  if (!owner_email?.trim()) return err("owner_email zorunlu")
  if (!password) return err("password zorunlu")
  if (!domain_slug?.trim()) return err("domain_slug zorunlu")

  // Sözleşme onayları kontrolü
  if (!Array.isArray(consents) || consents.length === 0) {
    return err("Devam etmek için tüm sözleşmeleri onaylamanız zorunludur", 400, "CONSENTS_REQUIRED")
  }
  const missingConsents = REQUIRED_CONSENTS_TENANT.filter((c) => !consents.includes(c))
  if (missingConsents.length > 0) {
    return err(
      `Şu sözleşmeler onaylanmadı: ${missingConsents.join(", ")}`,
      400,
      "CONSENTS_INCOMPLETE"
    )
  }

  // Email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner_email)) {
    return err("Geçersiz email adresi")
  }

  // Şifre uzunluğu
  if (password.length < 8) return err("Şifre en az 8 karakter olmalı")

  // Slug format
  const slugClean = domain_slug.toLowerCase().trim().replace(/\s+/g, "-")
  if (!/^[a-z0-9-]{3,50}$/.test(slugClean)) {
    return err("domain_slug sadece küçük harf, rakam ve tire içerebilir (3-50 karakter)")
  }

  // Benzersizlik kontrolü
  const [slugExists, emailExists] = await Promise.all([
    db.tenant.findUnique({ where: { domain_slug: slugClean } }),
    db.tenant.findFirst({ where: { owner_email: owner_email.toLowerCase() } }),
  ])

  if (slugExists) return err("Bu domain_slug zaten kullanımda", 409, "SLUG_TAKEN")
  if (emailExists) return err("Bu email adresi zaten kayıtlı", 409, "EMAIL_TAKEN")

  // Onaylanan sözleşmelerin aktif versiyonlarını al
  const activeDocs = await db.legalDocument.findMany({
    where: { type: { in: consents }, is_active: true },
    select: { id: true, type: true },
  })

  if (activeDocs.length !== consents.length) {
    return err("Bazı sözleşmeler bulunamadı, lütfen sayfayı yenileyip tekrar deneyin", 400)
  }

  // Varsayılan başlangıç planını al
  const starterPlan = await db.plan.findFirst({
    where: { name: "Başlangıç" },
    orderBy: { price_monthly: "asc" },
  })
  if (!starterPlan) return err("Plan bulunamadı", 500)

  const passwordHash = await bcrypt.hash(password, 10)

  const defaultTheme = {
    primary_color: "#2a5cff",
    secondary_color: "#ff4d2e",
    font: "Inter",
    border_radius: "12px",
    tagline: "",
  }

  const tenant = await db.tenant.create({
    data: {
      domain_slug: slugClean,
      company_name: company_name.trim(),
      sector: sector.trim(),
      owner_name: owner_name.trim(),
      owner_email: owner_email.toLowerCase().trim(),
      password_hash: passwordHash,
      plan_id: starterPlan.id,
      theme_config: JSON.stringify(defaultTheme),
      is_active: true,
    },
  })

  // Onay kayıtlarını oluştur
  await db.userConsent.createMany({
    data: activeDocs.map((doc) => ({
      document_id: doc.id,
      user_type: "TENANT",
      tenant_id: tenant.id,
      user_email: owner_email.toLowerCase().trim(),
      ip_address: ip,
      user_agent: userAgent ?? null,
    })),
  })

  // 14 günlük deneme aboneliği oluştur
  const trialStart = new Date()
  const trialEnd = new Date(trialStart)
  trialEnd.setDate(trialEnd.getDate() + 14)

  await db.tenantSubscription.create({
    data: {
      tenant_id: tenant.id,
      plan_id: starterPlan.id,
      billing_period: "MONTHLY",
      net_amount: 0,
      total_amount: 0,
      starts_at: trialStart,
      ends_at: trialEnd,
      status: "ACTIVE",
      paytr_ref: "TRIAL",
    },
  })

  // Hoşgeldin e-postası gönder
  sendWelcomeEmail({
    tenantId: tenant.id,
    tenantEmail: owner_email.toLowerCase().trim(),
    tenantName: owner_name.trim(),
    companyName: company_name.trim(),
  }).catch((e) => console.error("[Register] Welcome email hatası:", e))

  return ok(
    {
      id: tenant.id,
      domain_slug: tenant.domain_slug,
      panel_url: `${process.env.NEXTAUTH_URL}/panel/giris`,
    },
    201
  )
}
const handlerWithError = withErrorHandler(postHandler, "POST /api/auth/register")
export const POST = withRateLimit(handlerWithError, "rl:register", RATE_LIMITS.authRegister)
