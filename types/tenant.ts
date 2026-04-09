export type ThemeConfig = {
  primary_color: string     // hex, ör: "#2a5cff"
  secondary_color: string   // hex
  font: string              // ör: "Inter", "Syne"
  border_radius: string     // ör: "8px", "16px"
  cover_image_url?: string
  tagline?: string
}

export type Tenant = {
  id: string
  domain_slug: string
  custom_domain: string | null
  company_name: string
  sector: string
  theme_config: ThemeConfig
  logo_url: string | null
  owner_email: string
  owner_name: string
  plan_id: string
  is_active: boolean
  created_at: string
}

export type TenantPublic = Pick<
  Tenant,
  "id" | "domain_slug" | "company_name" | "sector" | "theme_config" | "logo_url"
>

export type Plan = {
  id: string
  name: string
  price_monthly: number
  max_staff: number
  max_services: number
  whatsapp_enabled: boolean
  custom_domain: boolean
  waitlist_enabled: boolean
  analytics: boolean
  priority_support: boolean
}
