# RANDEVYA — Proje Teknik Dökümantasyonu

> **Bu doküman ne içerir?** Randevya projesinin yazılımsal olarak A'dan Z'ye tüm teknik detaylarını, dosya yapısını, işleyişini, subdomain/multi-tenant mimarisini, ödeme akışını, randevu alma sürecini, bildirim sistemini, kullanılan tüm kütüphaneleri ve her bir modülün ne iş yaptığını anlatır.
>
> Tek başına bu dosya okunduğunda projenin tamamı teknik olarak anlaşılır.

---

## İÇİNDEKİLER

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Teknoloji Stack'i ve Kütüphaneler](#2-teknoloji-stacki-ve-kütüphaneler)
3. [Dizin / Dosya Yapısı](#3-dizin--dosya-yapısı)
4. [Subdomain & Multi-Tenant Mimarisi (proxy.ts)](#4-subdomain--multi-tenant-mimarisi)
5. [Veritabanı Modelleri (Prisma Schema)](#5-veritabanı-modelleri)
6. [Kimlik Doğrulama & Yetkilendirme](#6-kimlik-doğrulama--yetkilendirme)
7. [Randevu Alma Akışı (Müşteri Tarafı)](#7-randevu-alma-akışı)
8. [Slot Hesaplama Algoritması](#8-slot-hesaplama-algoritması)
9. [Paket / Abonelik Sistemi](#9-paket--abonelik-sistemi)
10. [PayTR Ödeme Entegrasyonu](#10-paytr-ödeme-entegrasyonu)
11. [Fatura Sistemi](#11-fatura-sistemi)
12. [Kupon Sistemi](#12-kupon-sistemi)
13. [Bildirim Sistemi (E-posta / WhatsApp / SMS)](#13-bildirim-sistemi)
14. [Bekleme Listesi (Waitlist)](#14-bekleme-listesi-waitlist)
15. [Webhook Sistemi (Tenant'a giden)](#15-webhook-sistemi)
16. [Rate Limiting](#16-rate-limiting)
17. [Hata Yönetimi ve Loglama](#17-hata-yönetimi-ve-loglama)
18. [Tenant Paneli (`/panel`)](#18-tenant-paneli-panel)
19. [Admin Paneli (`/admin`)](#19-admin-paneli-admin)
20. [Müşteri Paneli (`/musteri`)](#20-müşteri-paneli-musteri)
21. [Kurumsal / Public Site](#21-kurumsal--public-site)
22. [API Endpoint Haritası (Tam Liste)](#22-api-endpoint-haritası)
23. [Cron Jobları](#23-cron-jobları)
24. [Güvenlik Önlemleri](#24-güvenlik-önlemleri)
25. [Cloudinary / Dosya Yükleme](#25-cloudinary--dosya-yükleme)
26. [Vercel Domain API Entegrasyonu](#26-vercel-domain-api-entegrasyonu)
27. [Cloudflare Turnstile (CAPTCHA)](#27-cloudflare-turnstile-captcha)
28. [Upstash Redis Kullanımı](#28-upstash-redis-kullanımı)
29. [Scripts (Bakım & Yönetim)](#29-scripts-bakım--yönetim)
30. [Environment Variables (Env Değişkenleri)](#30-environment-variables)
31. [Deployment (Vercel)](#31-deployment-vercel)

---

## 1. PROJE GENEL BAKIŞ

**Randevya**, Türkiye pazarına yönelik bir **SaaS (Software-as-a-Service) randevu ve rezervasyon yönetim sistemi**dir. Hedef kitlesi: güzellik salonları, klinikler, berberler, spa, diyetisyen, psikolog, veteriner, masaj salonu vb. hizmet işletmeleri.

**Temel İş Mantığı:**
- İşletme sahibi platforma kayıt olur → kendi subdomain'ini alır (`isletme-adi.randevya.com`) → isterse özel domain bağlar
- Personelini, hizmetlerini, çalışma saatlerini girer
- Müşteriler bu subdomain/domain üzerinden randevu alır
- Tüm bildirimler (e-posta / WhatsApp / SMS) otomatik gönderilir
- İşletme sahibi aylık / yıllık abonelik öder (PayTR üzerinden)
- Platform admini tüm sistemi yönetir (tenantlar, paketler, kuponlar, destek, loglar)

**Mimari:** Multi-tenant SaaS (tek veritabanı, `tenant_id` ile izolasyon), Next.js 16 App Router, MSSQL + Prisma ORM, Vercel deployment.

---

## 2. TEKNOLOJİ STACK'İ VE KÜTÜPHANELER

### Ana Framework ve Çalışma Ortamı

| Paket | Sürüm | Ne için kullanılıyor? |
|---|---|---|
| `next` | 16.2.3 | App Router ile SSR/SSG framework |
| `react` / `react-dom` | 19.2.4 | UI kütüphanesi |
| `typescript` | ^5 | Tip güvenliği |

> **NOT:** Bu Next.js sürümü **bilinen Next.js'ten farklıdır** — `CLAUDE.md` / `AGENTS.md` dosyaları kod yazarken `node_modules/next/dist/docs/` altındaki güncel docs'a bakılmasını söylüyor. Middleware dosyası `middleware.ts` yerine **`proxy.ts`** olarak adlandırılmış (bu yeni sürümün gerektirdiği isim).

### Veritabanı & ORM

| Paket | Ne için |
|---|---|
| `prisma` / `@prisma/client` | 7.7.0 — ORM |
| `@prisma/adapter-mssql` | MSSQL (SQL Server) bağlantı adaptörü |

### Kimlik Doğrulama

| Paket | Ne için |
|---|---|
| `next-auth` | 4.24.13 — JWT tabanlı session yönetimi (Credentials provider) |
| `@auth/prisma-adapter` | NextAuth + Prisma entegrasyonu |
| `bcryptjs` | Şifre hash'leme (bcrypt 10 round) |

### Ödeme

| Paket | Ne için |
|---|---|
| — (manuel entegrasyon) | PayTR — `lib/paytr.ts` içinde sıfırdan yazılmış |

### Bildirim Servisleri

| Paket | Ne için |
|---|---|
| `nodemailer` | 8.0.5 — SMTP e-posta (güvenlik sürümü) |
| `@types/nodemailer` | Tipler |

> WhatsApp Meta Cloud API ve SMS (İleti Merkezi) doğrudan `fetch` ile çağrılıyor, ek paket yok.

### Medya / Dosya

| Paket | Ne için |
|---|---|
| `cloudinary` | 2.9.0 — Logo, personel fotoğrafı, fatura PDF'i yükleme |

### Cache / Rate Limit

| Paket | Ne için |
|---|---|
| `@upstash/redis` | 1.37.0 — Rate limit, tenant cache, waitlist TTL |

### UI / Grafik

| Paket | Ne için |
|---|---|
| `tailwindcss` | ^4 — Stil (PostCSS 4 ile entegre) |
| `@tailwindcss/postcss` | Build zamanı CSS |
| `recharts` | 3.8.1 — Analytics grafikleri |

### Dev / Build

| Paket | Ne için |
|---|---|
| `tsx` | 4.21.0 — TS script çalıştırma (seed, admin hash, reconcile vb.) |
| `ts-node` | 10.9.2 — TS script çalıştırma |
| `eslint` + `eslint-config-next` | Lint |

### package.json Scriptleri

```json
"dev": "next dev -p 3003"
"build": "prisma generate && next build"
"start": "next start"
"lint": "eslint"
"db:push": "prisma db push"
"db:generate": "prisma generate"
"db:seed": "tsx prisma/seed.ts"
"db:studio": "prisma studio"
"admin:hash": "tsx scripts/generate-admin-hash.ts"
```

---

## 3. DİZİN / DOSYA YAPISI

```
randevya/
├── app/                              # Next.js 16 App Router
│   ├── (public)/                     # Route group: Public sayfalar
│   │   ├── layout.tsx
│   │   ├── iletisim/page.tsx         # İletişim formu
│   │   ├── randevu/page.tsx          # Müşteri randevu alma (tenant subdomain'de)
│   │   └── sozlesmeler/[type]/page.tsx  # KVKK, Gizlilik vb.
│   │
│   ├── (panel)/                      # Route group: Tenant paneli (işletme sahibi)
│   │   ├── layout.tsx
│   │   └── panel/
│   │       ├── page.tsx              # Dashboard
│   │       ├── giris/                # Tenant login
│   │       ├── kayit/                # Tenant kayıt
│   │       ├── sifremi-unuttum/
│   │       ├── sifre-sifirla/
│   │       ├── randevular/           # Randevu yönetimi
│   │       ├── personel/             # Personel CRUD
│   │       ├── hizmetler/            # Hizmet CRUD
│   │       ├── abonelik/             # Abonelik / PayTR iframe
│   │       ├── ayarlar/              # Profil, domain, tema, webhook
│   │       ├── bildirimler/          # NotificationLog görüntüleme
│   │       ├── odeme-basarili/       # PayTR success redirect
│   │       └── odeme-basarisiz/      # PayTR fail redirect
│   │
│   ├── (musteri)/                    # Route group: Müşteri portalı
│   │   ├── layout.tsx
│   │   ├── giris/page.tsx
│   │   ├── kayit/page.tsx
│   │   └── randevularim/
│   │       ├── layout.tsx
│   │       ├── page.tsx              # Randevu geçmişi
│   │       └── profil/page.tsx
│   │
│   ├── (admin)/                      # Route group: Platform admin paneli
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx              # Admin dashboard
│   │       ├── tenants/              # Tüm tenantları yönetme
│   │       ├── plans/                # Paket CRUD
│   │       ├── kuponlar/             # Kupon CRUD
│   │       ├── odemeler/             # Ödeme/fatura görüntüleme
│   │       ├── email-ayarlari/       # SMTP config
│   │       └── rate-limit/           # Rate limit monitoring
│   │
│   ├── api/                          # Tüm API route'ları (detay için § 22)
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Ana sayfa (platform veya tenant home)
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── sitemap.ts
│   ├── globals.css
│   └── generated/prisma/             # Prisma generated client (output path)
│
├── components/
│   ├── panel/                        # Panel UI (Header, Sidebar, Shell, SessionProvider)
│   ├── public/                       # Public site UI (Navbar, Footer, TenantHome, BookingStepper)
│   └── ui/                           # Reusable (Button, Input, Card, Modal, Badge, Logo, Spinner, Turnstile)
│
├── lib/                              # Tüm iş mantığı kütüphaneleri
│   ├── db.ts                         # Prisma client singleton
│   ├── redis.ts                      # Upstash Redis client
│   ├── logger.ts                     # ErrorLog tablosuna log yazar
│   ├── auth.ts                       # NextAuth config, rol sabitleri
│   ├── api-helpers.ts                # ok/err response, auth guard'ları, withErrorHandler HOF
│   ├── rate-limit.ts                 # Redis sorted-set tabanlı sliding window
│   ├── tenant.ts                     # Tenant lookup (slug/custom/uuid), plan limit kontrolü
│   ├── slots.ts                      # Müsait saat hesaplama algoritması
│   ├── paytr.ts                      # PayTR token, webhook verify, pricing, refund
│   ├── email.ts                      # 479 satır: Nodemailer transporter + tüm e-posta şablonları
│   ├── notifications.ts              # Bildirim orkestratörü (email+whatsapp+sms paralel)
│   ├── whatsapp.ts                   # Meta Cloud API v19.0 template gönderimi
│   ├── sms.ts                        # İleti Merkezi SMS gönderimi
│   ├── webhook.ts                    # Tenant webhook teslimatı + HMAC imzalama
│   ├── cloudinary.ts                 # Görsel/PDF yükleme
│   ├── vercel-domains.ts             # Vercel Domain API (add/remove/verify)
│   ├── turnstile.ts                  # Cloudflare Turnstile doğrulama
│   ├── waitlist.ts                   # Bekleme listesi mantığı
│   └── turkey-locations.ts           # 81 il + ilçeler (adres formu)
│
├── prisma/
│   ├── schema.prisma                 # 28 model — tüm veritabanı şeması
│   ├── seed.ts                       # Default plan, admin, legal doc seed'i
│   └── legal-content.ts              # Yasal metin sabitleri
│
├── scripts/
│   ├── generate-admin-hash.ts        # bcrypt hash üretici (admin şifresi için)
│   ├── check-payment-state.ts        # PayTR sorgulayıp DB ile karşılaştır
│   ├── reconcile-payment.ts          # Kayıp webhook recovery
│   ├── expire-trial.ts               # Deneme süresi bitirme
│   └── reset-tenant-billing.ts       # Tenant fatura/abonelik reset (manuel)
│
├── public/                           # Statik varlıklar
├── postman/                          # Postman collection (API test)
├── PayTR Odeme Entegrasyonu/         # PayTR referans belgeleri
│
├── proxy.ts                          # Middleware (subdomain → tenant_id çözümü)
├── next.config.ts                    # Güvenlik başlıkları, Cloudinary remote patterns
├── prisma.config.ts                  # Prisma config
├── vercel.json                       # Cron job tanımları
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── package.json
├── AGENTS.md / CLAUDE.md             # Next 16 uyarı notu
├── FRONTEND.md
├── README.md
└── randevya-proje-dokumani.html      # HTML proje dokümanı (kurumsal)
```

---

## 4. SUBDOMAIN & MULTI-TENANT MİMARİSİ

### Nasıl Çalışıyor?

Platform tek bir Next.js uygulaması olarak deploy edilir; tüm işletmeler aynı kod üzerinden hizmet alır. İşletmeyi ayırt eden şey **hostname**'dir.

### `proxy.ts` (middleware) — Host → Tenant Çözümü

```
Host: randevya.com veya www.randevya.com veya localhost
  → Platform domain (kurumsal site, /admin mümkün)

Host: isletme1.randevya.com
  → x-tenant-id = "slug:isletme1"  header'ı setle

Host: kuaforajda.com (özel domain, DNS Vercel'a yönlendirilmiş)
  → x-tenant-id = "custom:kuaforajda.com"
```

### Yönlendirme Kuralları (`proxy.ts`)

| İstek | Sonuç |
|---|---|
| Platform domain + `/randevu` | `/` 'a redirect (tenant dışı rotada randevu sayfası açılamaz) |
| Tenant domain + `/panel` | `/` 'a redirect (panel tenant subdomain'inde açılamaz) |
| Tenant domain + `/admin` | `/` 'a redirect (admin sadece platform domain'de) |
| Diğer tüm istekler | `x-tenant-id` header'ı ile geçer |

**Önemli:** Tenant subdomain'inde sadece müşteri tarafı (ana sayfa, `/randevu`, `/sozlesmeler`) çalışır. `/panel` ve `/admin` yalnızca ana domain'de erişilebilir.

### `lib/tenant.ts` — Çözümleme

```typescript
resolveTenantByRawId(raw: string): Tenant
// "slug:isletme1"   → DB'de domain_slug='isletme1' ara
// "custom:alan.com" → DB'de custom_domain='alan.com' ara
// UUID               → DB'de id ara
```

- Redis cache'te 5 dakika tutar (key: `tenant:resolved:{raw}`)
- `checkPlanLimit(tenant_id, 'max_staff')` — plan limiti kontrolü
- `checkPlanFeature(tenant_id, 'whatsapp_enabled')` — plan özelliği kontrolü

### Middleware Matcher

```typescript
matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)"]
```
Statik dosyalar middleware'dan geçmez (performans).

---

## 5. VERİTABANI MODELLERİ

**DB:** Microsoft SQL Server, Prisma ORM, 28 model. Tüm modeller `prisma/schema.prisma`'da.

### İş Mantığı Tabloları

#### `Plan` (Plans)
Abonelik paketleri. Admin tarafından yönetilir.
```
id, name, price_monthly, max_staff, max_services
whatsapp_enabled, custom_domain, waitlist_enabled,
analytics, priority_support, created_at
```

#### `Tenant` (Tenants)
Platform üzerindeki her bir işletme.
```
id, domain_slug (unique), custom_domain?, company_name, sector
theme_config (JSON string), logo_url?, owner_email, owner_name
password_hash, plan_id, is_active, created_at, updated_at
```

#### `Staff`
Tenant'ın personeli.
```
id, tenant_id, full_name, title?, photo_url?
work_hours (JSON: {"mon":[{"start":"09:00","end":"18:00"}], ...})
is_active, created_at
```

#### `Service`
Tenant'ın verdiği hizmetler.
```
id, tenant_id, name, description?, duration_min, is_active
```

#### `StaffService` (StaffServices)
Hangi personel hangi hizmeti verir (M:N).
```
id, tenant_id, staff_id, service_id
@@unique([staff_id, service_id])
```

#### `Appointment` (Appointments)
Müşteri randevusu.
```
id, tenant_id, staff_id, service_id
customer_name, customer_phone, customer_email
start_time, end_time
status: PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
notes?, created_at, updated_at
```

#### `WaitlistEntry` (Waitlist)
Dolu slot için bekleyen müşteri.
```
id, tenant_id, appointment_id
customer_name/phone/email, queue_order
notified_at?, expires_at?
status: WAITING | NOTIFIED | CONFIRMED | EXPIRED | CANCELLED
```

### Ödeme / Fatura Tabloları

#### `BillingAddress` (BillingAddresses)
Tenant'ın fatura adresleri.
```
id, tenant_id, type: BIREYSEL | KURUMSAL, label?
// Bireysel:
full_name?, tc_kimlik? (11 hane)
// Kurumsal:
company_name?, tax_office?, tax_number?
// Ortak:
address, city (il), district (ilçe), phone, is_default
```

#### `PendingPayment` (PendingPayments)
PayTR webhook gelmeden önce metadata'yı tutar (merchant_oid PayTR'da max 64 karakter olduğu için metadata burada saklanır).
```
id, tenant_id, plan_id, billing_period (MONTHLY/YEARLY)
billing_address_id, merchant_oid (unique, 64 char)
net_amount, total_amount, coupon_id?
status: PENDING | COMPLETED | FAILED
```

#### `TenantSubscription` (TenantSubscriptions)
Onaylanmış abonelik.
```
id, tenant_id, plan_id, paytr_ref?
billing_period: MONTHLY | YEARLY
net_amount?, total_amount?, billing_address_id?, coupon_id?
starts_at, ends_at
status: ACTIVE | EXPIRED | CANCELLED | PENDING | REFUNDED
```

#### `Invoice` (Invoices)
Her abonelik için fatura kaydı.
```
id, subscription_id, billing_address_id
invoice_number (unique, format: INV-2026-0001)
net_amount, kdv_rate (default 20), kdv_amount, total_amount
status: FATURA_BEKLIYOR | FATURA_YUKLENDI
pdf_url?, pdf_public_id? (Cloudinary), emailed_at?
```

#### `Coupon` (Coupons)
İndirim kuponları.
```
id, code (unique, büyük harf: HOSGELDIN50)
discount_percent (1-100), plan_id? (null = tüm planlarda)
valid_from, valid_until, max_uses, used_count, is_active
```

#### `CouponUsage` (CouponUsages)
Kupon kullanım logu.
```
id, coupon_id, tenant_id, subscription_id?
discount_amount, original_amount, final_amount, used_at
```

### Yönetim / Destek Tabloları

#### `AdminUser` (AdminUsers)
Platform yöneticileri.
```
id, email (unique), password_hash, full_name
role: SUPER_ADMIN | SUPPORT | BILLING | VIEWER
is_active, last_login_at?, created_at, updated_at
```

#### `SupportTicket` (SupportTickets)
Tenant destek talebi.
```
id, tenant_id, subject
status: OPEN | IN_PROGRESS | RESOLVED | CLOSED
priority: LOW | NORMAL | HIGH | URGENT
```

#### `SupportMessage` (SupportMessages)
Destek talebi içindeki mesajlar.
```
id, ticket_id, sender: TENANT | ADMIN, admin_id?, content
```

#### `ClosedDay` (ClosedDays)
Tatiller / özel kapalı günler.
```
id, tenant_id, staff_id? (null = tüm işletme), date, reason?
```

### Altyapı / Entegrasyon Tabloları

#### `EmailConfig` (singleton)
SMTP ayarları (admin panelden değiştirilebilir).
```
id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass
from_email, from_name, is_active, updated_at
```

#### `NotificationLog` (NotificationLogs)
Gönderilen her bildirim loglanır.
```
id, tenant_id, channel: EMAIL | WHATSAPP, recipient
event_type, status: SENT | FAILED | PENDING, error_msg?, sent_at
```

#### `ErrorLog` (ErrorLogs)
Sistem hataları.
```
id, tenant_id?, user_email?, user_role?, endpoint, method
status_code, error_msg, stack_trace?, ip_address?, created_at
```

#### `WebhookEndpoint` (WebhookEndpoints)
Tenant'ın dış sistemlerine gönderdiği webhook hedefleri.
```
id, tenant_id, url, secret (HMAC key)
events (JSON array: ["appointment.created","*"])
is_active
```

#### `WebhookLog` (WebhookLogs)
Webhook teslimat denemeleri.
```
id, endpoint_id, event, payload (JSON)
status_code?, success, error_msg?, created_at
```

#### `LegalDocument` (LegalDocuments)
Yasal sözleşme metinleri (versiyonlu).
```
id, type: PRIVACY_POLICY | TERMS_OF_USE | COOKIE_POLICY | KVKK | DISTANCE_SALES | CANCELLATION_POLICY
title, content (HTML), version (örn "1.0"), is_active
```

#### `UserConsent` (UserConsents)
Sözleşme onay kayıtları (KVKK için hukuki delil).
```
id, document_id, user_type: TENANT | STAFF
tenant_id?, staff_id?, user_email
ip_address, user_agent?, accepted_at
```

#### `PasswordResetToken` (PasswordResetTokens)
Şifremi unuttum tokenları.
```
id, email, token (unique), expires_at, used, created_at
```

---

## 6. KİMLİK DOĞRULAMA & YETKİLENDİRME

**Teknoloji:** NextAuth.js 4 (JWT strategy) + bcrypt.

### 3 Kullanıcı Tipi

#### A) **Tenant Owner** (işletme sahibi)
- Tablolar: `Tenant.owner_email` + `Tenant.password_hash`
- Giriş: `/panel/giris`
- JWT: `{ tenant_id: "uuid", role: "TENANT_OWNER" }`
- Erişim: `/panel/*`

#### B) **Platform Admin**
- Tablolar: `AdminUser` tablosu VEYA env `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` fallback
- Giriş: `/admin/giris` (ayrı endpoint)
- JWT: `{ tenant_id: "", role: "PLATFORM_ADMIN", admin_role: "SUPER_ADMIN|..." }`
- **Tenant Preview:** Admin bir tenantın paneline `admin_preview_tenant` cookie'si ile bakabilir (destek için)
- Erişim: `/admin/*` + tüm `/panel/*` (preview modunda)

#### C) **Müşteri** (end-user)
- Şu an randevu public olarak alınıyor (kayıt zorunlu değil)
- Müşteri portalı `/musteri/giris`, `/musteri/kayit`, `/musteri/randevularim` hazır
- Müşterinin kendi randevu geçmişini görmesi için

### `lib/auth.ts` İçeriği
- NextAuth Credentials provider
- Rol sabitleri: `ROLE_TENANT_OWNER`, `ROLE_PLATFORM_ADMIN`, `ROLE_CUSTOMER`
- Admin rol sabitleri: `ADMIN_ROLE_SUPER`, `_SUPPORT`, `_BILLING`, `_VIEWER`
- `authOptions`: Prisma adapter + JWT callbacks (tenant_id / role injection)

### `lib/api-helpers.ts` — Auth Guard'ları

```typescript
requireTenantSession()     // TENANT_OWNER veya admin preview
requireAdminSession()      // Herhangi bir admin
requireAdminRole(...roles) // Belirli admin rolü
requireSuperAdmin()        // Sadece SUPER_ADMIN
requireSupportAccess()     // SUPER_ADMIN | SUPPORT
requireBillingAccess()     // SUPER_ADMIN | BILLING
```

Her API route başında bu fonksiyonlar çağrılır; yoksa `403 Forbidden` döner.

### Şifremi Unuttum Akışı
1. `POST /api/auth/forgot-password` → `PasswordResetToken` oluşturulur (1 saat geçerli)
2. E-posta ile reset linki gönderilir
3. `POST /api/auth/reset-password` → token doğrula, şifre güncelle, token'ı `used=true` yap

---

## 7. RANDEVU ALMA AKIŞI

Müşteri `isletme.randevya.com/randevu` sayfasına girer. Akış `components/public/BookingStepper.tsx` tarafından yönetilir.

### Adım Adım

**Adım 1 — Hizmet seçimi**
- `GET /api/services` (tenant_id header'dan) → aktif hizmetler gelir
- Müşteri bir hizmet seçer

**Adım 2 — Personel seçimi (opsiyonel)**
- `GET /api/staff?service_id=...` → bu hizmeti veren personel gelir
- "Fark etmez" seçeneği: `staff_id` otomatik atanır

**Adım 3 — Tarih & Saat seçimi**
- `GET /api/slots?service_id=...&staff_id=...&date=YYYY-MM-DD`
- Rate limit: 30/dakika/IP
- Slot hesaplama için § 8'e bakınız

**Adım 4 — Müşteri bilgileri**
- İsim, telefon, e-posta

**Adım 5 — Sözleşme onayı + CAPTCHA**
- KVKK ve gizlilik onayı
- Cloudflare Turnstile token alınır
- Form submit edilir

**Adım 6 — Randevu oluşturma**
- `POST /api/appointments` endpoint'i çağrılır
- Rate limit: 10/dakika/IP
- Turnstile doğrulaması yapılır (`verifyTurnstile`)
- Slot hâlâ müsait mi kontrol edilir (race condition korumalı)
- `Appointment` oluşturulur (`status: CONFIRMED`)
- Paralel olarak:
  - Müşteriye e-posta (onay)
  - İşletmeye e-posta (yeni randevu bildirimi)
  - Müşteriye WhatsApp (plan destekliyorsa)
  - Müşteriye SMS (plan destekliyorsa)
  - Tenant webhook'ı (varsa)
  - NotificationLog kayıtları

**Adım 7 — Başarı ekranı**
- Randevu detayları, iptal/ekleme talimatları

### Appointment Durumları (status)

| Durum | Anlam |
|---|---|
| `PENDING` | İşletme onayı bekliyor (opsiyonel) |
| `CONFIRMED` | Onaylandı, müşteriye bildirildi |
| `CANCELLED` | İptal edildi (manuel veya sistem) |
| `COMPLETED` | Hizmet tamamlandı |
| `NO_SHOW` | Müşteri gelmedi |

---

## 8. SLOT HESAPLAMA ALGORİTMASI

**Dosya:** `lib/slots.ts`

### Girdi
- `tenant_id`, `service_id`, `staff_id?` (opsiyonel), `date` (ISO)

### Algoritma
1. Servisi veritabanından çek → `duration_min`
2. Personel(ler)i çek → `work_hours` (JSON) parse et
3. O günün haftanın hangi günü olduğunu bul (`mon|tue|...|sun`)
4. O gün için çalışma aralıklarını al: `[{start:"09:00", end:"12:00"}, {start:"13:00", end:"18:00"}]`
5. `ClosedDay` tablosunda o tarih için kapalı gün var mı? → Varsa personel/işletme boş
6. O gün için mevcut randevuları çek (status: `PENDING|CONFIRMED`)
7. Çalışma aralıklarından mevcut randevuları çıkar → **boş aralıklar**
8. Boş aralıkları `duration_min` parçalara böl → **slot'lar**
9. Geçmiş saatleri filtrele (bugün için)
10. Sırala ve dön

### Zaman Formatı
- DB'de `DateTime` (UTC)
- İşlemlerde minute cinsinden integer (09:30 → 570)
- Sunucuda Europe/Istanbul olarak yorumlanır

### `isSlotAvailable(start, end, staff_id)`
- Randevu oluşturulurken race condition'a karşı son kontrol
- Transaction içinde çağrılır

---

## 9. PAKET / ABONELİK SİSTEMİ

### Planlar (`Plan` tablosu)

Admin tarafından oluşturulur. Örnek yapı:

| Alan | Açıklama |
|---|---|
| `price_monthly` | Aylık net fiyat (TL) |
| `max_staff` | Maksimum personel sayısı |
| `max_services` | Maksimum hizmet sayısı |
| `whatsapp_enabled` | WhatsApp bildirim erişimi |
| `custom_domain` | Özel domain bağlama hakkı |
| `waitlist_enabled` | Bekleme listesi özelliği |
| `analytics` | Analytics ekranı |
| `priority_support` | Öncelikli destek |

### Kayıt Akışı (Yeni Tenant)
1. `/panel/kayit` → `POST /api/auth/register`
2. Ücretsiz / deneme planına atanır
3. `Tenant` kaydı oluşur
4. Hoş geldin e-postası gönderilir

### Plan Yükseltme
- Tenant `/panel/abonelik` sayfasından plan + aylık/yıllık seçer
- `BillingAddress` seçer (veya ekler)
- (Opsiyonel) kupon girer → `POST /api/panel/coupons/validate`
- `POST /api/panel/subscription` → PendingPayment + PayTR token
- PayTR iframe formu render edilir
- Ödeme tamamlanınca webhook tetiklenir (§ 10)

### Fiyatlandırma (lib/paytr.ts `calculatePricing`)
- **Aylık:** `price_monthly × 1.20` (KDV %20) = total_amount
- **Yıllık:** `price_monthly × 9 × 1.20` (9 ay ödenir, 12 ay kullanılır = 3 ay bedava)
- Kupon varsa: `total × (1 - discount_percent/100)`

### Plan Limit Kontrolleri (`lib/tenant.ts`)
- Personel eklenirken: mevcut personel sayısı >= `max_staff` ise red
- Hizmet eklenirken: aynı
- WhatsApp mesajı gönderilirken: `whatsapp_enabled=false` ise gönderilmez
- Özel domain eklenirken: `custom_domain=false` ise red
- Bekleme listesi: `waitlist_enabled=false` ise kullanıcı göremez

---

## 10. PAYTR ÖDEME ENTEGRASYONU

**Dosya:** `lib/paytr.ts` (sıfırdan yazılmış)

### Env Değişkenleri
```
PAYTR_MERCHANT_ID=...
PAYTR_MERCHANT_KEY=...
PAYTR_MERCHANT_SALT=...
PAYTR_TEST_MODE=0  (1 = test)
```

### Akış: Token Üretimi (`createPayTRToken`)

1. Tenant `/api/panel/subscription` POST yapar
2. Fiyat hesaplanır (`calculatePricing`)
3. **merchant_oid** üretilir (64 karakter max): `randevya{timestamp}{rand}`
4. `PendingPayment` kaydı atılır (metadata DB'de çünkü PayTR 64 karakter limitli)
5. PayTR'ye gönderilen payload:
   ```
   merchant_id, user_ip, merchant_oid, email
   payment_amount (kuruş), user_basket (base64), debug_on,
   no_installment, max_installment, user_name, user_address
   user_phone, merchant_ok_url, merchant_fail_url
   timeout_limit, currency, test_mode, paytr_token
   ```
6. `paytr_token` = HMAC-SHA256(`merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode`, `merchant_key + merchant_salt`) → base64
7. PayTR API'ye POST → token cevap gelir
8. Tenant frontend: `https://www.paytr.com/odeme/guvenli/{token}` iframe URL'i
9. Kullanıcı iframe içinde kartını girer

### Akış: Webhook (`POST /api/webhooks/paytr`)

**Rate limit:** 5 istek / 10 saniye (DDoS koruma)

1. PayTR form-encoded POST yapar:
   ```
   merchant_oid, status (success/failed), total_amount, hash, ...
   ```
2. **Hash doğrulanır:** `HMAC-SHA256(merchant_oid + merchant_salt + status + total_amount, merchant_key) === hash`
3. `PendingPayment` kaydı bulunur
4. Eğer `status=success`:
   - `handleSuccessfulPayment()`:
     - Eski ACTIVE subscription → EXPIRED
     - Yeni `TenantSubscription` oluştur (ACTIVE, ends_at = now + (monthly=30gün | yearly=365gün))
     - `Tenant.plan_id` güncelle
     - `Invoice` oluştur (FATURA_BEKLIYOR)
     - Kupon varsa `CouponUsage` oluştur, `Coupon.used_count++`
     - Tenant'a e-posta: "Ödemeniz alındı"
     - Admin'lere e-posta: "Yeni satın alma"
5. `PendingPayment.status` → COMPLETED / FAILED
6. PayTR'ye `"OK"` dön (zorunlu, yoksa PayTR tekrar dener)

### PayTR Webhook Hostname Quirk (önemli)
> **Memory:** PayTR, Bildirim URL'ı (webhook) hostname'i SİTE ADRESİ hostname'iyle eşleşmezse webhook'u sessizce düşürür (www vs non-www farkı). Webhook'lar gelmiyorsa önce bunu kontrol et.

### Refund (`refundPayment`)
- Admin `/admin/odemeler` ekranından tetikler
- PayTR refund API'sine çağrı
- `TenantSubscription.status` → `REFUNDED`

### İptal Durumunda Subscription
- Tenant iptal isteği → status: `CANCELLED`, ama `ends_at`'a kadar kullanım devam eder
- `ends_at` geçince cron job ile downgrade (bkz § 23)

### Geçerlilik Kontrolü (`isSubscriptionActive`)
```typescript
// ACTIVE durumdaki + ends_at > now olan kayıt varsa true
```

### Süresi Biten Abonelikler (`notifyExpiringSubscriptions`)
- Cron job günlük çalışır
- 3 gün içinde bitenlere e-posta atar

---

## 11. FATURA SİSTEMİ

### Ne Zaman Oluşur?
- PayTR webhook'u başarılı olduğunda `Invoice` kaydı otomatik oluşur
- `status = FATURA_BEKLIYOR`
- PDF henüz yok (manuel muhasebe ile oluşturulup admin tarafından yüklenir)

### Numara Formatı
- `INV-2026-0001`, `INV-2026-0002`, ...
- Yıl + 4 haneli sıralı numara (unique)

### KDV Hesaplama
- `kdv_rate = 20` (sabit %20)
- `net_amount` (KDV hariç)
- `kdv_amount = net × 0.20`
- `total_amount = net + kdv_amount`

### PDF Yükleme (Admin)
- `/admin/odemeler` → fatura seç → PDF yükle
- Cloudinary'ye yüklenir (`pdf_url`, `pdf_public_id`)
- `status = FATURA_YUKLENDI`
- Tenant'a e-posta gönderilir (faturanız hazır + link)
- `emailed_at` set edilir

### BillingAddress ile İlişki
- Her fatura bir `billing_address_id`'ye bağlı
- Fatura oluştuğunda o anki adres snapshot'ı invoice'a kopyalanmaz; doğrudan ref tutulur

---

## 12. KUPON SİSTEMİ

### Admin Kupon Oluşturur (`/admin/kuponlar`)
```
code: "HOSGELDIN50" (büyük harf, unique)
discount_percent: 50
plan_id: (null = tüm planlarda geçerli)
valid_from, valid_until, max_uses, is_active
```

### Tenant Kupon Girişi
- `POST /api/panel/coupons/validate` → `{ code, plan_id, billing_period }`
- Backend kontrolleri:
  - `is_active = true`
  - `valid_from <= now <= valid_until`
  - `used_count < max_uses`
  - `plan_id` match (veya null)
  - **Aynı tenant daha önce kullanmadıysa** (CouponUsage'de kayıt yok)
- Başarı: `{ discount_percent, final_amount }`

### Kupon Uygulaması
- PayTR'ye gönderilen `payment_amount` indirimli fiyat olur
- `PendingPayment.coupon_id` set edilir
- Webhook'ta ödeme başarılı olunca:
  - `TenantSubscription.coupon_id` set edilir
  - `CouponUsage` kaydı oluşur
  - `Coupon.used_count++`

---

## 13. BİLDİRİM SİSTEMİ

**Ana dosya:** `lib/notifications.ts` (orkestratör)

### 3 Kanal Paralel Çalışır

| Kanal | Dosya | Paket |
|---|---|---|
| E-posta | `lib/email.ts` (479 satır) | `nodemailer` |
| WhatsApp | `lib/whatsapp.ts` | Meta Cloud API v19.0 (fetch) |
| SMS | `lib/sms.ts` | İleti Merkezi REST API |

### Orkestratör Fonksiyonlar

```typescript
notifyAppointmentCreated(appointmentId)
  → sendAppointmentConfirm        (e-posta, müşteriye)
  → sendBusinessNewAppointment    (e-posta, işletmeye)
  → sendWaAppointmentConfirm      (WhatsApp, plan destekliyorsa)
  → sendAppointmentConfirmSms     (SMS, İleti Merkezi varsa)

notifyAppointmentCancelled(appointmentId)
  → sendAppointmentCancel
  → sendWaAppointmentCancel
  → sendAppointmentCancelSms

notifyUpcomingAppointments()       // Cron — 24 saat önceden
  → 23-25 saat penceresinde CONFIRMED randevuları bulur
  → 3 kanaldan hatırlatma gönderir

notifyWaitlistSlotOpened(entryId)
  → Dolu slot boşaldığında sıradaki waitlist'e bildirir
```

### E-posta (`lib/email.ts`)

**Transporter yapılandırması:**
- Öncelik: `EmailConfig` tablosu → yoksa env fallback
- 5 dakika cache (DB değişikliği algılanırsa transporter yeniden oluşur)

**Şablonlar (HTML, Türkçe):**
- Hoş geldin (yeni tenant)
- Randevu onayı (müşteri)
- Randevu iptali
- Randevu hatırlatma (24 saat önceden)
- Bekleme listesi slot açıldı bildirimi (30 dakika süre)
- İşletme için: yeni randevu bildirimi
- Ödeme onay (tenant)
- Admin'e yeni satın alma bildirimi
- Abonelik bitiş uyarısı (3 gün önceden)
- Şifre sıfırlama linki
- Fatura yüklendi bildirimi

### WhatsApp (`lib/whatsapp.ts`)

- Meta Cloud API v19.0 kullanır
- Sadece **onaylı template**'lerle mesaj gider (freeform chat yok)
- Telefon normalizasyonu: `0532...` → `90532...`
- Env: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`
- Platform ortak numarası (gelecekte tenant başına numara desteklenebilir)

**Kullanılan template'ler:**
- `appointment.confirm`
- `appointment.cancel`
- `appointment.reminder`
- `waitlist.notify`

### SMS (`lib/sms.ts`)

- İleti Merkezi (Türkiye operatör SMS'i)
- Auth: `MD5(ILETIMERKEZI_API_KEY + ILETIMERKEZI_API_SECRET)`
- Sender ID: `RANDEVYA` (max 11 karakter, onaylı)
- Telefon normalizasyonu: `0XXXXXXXXXX` → `90XXXXXXXXXX`
- Türkçe kısa mesajlar

### Loglama
- Her gönderim `NotificationLog`'a yazılır
- `channel`, `recipient`, `event_type`, `status`, `error_msg?`, `sent_at`

---

## 14. BEKLEME LİSTESİ (WAITLIST)

**Dosya:** `lib/waitlist.ts`

### Senaryo
Müşteri istediği slotta randevu yok. Bekleme listesine girebilir (plan destekliyorsa).

### Akış

**1) Listeye Giriş (`addToWaitlist`)**
- `POST /api/waitlist`
- Aynı e-posta daha önce aynı randevuya beklemede ise red
- `queue_order` atanır (sıra numarası)
- `status = WAITING`

**2) Randevu İptal Edildi → Sıradaki Bilgilendirilir**
- `notifyNextInWaitlist(appointmentId)`:
  - İlk `WAITING` kaydı bulunur
  - `status = NOTIFIED`, `notified_at = now`, `expires_at = now + 30dk`
  - Redis'e TTL ile expiry key konur (background expire için)
  - E-posta / WhatsApp / SMS atılır (30 dk içinde onay linkine tıkla)

**3) Müşteri Onaylar (`confirmWaitlistSlot`)**
- `POST /api/waitlist/confirm?token=...`
- Transaction içinde:
  - `status` hâlâ `NOTIFIED` mi? `expires_at` geçmedi mi?
  - `Appointment`'a bu müşterinin bilgileri atanır
  - `WaitlistEntry.status = CONFIRMED`
  - Aynı randevu için diğer tüm waitlist kayıtları `CANCELLED`

**4) Süre Dolarsa (`expireWaitlistEntry`)**
- Redis TTL expire event'i veya cron
- `status = EXPIRED`
- Sıradaki `WAITING` kişiye notify (adım 2'yi tekrar çalıştır)

### Durum Geçişleri
```
WAITING ──→ NOTIFIED ──→ CONFIRMED ✓
                    └──→ EXPIRED → bir sonraki WAITING'e geç
       └──→ CANCELLED
```

---

## 15. WEBHOOK SİSTEMİ (Tenant'a Giden)

Tenant kendi dış sistemlerine (CRM, Zapier, vb.) Randevya olaylarını gönderebilir.

**Dosya:** `lib/webhook.ts`

### Yapılandırma
- Tenant `/panel/ayarlar` içinde URL + secret + events listesi ekler
- `WebhookEndpoint` tablosuna kaydedilir
- Events: `["appointment.created", "appointment.cancelled"]` veya `["*"]` (tümü)

### Desteklenen Eventler
```
appointment.created
appointment.confirmed
appointment.cancelled
appointment.completed
appointment.rescheduled
waitlist.notified
waitlist.confirmed
```

### `fireWebhook(tenantId, event, data)`
- **Async fire-and-forget** (ana akışı bloklamaz)
- Tenant'ın aktif endpointleri çekilir
- Event filtreleme (subscription)
- HTTP POST gönderilir:
  ```
  Header: X-Randevya-Signature: sha256=HMAC_HEX(payload, secret)
  Header: X-Randevya-Event: appointment.created
  Body: { event, data, timestamp }
  ```
- Timeout: 5 saniye
- `WebhookLog`'a her deneme kaydedilir

### Tenant Tarafında Doğrulama
Tenant kendi sunucusunda:
```
expected = HMAC_SHA256(rawBody, secret)
receivedSig = header['X-Randevya-Signature']
assert expected == receivedSig
```

---

## 16. RATE LIMITING

**Dosya:** `lib/rate-limit.ts`

**Algoritma:** Redis sorted set tabanlı sliding window

### Nasıl Çalışır?
```
Key: "rl:booking:1.2.3.4"
ZREMRANGEBYSCORE key 0 (now - windowSec * 1000)  # eski kayıtları sil
ZADD key now now                                  # yeni kayıt ekle
ZCARD key                                         # şu anki istek sayısı
EXPIRE key windowSec
```

**Fail-open:** Redis erişilemezse limit geçilir (kullanılabilirlik > güvenlik).

### Varsayılan Limitler (`RATE_LIMITS`)

| Prefix | Limit | Kullanım |
|---|---|---|
| `publicBooking` | 10/dakika | Randevu oluşturma |
| `publicSlots` | 30/dakika | Slot sorgusu |
| `publicRead` | 60/dakika | Hizmet/personel listeleme |
| `authLogin` | 5/15dk | Brute force koruma |
| `authRegister` | 3/saat | Signup throttle |
| `panel` | 120/dakika | Panel işlemleri |
| `admin` | 200/dakika | Admin işlemleri |
| `webhook` | 5/10sn | PayTR webhook DDoS koruma |

### Kullanım
```typescript
export const POST = withRateLimit(
  withErrorHandler(handler, "appointments:create"),
  "rl:booking",
  RATE_LIMITS.publicBooking
)
```

### Response Header (RFC 6585)
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1700000060
Retry-After: 45  (sadece 429'da)
```

---

## 17. HATA YÖNETİMİ VE LOGLAMA

### `lib/logger.ts`
`logError({ endpoint, method, error, tenantId, userEmail, userRole, ipAddress })`:
- `ErrorLog` tablosuna yazar
- DB'ye yazma başarısız olursa console'a düşer (graceful degradation)

### `lib/api-helpers.ts`
```typescript
// Başarılı response
ok(data, status=200) → NextResponse.json({ success: true, data }, { status })

// Hata response
err(message, status=400, code?) → NextResponse.json({ success: false, error, code }, { status })

// HOF — try/catch + otomatik log
withErrorHandler(handler, label)
```

### Admin Tarafında Görüntüleme
- `GET /api/admin/error-logs` → filtrelenmiş log listesi
- `/admin/error-logs` ekranı (opsiyonel)

---

## 18. TENANT PANELİ (`/panel`)

### Dashboard (`/panel`)
- Yaklaşan randevular (bugün / yarın)
- Toplam randevu / gelir (plan destekliyorsa analytics)
- Hızlı istatistikler (personel sayısı, aktif hizmet sayısı)
- `GET /api/panel/dashboard`

### Randevular (`/panel/randevular`)
- Liste + filtreler (tarih, durum, personel)
- Detay / düzenleme / iptal
- Randevu ertele (reschedule)
- Manuel randevu ekleme (telefonla gelen müşteri için)
- Endpoint: `GET/POST /api/panel/appointments`, `GET/PUT/DELETE /api/panel/appointments/[id]`

### Personel (`/panel/personel`)
- CRUD
- Çalışma saatleri JSON editörü
- Fotoğraf upload (Cloudinary)
- Endpoint: `GET/POST /api/panel/staff`, `/[id]`

### Hizmetler (`/panel/hizmetler`)
- CRUD + süre ayarı
- Hangi personelin bu hizmeti verdiği (StaffService)
- Endpoint: `GET/POST /api/panel/services`

### Abonelik (`/panel/abonelik`)
- Mevcut plan + bitiş tarihi
- Plan değişikliği (Aylık/Yıllık toggle)
- Fatura adresi seçimi (BIREYSEL/KURUMSAL)
- Kupon girişi (`POST /api/panel/coupons/validate`)
- PayTR iframe embed
- Geçmiş ödemeler + fatura PDF indirme
- Endpoints: `GET/POST /api/panel/subscription`, `GET /api/panel/subscription/history`

### Ayarlar (`/panel/ayarlar`)

**Profil sekmesi**
- Şirket adı, sektör, iletişim bilgileri
- `GET/PUT /api/panel/settings/profile`

**Logo & Tema**
- Logo upload (Cloudinary, max 4MB)
- Tema renk ayarları (hex), font seçimi → `theme_config` JSON
- `POST /api/panel/settings/logo`, `GET/PUT /api/panel/theme`

**Domain**
- Subdomain (`domain_slug`) değiştirme
- Özel domain ekleme (plan destekliyorsa) → Vercel API ile otomatik
- DNS doğrulama durumu görüntüleme
- `GET/PUT/POST /api/panel/settings/domain`

**Webhook'lar**
- URL, secret, events
- `GET/POST /api/panel/settings/webhooks`, `PUT/DELETE /api/panel/settings/webhooks/[id]`

**Kapalı Günler**
- Tatiller, izin günleri
- Tüm işletme veya belirli personel bazlı
- `GET/POST /api/panel/settings/closed-days`

**Sözleşme Onayları**
- KVKK vb. sözleşmelerin onayı
- `POST /api/panel/settings/consents`

### Fatura Adresleri (`/panel/ayarlar/faturalar` veya abonelik içinde)
- CRUD (`BillingAddress`)
- BIREYSEL (TC kimlik) / KURUMSAL (vergi dairesi + vergi no)
- İl/ilçe seçimi `turkey-locations.ts`'den
- `GET/POST /api/panel/billing-addresses`, `PUT/DELETE /[id]`

### Bildirimler (`/panel/bildirimler`)
- NotificationLog görüntüleme (filtrelenmiş)
- `GET /api/panel/notifications`

### Destek (`/panel/destek`)
- Ticket oluşturma, mesaj gönderme
- `GET/POST /api/panel/support`, `/[id]`

### Panel Layout
- `components/panel/PanelShell.tsx` ile sarmalanır
- `Header` + `Sidebar` + content
- `SessionProvider` (NextAuth) en üstte

---

## 19. ADMIN PANELİ (`/admin`)

### Dashboard (`/admin`)
- Platform istatistikleri (toplam tenant, aktif abonelik, MRR)
- `GET /api/admin/stats`

### Tenant Yönetimi (`/admin/tenants`)
- Liste + arama + filtre
- Tenant detay + istatistik + abonelik geçmişi
- Yeni tenant oluşturma (deneme sürümü)
- Deaktif etme (`is_active=false`)
- Domain yönetimi (Vercel entegrasyonu)
- Tenant preview (cookie ile panel gibi davran)
- Endpoints:
  ```
  GET/POST   /api/admin/tenants
  GET/PUT/DELETE /api/admin/tenants/[id]
  GET        /api/admin/tenants/[id]/stats
  POST/DELETE /api/admin/tenants/[id]/domain
  GET        /api/admin/tenants/[id]/subscriptions
  POST       /api/admin/tenant-preview
  ```

### Paketler (`/admin/plans`)
- CRUD plan (özellik toggle'ları)
- `GET/POST /api/admin/plans`, `PUT/DELETE /api/admin/plans/[id]`

### Kuponlar (`/admin/kuponlar`)
- CRUD kupon
- Kullanım istatistikleri
- `GET/POST /api/admin/coupons`, `PUT/DELETE /api/admin/coupons/[id]`

### Ödemeler (`/admin/odemeler`)
- Tüm PendingPayment + TenantSubscription listesi
- Fatura PDF upload (Cloudinary)
- Refund tetikleme (PayTR refund API)
- `GET /api/admin/invoices`, `GET /api/admin/invoices/[id]`, `POST /api/admin/invoices/[id]/upload`
- `POST /api/admin/subscriptions/[id]/refund`

### Admin Kullanıcılar (`AdminUser` CRUD)
- Rol atama: `SUPER_ADMIN`, `SUPPORT`, `BILLING`, `VIEWER`
- `GET/POST /api/admin/users`, `PUT/DELETE /api/admin/users/[id]`

### E-posta Ayarları (`/admin/email-ayarlari`)
- SMTP host/port/user/pass
- Test e-postası gönderme
- `GET/PUT /api/admin/email-config`, `POST /api/admin/email-config/test`

### Rate Limit İzleme (`/admin/rate-limit`)
- Aktif limit key'leri ve sayıları
- `POST /api/admin/rate-limit`

### Destek (`/admin/support`)
- Tüm ticket'ları görme, yanıtlama
- `GET /api/admin/support`, `PUT /api/admin/support/[id]`

### Hata Logları (`/admin/error-logs`)
- ErrorLog filtrelenmiş görünüm
- `GET /api/admin/error-logs`

### Yasal Dokümanlar (`/admin/legal`)
- KVKK, Gizlilik, T&C vb. versiyonları
- Aktif versiyon belirleme
- `GET/POST /api/admin/legal`, `PUT/DELETE /api/admin/legal/[id]`

---

## 20. MÜŞTERİ PANELİ (`/musteri`)

### Giriş / Kayıt
- `/musteri/giris` — müşteri e-posta + şifre (opsiyonel; randevu zorunlu kayıt gerektirmez)
- `/musteri/kayit`

### Randevularım (`/musteri/randevularim`)
- Geçmiş / gelecek randevular
- İptal / ertele (izin verilmişse)

### Profil (`/musteri/randevularim/profil`)
- İletişim bilgilerini güncelleme

> **Not:** Şu an randevu public/anonim alınabiliyor; müşteri portalı opsiyonel zenginleştirme.

---

## 21. KURUMSAL / PUBLIC SİTE

### Ana Sayfa (`/`)
**Platform domain'inde** (`randevya.com`):
- Pazarlama içeriği (özellikler, fiyatlandırma, sektör örnekleri)
- "Kayıt Ol" / "Giriş Yap" CTA

**Tenant subdomain'inde** (`isletme.randevya.com`):
- `components/public/TenantHome.tsx` render edilir
- Tenant logo + tema
- Hizmetler listesi
- "Randevu Al" butonu → `/randevu`

### İletişim (`/iletisim`)
- İletişim formu
- `POST /api/contact` → admin'e e-posta

### Sözleşmeler (`/sozlesmeler/[type]`)
- `type`: `kvkk`, `gizlilik`, `kullanim-kosullari`, `mesafeli-satis`, `iptal-iade`, `cerez`
- Aktif `LegalDocument` versiyonu HTML olarak render edilir

### Navbar & Footer
- `components/public/Navbar.tsx`
- `components/public/Footer.tsx` (tüm yasal sayfalara link)

### Sitemap (`app/sitemap.ts`)
- Platform sayfalarını otomatik listeler

---

## 22. API ENDPOINT HARİTASI

**Toplam:** ~65+ endpoint

### Public (Auth yok)
```
POST   /api/auth/register               # Tenant kayıt
POST   /api/auth/forgot-password        # Şifremi unuttum
POST   /api/auth/reset-password         # Şifre sıfırla
GET    /api/auth/[...nextauth]          # NextAuth handler

POST   /api/appointments                # Randevu oluştur (public, Turnstile)
GET    /api/appointments/[id]           # Randevu detay (token ile)
GET    /api/slots                       # Müsait slotlar
GET    /api/staff                       # Personel listesi
GET    /api/services                    # Hizmet listesi
GET    /api/tenant                      # Tenant bilgisi

POST   /api/waitlist                    # Bekleme listesine gir
POST   /api/waitlist/confirm            # Slot onayı

POST   /api/contact                     # İletişim formu
GET    /api/legal                       # Yasal doküman
```

### Panel (Tenant Auth)
```
GET    /api/panel/dashboard

GET/POST      /api/panel/appointments
GET/PUT/DELETE /api/panel/appointments/[id]

GET/POST      /api/panel/staff
GET/PUT/DELETE /api/panel/staff/[id]
POST          /api/panel/staff/[id]/photo

GET/POST      /api/panel/services
GET/PUT/DELETE /api/panel/services/[id]

GET/POST      /api/panel/subscription
GET           /api/panel/subscription/history

GET/POST      /api/panel/billing-addresses
GET/PUT/DELETE /api/panel/billing-addresses/[id]

POST          /api/panel/coupons/validate

GET/PUT       /api/panel/settings/profile
POST          /api/panel/settings/logo
GET/PUT       /api/panel/theme
GET/POST      /api/panel/settings/domain
GET/POST      /api/panel/settings/webhooks
PUT/DELETE    /api/panel/settings/webhooks/[id]
GET/POST      /api/panel/settings/closed-days
POST          /api/panel/settings/consents

GET           /api/panel/analytics
GET           /api/panel/notifications
GET/POST      /api/panel/support
PUT           /api/panel/support/[id]
```

### Admin (Admin Auth)
```
GET/POST      /api/admin/tenants
GET/PUT/DELETE /api/admin/tenants/[id]
GET           /api/admin/tenants/[id]/stats
POST/DELETE   /api/admin/tenants/[id]/domain
GET           /api/admin/tenants/[id]/subscriptions
POST          /api/admin/tenant-preview

GET/POST      /api/admin/plans
PUT/DELETE    /api/admin/plans/[id]

GET/POST      /api/admin/coupons
PUT/DELETE    /api/admin/coupons/[id]

GET           /api/admin/invoices
GET           /api/admin/invoices/[id]
POST          /api/admin/invoices/[id]/upload
POST          /api/admin/subscriptions/[id]/refund

GET/POST      /api/admin/users
PUT/DELETE    /api/admin/users/[id]

GET/PUT       /api/admin/email-config
POST          /api/admin/email-config/test

GET/POST      /api/admin/legal
PUT/DELETE    /api/admin/legal/[id]

GET           /api/admin/error-logs
GET           /api/admin/stats
POST          /api/admin/rate-limit
GET/PUT       /api/admin/support
```

### Webhook & Cron
```
POST   /api/webhooks/paytr              # PayTR webhook (hash verify)
GET    /api/cron/reminders              # 24h reminder job (CRON_SECRET)
GET    /api/cron/subscriptions          # Abonelik expiry/downgrade
```

---

## 23. CRON JOBLARI

### `vercel.json` İçeriği
```json
{
  "crons": [
    { "path": "/api/cron/reminders",     "schedule": "0 7 * * *" },
    { "path": "/api/cron/subscriptions", "schedule": "0 5 * * *" }
  ]
}
```

Vercel bu yolları saatinde GET çağrısı yapar. Her cron endpoint'inde `Authorization: Bearer ${CRON_SECRET}` doğrulanır.

### `/api/cron/reminders` — Her Gün 07:00 UTC
- `notifyUpcomingAppointments()` çağrılır
- Şu anki zamandan 23-25 saat sonraki CONFIRMED randevuları bulur
- Her birine e-posta + WhatsApp + SMS hatırlatma

### `/api/cron/subscriptions` — Her Gün 05:00 UTC
1. **Süresi yaklaşan abonelikler** (3 gün içinde bitenler)
   - Tenant'a e-posta: "Aboneliğiniz 3 gün içinde bitecek"
2. **Süresi biten abonelikler** (`ends_at < now && status=ACTIVE`)
   - `status = EXPIRED`
   - Tenant en ucuz plana (deneme) downgrade
   - Yeni plan `custom_domain=false` ise Vercel'dan özel domain kaldırılır (`removeDomainFromVercel`)
   - Yeni plan limitleri aşılıyorsa kullanıcı uyarılır (personel/hizmet kapatılmaz, sadece yeni ekleme engellenir)

---

## 24. GÜVENLİK ÖNLEMLERİ

### Şifre
- `bcryptjs` 10 round
- Hiçbir yerde plaintext saklanmaz

### HTTPS Zorunlu
- `next.config.ts`'de HSTS header:
  ```
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  ```

### Güvenlik Başlıkları (next.config.ts)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Powered-By: (kaldırıldı)
```

### CAPTCHA
- Randevu oluşturma (public): Cloudflare Turnstile
- `lib/turnstile.ts` içinde server-side doğrulama
- Bot/spam koruması

### Rate Limiting
- Redis sliding window, tüm public endpointler üzerinde (bkz § 16)

### Multi-tenant İzolasyon
- Her API route başında `requireTenantSession()` veya `requireAdminSession()`
- Query'lerde `tenant_id` mutlaka filter edilir
- Admin preview sadece `admin_preview_tenant` cookie + admin JWT ile aktif olur

### PayTR Webhook
- HMAC-SHA256 imza doğrulaması (`verifyPayTRWebhook`)
- Hash uyuşmazsa 400 dön, işlem yapma

### Tenant Webhook
- HMAC-SHA256 signature (`X-Randevya-Signature` header)
- Tenant secret ile doğrulamalı

### Şifre Sıfırlama Token
- 64 byte random, 1 saat TTL
- Tek kullanımlık (`used=true`)

### KVKK Uyumu
- `UserConsent` tablosunda IP + User-Agent + timestamp saklanır
- Versiyonlu sözleşmeler (`LegalDocument.version`)

### Log Güvenliği
- ErrorLog'da `stack_trace` sadece admin görür
- NotificationLog müşteri bilgisi (e-posta) içerir → tenant kendi loguna erişebilir

---

## 25. CLOUDINARY / DOSYA YÜKLEME

**Dosya:** `lib/cloudinary.ts`

### Env
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Neler Yüklenir?
| Nesne | Folder | Max Boyut |
|---|---|---|
| Tenant logosu | `randevya/tenants/{id}/logo` | 4 MB |
| Personel fotoğrafı | `randevya/tenants/{id}/staff/{staff_id}` | 4 MB |
| Fatura PDF'i | `randevya/invoices/{invoice_id}` | 10 MB |

### Özellikler
- `quality: "auto:best"` — otomatik sıkıştırma
- `fetch_format: "auto"` — WebP/AVIF dönüşümü
- EXIF stripping (gizlilik)
- Mime type doğrulama (JPEG/PNG/WebP/GIF/SVG/PDF)
- Yüklenen public_id DB'ye kaydedilir → sonradan `cloudinary.uploader.destroy()` ile silinebilir

---

## 26. VERCEL DOMAIN API ENTEGRASYONU

**Dosya:** `lib/vercel-domains.ts`

### Env
```
VERCEL_API_TOKEN=...
VERCEL_PROJECT_ID=...
VERCEL_TEAM_ID=...  (opsiyonel)
```

### Fonksiyonlar
```typescript
addDomainToVercel(domain)       // Projeye domain ekle
removeDomainFromVercel(domain)  // Projeden domain kaldır
verifyDomainOnVercel(domain)    // DNS durumu + SSL cert durumu
getDomainConfig(domain)         // Detaylı config
```

### Kullanım Noktaları
- Tenant özel domain girer → `addDomainToVercel`
- Abonelik bitip downgrade olursa → `removeDomainFromVercel` (yeni plan `custom_domain=false` ise)
- Settings ekranında "Doğrulama durumu" için → `verifyDomainOnVercel`

---

## 27. CLOUDFLARE TURNSTILE (CAPTCHA)

**Dosya:** `lib/turnstile.ts`

### Env
```
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
```

### Frontend
- `components/ui/Turnstile.tsx` — Cloudflare widget'ını yükler
- Token alır, form submit'de server'a gönderir

### Backend
- `verifyTurnstile(token, remoteip?)` → `challenges.cloudflare.com/turnstile/v0/siteverify`'a POST
- Başarısızsa request reddedilir

### Kullanım Noktaları
- Randevu oluşturma (`POST /api/appointments`)
- İletişim formu (`POST /api/contact`)
- Şifremi unuttum (isteğe bağlı)

---

## 28. UPSTASH REDIS KULLANIMI

**Dosya:** `lib/redis.ts`

### Env
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### Kullanım Alanları

| Key Pattern | Amaç | TTL |
|---|---|---|
| `rl:*:ip` | Rate limit sorted set | Window süresi |
| `tenant:resolved:{rawId}` | Tenant cache | 5 dakika |
| `waitlist:expire:{entryId}` | Waitlist 30dk expiry | 30 dakika |
| `email:transporter:cache` | SMTP config hash | 5 dakika |

### Fail-safe
- Redis çökerse rate limit açılır (fail-open)
- Tenant cache miss → DB'den yüklenir
- Kritik akış (ödeme, randevu oluşturma) Redis'e bağımlı değil

---

## 29. SCRIPTS (Bakım & Yönetim)

Tüm scriptler `scripts/` klasöründe, `tsx` ile çalıştırılır.

### `generate-admin-hash.ts`
```bash
npm run admin:hash
```
- Girdi: şifre
- Çıktı: bcrypt hash (env `ADMIN_PASSWORD_HASH`'e yapıştırılır)

### `check-payment-state.ts`
- Son N gündeki PayTR transaction'larını çeker
- DB'deki `TenantSubscription` ile karşılaştırır
- Eksik/uyumsuz kayıt varsa raporlar

### `reconcile-payment.ts`
- Spesifik `merchant_oid` için PayTR API sorgular
- Eğer ödeme başarılı ama webhook gelmediyse manuel olarak `handleSuccessfulPayment` çağırır
- Webhook kaybı senaryoları için (örn. PayTR hostname quirk'i nedeniyle)

### `expire-trial.ts`
- 14 gün dolmuş deneme aboneliklerini expire eder
- Cron job olarak da çalıştırılabilir

### `reset-tenant-billing.ts` ⚠️
- Bir tenant'ın tüm subscription, invoice, coupon_usage kayıtlarını siler
- **Geri alınamaz.** Sadece test/destek için

---

## 30. ENVIRONMENT VARIABLES

Tam liste:

```bash
# ─── Database ──────────────────────────────────
DATABASE_URL="sqlserver://host:1433;database=randevya;user=admin;password=...;encrypt=true;trustServerCertificate=false"

# ─── NextAuth ──────────────────────────────────
NEXTAUTH_URL=https://randevya.com
NEXTAUTH_SECRET=long-random-string

# ─── Platform Admin (fallback — AdminUser tablosu öncelikli) ──
ADMIN_EMAIL=admin@randevya.com
ADMIN_PASSWORD_HASH=$2a$10$...

# ─── PayTR ─────────────────────────────────────
PAYTR_MERCHANT_ID=...
PAYTR_MERCHANT_KEY=...
PAYTR_MERCHANT_SALT=...
PAYTR_TEST_MODE=0

# ─── SMTP (fallback — EmailConfig tablosu öncelikli) ──
SMTP_HOST=mail.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@example.com
SMTP_PASS=...
SMTP_FROM_EMAIL=noreply@randevya.com
SMTP_FROM_NAME=Randevya

# ─── WhatsApp (Meta Cloud API) ────────────────
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_TOKEN=...

# ─── SMS (İleti Merkezi) ──────────────────────
ILETIMERKEZI_API_KEY=...
ILETIMERKEZI_API_SECRET=...
ILETIMERKEZI_SENDER=RANDEVYA

# ─── Cloudinary ───────────────────────────────
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# ─── Upstash Redis ────────────────────────────
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ─── Cloudflare Turnstile ─────────────────────
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...

# ─── Vercel (custom domain için) ──────────────
VERCEL_API_TOKEN=...
VERCEL_PROJECT_ID=...
VERCEL_TEAM_ID=...  # takım hesabı ise

# ─── Cron ─────────────────────────────────────
CRON_SECRET=random-bearer-token
```

---

## 31. DEPLOYMENT (VERCEL)

### Konfig

**`vercel.json`**
```json
{
  "crons": [
    { "path": "/api/cron/reminders",     "schedule": "0 7 * * *" },
    { "path": "/api/cron/subscriptions", "schedule": "0 5 * * *" }
  ]
}
```

**`.npmrc`** (repo kökünde)
```
legacy-peer-deps=true
```
Vercel build'de peer dep hatalarını bypass için (son commit: `db52035`).

### Build Komutu
```
prisma generate && next build
```
`package.json` `build` script'i. Vercel otomatik algılar.

### Özel Domain Akışı
1. Tenant panel'de özel domain girer (`kuaforajda.com`)
2. Backend `addDomainToVercel('kuaforajda.com')` çağırır
3. Vercel DNS talimatları döndürür (A/CNAME)
4. Tenant DNS ayarlarını yapar
5. `verifyDomainOnVercel` ile durum kontrol edilir
6. `Tenant.custom_domain` set edilir
7. Artık trafik bu domain üzerinden gelir, `proxy.ts` `custom:kuaforajda.com` olarak mapler

### Image Optimization
- `next.config.ts` içinde `remotePatterns`:
  ```
  res.cloudinary.com — logo, fotoğraf, PDF
  ```
- Tenant logoları Next.js Image component'i ile optimize edilir

---

## EK: AYNİ PROJEDEKİ ÖZEL NOTLAR & SON COMMITLER

### `CLAUDE.md` / `AGENTS.md` Uyarısı
> Bu Next.js sürümü (16.2.3) breaking change içerir. API'ler, konvansiyonlar, dosya yapısı öğrenilmiş versiyondan farklı olabilir. Kod yazmadan önce `node_modules/next/dist/docs/` okunmalı. Deprecation notları dikkate alınmalı.

### Son Commitler
```
336ce0e Fix responsive layout, subscription UX, logo redirect, and coupon placeholder
c028c6c Add show/hide eye icon to password reset page
db52035 Add .npmrc with legacy-peer-deps to fix Vercel build
0dbd5bf Fix corporate site navbar hash anchors and add shared Footer component
b455274 Upgrade nodemailer to 8.0.5 to resolve SMTP injection advisories
```

### Önemli Bilinen Durum (Memory)
> **PayTR Webhook Hostname Quirk:** PayTR, webhook URL'ının (Bildirim URL) hostname'i SİTE ADRESİ ile eşleşmezse webhook'u sessizce düşürür (örn. `www.randevya.com` vs `randevya.com`). Webhook'lar gelmiyorsa önce bu ayar kontrol edilmeli.

---

## PROJENIN İŞLEYİŞ DÖNGÜSÜ (END-TO-END)

### 1) İşletme Platforma Kayıt Oluyor
```
Platform Ana Sayfa → "Kayıt Ol"
→ POST /api/auth/register
→ Tenant oluştur (deneme planı, domain_slug verir)
→ Hoş geldin e-postası
→ Tenant panel'e yönlendir
```

### 2) İşletme Kurulumu Yapıyor
```
/panel → Personel ekle → Hizmet ekle
→ Çalışma saatlerini ayarla
→ Logo yükle (Cloudinary)
→ Tema rengi seç
→ (Opsiyonel) Özel domain ekle (Vercel API)
```

### 3) İşletme Plan Yükseltiyor
```
/panel/abonelik → Plan seç (Aylık/Yıllık)
→ Fatura adresi ekle (Bireysel/Kurumsal)
→ (Opsiyonel) Kupon gir
→ POST /api/panel/subscription
  → calculatePricing() (KDV + yıllık discount + kupon)
  → PendingPayment oluştur (merchant_oid)
  → createPayTRToken() → iframe URL
→ PayTR iframe'i kartı al
→ Kullanıcı ödemeyi yapar
→ PayTR webhook: POST /api/webhooks/paytr
  → Hash doğrula
  → handleSuccessfulPayment():
    - TenantSubscription ACTIVE
    - Tenant.plan_id güncel
    - Invoice FATURA_BEKLIYOR
    - CouponUsage (varsa)
  → Tenant'a e-posta, admin'lere e-posta
→ Panel'de "Ödeme başarılı" ekranı
```

### 4) Müşteri Randevu Alıyor
```
isletme.randevya.com (subdomain)
→ proxy.ts x-tenant-id="slug:isletme" set eder
→ TenantHome render olur
→ "Randevu Al" → /randevu
→ BookingStepper:
   Hizmet → Personel → Tarih → Saat (GET /api/slots)
   → Müşteri bilgileri → Turnstile CAPTCHA
→ POST /api/appointments:
   - Rate limit 10/dk
   - Turnstile verify
   - isSlotAvailable (transaction-safe)
   - Appointment oluştur (CONFIRMED)
   - notifyAppointmentCreated (paralel):
       • E-posta (müşteri + işletme)
       • WhatsApp (plan destekliyorsa)
       • SMS (İleti Merkezi)
       • Tenant webhook'u
       • NotificationLog kayıtları
→ Başarı ekranı
```

### 5) Randevu Hatırlatma (24 Saat Önceden)
```
Vercel cron: 07:00 UTC → GET /api/cron/reminders (CRON_SECRET)
→ notifyUpcomingAppointments()
→ 23-25 saat sonraki CONFIRMED randevular
→ Her birine e-posta + WhatsApp + SMS
```

### 6) Randevu İptali → Waitlist Tetiklenmesi
```
Tenant veya müşteri randevuyu iptal eder
→ Appointment.status = CANCELLED
→ notifyAppointmentCancelled() (bildirimler)
→ notifyNextInWaitlist(appointment_id):
   - İlk WAITING kaydı bul
   - status=NOTIFIED, expires_at=now+30dk
   - Redis TTL key
   - Müşteriye link gönder (e-posta/WhatsApp/SMS)
→ Müşteri 30dk içinde linke tıklarsa
   → POST /api/waitlist/confirm
   → Appointment'ın müşteri bilgileri güncellenir
   → WaitlistEntry.status = CONFIRMED
→ 30dk içinde tıklamazsa → EXPIRED, sıradakine geçer
```

### 7) Abonelik Sonu
```
Vercel cron: 05:00 UTC → GET /api/cron/subscriptions
→ 3 gün içinde bitenlere uyarı e-postası
→ ends_at < now olanlar:
   - status = EXPIRED
   - Tenant.plan_id = ucuz plan (downgrade)
   - Plan custom_domain=false ise Vercel'dan domain kaldır
```

### 8) Admin Fatura PDF Yüklüyor
```
/admin/odemeler → Fatura seç
→ Invoice status = FATURA_BEKLIYOR
→ PDF upload → Cloudinary
→ invoice.pdf_url, pdf_public_id set
→ status = FATURA_YUKLENDI
→ Tenant'a e-posta (link ile)
→ emailed_at set
```

---

## SON SÖZ

Bu doküman projenin **yazılımsal tam fotoğrafıdır.** Bir geliştirici bu dosyayı baştan sona okuduğunda:

- Hangi dosyanın ne yaptığını (dosya yapısı § 3)
- Veritabanının nasıl düzenlendiğini (§ 5, 28 model)
- Multi-tenant izolasyonun nasıl çalıştığını (§ 4, proxy.ts)
- Randevu alma akışının tüm adımlarını (§ 7, 8)
- PayTR ödeme döngüsünü (§ 9, 10)
- Bildirimlerin 3 kanal paralel nasıl gittiğini (§ 13)
- Waitlist'in durum makinesini (§ 14)
- Cron jobların ne zaman ne yaptığını (§ 23)
- Tüm API endpointlerinin amacını (§ 22)
- Güvenlik katmanlarını (§ 16, 24, 27)
- Deployment sürecini (§ 31)

tam olarak kavrayabilir.

**Toplam:**
- 28 veritabanı modeli
- 65+ API endpoint
- 16 lib/ modülü (iş mantığı)
- 3 ana panel (tenant, admin, müşteri)
- 2 cron job
- 4 bildirim kanalı (e-posta, WhatsApp, SMS, webhook)
- 3 3rd-party entegrasyon (PayTR, Cloudinary, Vercel Domain API)
- 1 CAPTCHA (Turnstile)
- 1 cache/rate-limit altyapısı (Upstash Redis)

Randevya bir üretim kalitesinde, çok-kiracılı, KVKK uyumlu, ölçeklenebilir Türk SaaS uygulamasıdır.
