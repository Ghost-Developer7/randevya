import { NextRequest } from "next/server"
import { ok, err, withErrorHandler } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

type RegisterRequest = {
  company_name: string
  sector: string
  owner_name: string
  owner_email: string
  password: string
  domain_slug: string    // işletme kendi slug'ını seçer
}

// POST /api/auth/register — yeni işletme kaydı
async function postHandler(req: NextRequest) {
  const body = await req.json().catch(() => null) as RegisterRequest | null
  if (!body) return err("Geçersiz JSON")

  const { company_name, sector, owner_name, owner_email, password, domain_slug } = body

  // Zorunlu alan kontrolü
  if (!company_name?.trim()) return err("company_name zorunlu")
  if (!sector?.trim()) return err("sector zorunlu")
  if (!owner_name?.trim()) return err("owner_name zorunlu")
  if (!owner_email?.trim()) return err("owner_email zorunlu")
  if (!password) return err("password zorunlu")
  if (!domain_slug?.trim()) return err("domain_slug zorunlu")

  // Email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner_email)) {
    return err("Geçersiz email adresi")
  }

  // Şifre uzunluğu
  if (password.length < 8) return err("Şifre en az 8 karakter olmalı")

  // Slug format: sadece küçük harf, rakam, tire
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

  return ok(
    {
      id: tenant.id,
      domain_slug: tenant.domain_slug,
      panel_url: `${process.env.NEXTAUTH_URL}/panel/giris`,
    },
    201
  )
}
export const POST = withErrorHandler(postHandler, "POST /api/auth/register")
