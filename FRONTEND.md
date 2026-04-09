# Randevya — Frontend Geliştirici Rehberi

> Bu dosyayı baştan sona oku. Backend tamamen hazır, sen sadece UI yazacaksın.
> API'ye bağlan, verileri göster, formları gönder.

---

## İçindekiler

1. [Proje Nedir?](#1-proje-nedir)
2. [Teknik Stack](#2-teknik-stack)
3. [Klasör Yapısı ve Sorumluluk Dağılımı](#3-klasör-yapısı)
4. [Multi-Tenant Mimari — Nasıl Çalışır?](#4-multi-tenant-mimari)
5. [Tema Sistemi — CSS Değişkenleri](#5-tema-sistemi)
6. [Kimlik Doğrulama (NextAuth)](#6-kimlik-doğrulama)
7. [Tüm Sayfalar ve API Bağlantıları](#7-tüm-sayfalar)
8. [Adım Adım Kullanıcı Akışları](#8-kullanıcı-akışları)
9. [API Referansı — Hızlı Bakış](#9-api-referansı)
10. [Test Bilgileri](#10-test-bilgileri)
11. [Önemli Kurallar](#11-önemli-kurallar)

---

## 1. Proje Nedir?

**Randevya.com** — White-label çok kiracılı (multi-tenant) SaaS randevu yönetim platformu.

### İşleyiş
- Her işletme (`tenant`) kendi subdomain'ine sahip: `hiralamerkezi.randevya.com`
- İşletme kendi temasını (renk, font, logo) panelden ayarlar
- Müşteriler o işletmenin sayfasından randevu alır
- İşletme sahibi panelden randevuları, personeli ve hizmetleri yönetir
- Platform sahibi (sen/admin) tüm işletmeleri admin panelden yönetir

### Örnek Senaryo
```
Kuaför Ayşe → randevya.com'a kayıt → "ayse-kuafor.randevya.com" alır
             → Panelden personel ekler, hizmet ekler, tema seçer
Müşteri     → ayse-kuafor.randevya.com'a girer
             → Hizmet seçer → personel seçer → tarih/saat seçer → randevu alır
             → Email + WhatsApp + SMS ile onay bildirimi alır
```

### Sektörler
Güzellik salonu, kuaför, klinik, dövme stüdyosu, fizyoterapi, veteriner, danışmanlık vb.

---

## 2. Teknik Stack

```
Next.js 16.2.3     — App Router, Turbopack
React 19           — Concurrent features
TypeScript 5       — Strict mode
Tailwind CSS 4     — Utility-first (v4 syntax — @import "tailwindcss" kullan, config dosyası yok)
NextAuth v4        — Cookie tabanlı session
Prisma 7 + MSSQL   — Backend (sen kullanmayacaksın, sadece API'ye istek atarsın)
```

### Tailwind v4 Notu
Tailwind v4'te `tailwind.config.js` **yok**. Global CSS dosyasına:
```css
@import "tailwindcss";

:root {
  --color-primary: #2a5cff;
  /* tenant theme variables */
}
```

---

## 3. Klasör Yapısı

```
app/
├── (public)/              ← MÜŞTERİ YÜZ — SEN YAZACAKSIN
│   ├── layout.tsx         ← Tenant temasını inject eder (CSS variables)
│   ├── page.tsx           ← İşletme landing page
│   ├── randevu/           ← Randevu alma akışı (6 adım)
│   │   ├── page.tsx       ← Adım yönetimi (stepper)
│   │   └── [id]/          ← Randevu detay/iptal (müşteri)
│   ├── bekle/             ← Bekleme listesi
│   │   ├── page.tsx       ← Bekleme listesine eklenme formu
│   │   └── onayla/        ← Slot açılınca email'den gelen onay linki
│   └── sozlesmeler/       ← Yasal belgeler
│       └── [type]/        ← KVKK, gizlilik vb.
│
├── (panel)/               ← İŞLETME PANELİ — SEN YAZACAKSIN
│   ├── layout.tsx         ← Panel layout (sidebar, auth guard)
│   ├── panel/
│   │   ├── giris/         ← Login sayfası
│   │   ├── page.tsx       ← Dashboard
│   │   ├── randevular/    ← Takvim + liste görünümü
│   │   ├── personel/      ← Personel yönetimi
│   │   ├── hizmetler/     ← Hizmet yönetimi
│   │   ├── analitik/      ← Grafikler
│   │   ├── destek/        ← Destek talepleri
│   │   ├── abonelik/      ← Plan + ödeme geçmişi
│   │   └── ayarlar/       ← Profil, logo, tema, kapalı günler, webhooks
│
├── (admin)/               ← PLATFORM ADMİN PANELİ — SEN YAZACAKSIN
│   ├── layout.tsx         ← Admin layout (auth guard: PLATFORM_ADMIN)
│   └── admin/
│       ├── page.tsx       ← Admin dashboard
│       ├── tenants/       ← İşletme listesi + detay
│       ├── planlar/       ← Plan yönetimi
│       ├── destek/        ← Tüm destek talepleri
│       ├── kullanicilar/  ← Admin kullanıcı yönetimi
│       ├── hata-loglari/  ← Sistem hata logları
│       └── yasal/         ← Yasal belge versiyonlama
│
└── api/                   ← BACKEND — DOKUNMA, HAZIR
```

---

## 4. Multi-Tenant Mimari

### Backend Nasıl Çalışıyor?
`proxy.ts` (middleware) her istekte `Host` header'ına bakarak tenant'ı çözümler:
- `ayse-kuafor.randevya.com` → `x-tenant-id: slug:ayse-kuafor` header'ı set edilir
- `ozelklinik.com` (custom domain) → `x-tenant-id: custom:ozelklinik.com`

### Sen Ne Yapacaksın?
`(public)/layout.tsx` içinde tenant config'i çek, CSS değişkenlerini inject et:

```tsx
// app/(public)/layout.tsx
import { headers } from "next/headers"

async function getTenantConfig() {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")
  if (!tenantId) return null

  // API'den tenant config çek
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/tenant`, {
    headers: { "x-tenant-id": tenantId },
    next: { revalidate: 300 }, // 5 dakika cache
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.data
}

export default async function PublicLayout({ children }) {
  const tenant = await getTenantConfig()
  if (!tenant) return <div>İşletme bulunamadı</div>

  const theme = tenant.theme_config

  return (
    <html>
      <body style={{
        "--color-primary": theme.primary_color,
        "--color-secondary": theme.secondary_color,
        "--font-main": theme.font,
        "--border-radius": theme.border_radius,
      } as React.CSSProperties}>
        {children}
      </body>
    </html>
  )
}
```

### Yerel Geliştirme
`proxy.ts` subdomain çözümlemesi yapar ama localhost'ta subdomain yok.
API isteklerinde `x-tenant-id` header'ını doğrudan ekle:

```tsx
// Yerel geliştirmede kullanılacak helper
const TENANT_HEADER = process.env.NODE_ENV === "development"
  ? { "x-tenant-id": "slug:test-kuafor" }
  : {} // prod'da proxy.ts zaten set eder
```

---

## 5. Tema Sistemi

Tenant'ın `theme_config` alanı şu yapıda:
```json
{
  "primary_color": "#2a5cff",
  "secondary_color": "#ff4d2e",
  "font": "Inter",
  "border_radius": "12px",
  "tagline": "Güzelliğiniz için buradayız"
}
```

### CSS Değişkenleri (Global CSS)
```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --color-primary: #2a5cff;
  --color-secondary: #ff4d2e;
  --font-main: Inter, sans-serif;
  --border-radius: 12px;
}

/* Tailwind v4'te custom utility tanımlama */
@utility btn-primary {
  background-color: var(--color-primary);
  border-radius: var(--border-radius);
  color: white;
  padding: 0.5rem 1.25rem;
}
```

### Font Yükleme
Tenant'ın seçtiği font Google Fonts'tan yüklenir:
```tsx
// layout.tsx içinde dynamic font loading
const fontMap = {
  "Inter": Inter,
  "Poppins": Poppins,
  "Roboto": Roboto,
  // vb.
}
```

---

## 6. Kimlik Doğrulama

### Session Yapısı
```typescript
// NextAuth session'ından gelen veri
session.user = {
  id: string
  email: string
  name: string
  tenant_id: string          // işletme sahibi için dolu
  role: "TENANT_OWNER" | "PLATFORM_ADMIN"
  admin_role?: "SUPER_ADMIN" | "SUPPORT" | "BILLING" | "VIEWER"
}
```

### Panel Layout Auth Guard
```tsx
// app/(panel)/layout.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PanelLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/panel/giris")
  if (session.user.role !== "TENANT_OWNER") redirect("/panel/giris")

  return <div>{children}</div>
}
```

### Admin Layout Auth Guard
```tsx
// app/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PLATFORM_ADMIN") {
    redirect("/panel/giris")
  }

  return <div>{children}</div>
}
```

### Login Sayfası
NextAuth'un kendi `signIn` fonksiyonunu kullan:
```tsx
"use client"
import { signIn } from "next-auth/react"

const handleLogin = async (email: string, password: string) => {
  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  })

  if (result?.ok) {
    router.push("/panel")
  } else {
    setError("Email veya şifre hatalı")
  }
}
```

---

## 7. Tüm Sayfalar

---

### PUBLIC SAYFALAR (Müşteri yüzü)

---

#### 7.1 Ana Sayfa — İşletme Landing Page
**Dosya:** `app/(public)/page.tsx`
**URL:** `ayse-kuafor.randevya.com/`

**İçerik:**
- İşletme logosu + adı (tenant config'den)
- Tagline (tenant config'den)
- "Randevu Al" butonu → `/randevu`'ya yönlendirir
- Hizmet listesi (kısa tanıtım kartları)
- Personel listesi (fotoğraf + isim + unvan)

**API Çağrıları:**
```
GET /api/tenant          → logo, company_name, theme_config, tagline
GET /api/services        → hizmet listesi (isim, süre)
GET /api/staff           → personel listesi (isim, unvan, foto)
```

---

#### 7.2 Randevu Alma Akışı (6 Adım)
**Dosya:** `app/(public)/randevu/page.tsx`
**URL:** `/randevu`

Bu sayfa tek bir stepper component'ten oluşur. State yönetimi için `useState` yeterli (ya da Zustand).

```typescript
// Booking state
type BookingState = {
  step: 1 | 2 | 3 | 4 | 5 | 6
  service_id: string | null
  service_name: string | null
  service_duration: number | null
  staff_id: string | null
  staff_name: string | null
  date: string | null          // "YYYY-MM-DD"
  start_time: string | null    // "2026-04-20T10:00:00"
  end_time: string | null
  customer_name: string
  customer_phone: string
  customer_email: string
  notes: string
}
```

**Adım 1 — Hizmet Seç**
```
GET /api/services → Kart listesi göster
```
Kullanıcı seçince → step 2

**Adım 2 — Personel Seç**
```
GET /api/staff?serviceId={service_id} → Sadece o hizmeti verebilen personel
```
"Fark etmez" seçeneği de ekle (staffId boş bırakılır, tüm müsait slotlar gelir)
Kullanıcı seçince → step 3

**Adım 3 — Tarih Seç**
Takvim component'i göster (react-calendar veya custom).
- Geçmiş günler disable
- Seçince → step 4

**Adım 4 — Saat Seç**
```
GET /api/slots?serviceId={id}&date={YYYY-MM-DD}&staffId={id}
→ [{ start, end, staff_id, staff_name }, ...]
```
Slotları düğme grid'i olarak göster. Boşsa "Bu tarihte müsait saat yok" mesajı.
Seçince → step 5

**Adım 5 — Müşteri Bilgileri**
Form: Ad Soyad, Telefon, E-posta, Not (opsiyonel)
KVKK onay checkbox'ı zorunlu.
Gönderince → step 6

**Adım 6 — Onay**
```
POST /api/appointments
Body: { service_id, staff_id, start_time, customer_name, customer_phone, customer_email, notes }
```
Başarılıysa:
- "Randevunuz oluşturuldu! Onay emaili gönderildi." mesajı
- Randevu ID'sini göster
- "Randevumu Görüntüle" butonu → `/randevu/{id}?email={email}`

**Hata Durumları:**
- `SLOT_TAKEN` (409) → "Bu saat doldu, lütfen başka bir saat seçin" + step 4'e geri dön
- Rate limit (429) → "Çok fazla istek" mesajı

---

#### 7.3 Randevu Detay ve İptal (Müşteri)
**Dosya:** `app/(public)/randevu/[id]/page.tsx`
**URL:** `/randevu/{id}?email=musteri@mail.com`

```
GET /api/appointments/{id}?email={email}
→ randevu detayı (hizmet, personel, tarih, durum)
```

**İçerik:**
- Randevu bilgileri (kart görünümü)
- Durum badge'i (CONFIRMED → yeşil, CANCELLED → kırmızı)
- "Randevuyu İptal Et" butonu (sadece CONFIRMED/PENDING ve 2 saatten fazla varsa göster)

**İptal:**
```
PATCH /api/appointments/{id}
Body: { action: "cancel", email: "{email}" }
```
Hata: 422 → "Randevuya 2 saatten az kaldı, iptal yapılamaz"

---

#### 7.4 Bekleme Listesi
**Dosya:** `app/(public)/bekle/page.tsx`
**URL:** `/bekle?appointmentId={id}`

Dolu bir randevu için bekleme listesine kayıt formu.

```
POST /api/waitlist
Body: { appointment_id, customer_name, customer_phone, customer_email }
```

Başarılıysa: "Sıraya eklendiniz! Slot açılınca bildirim alacaksınız."

---

#### 7.5 Bekleme Listesi Onay
**Dosya:** `app/(public)/bekle/onayla/page.tsx`
**URL:** `/bekle/onayla?entry={id}&tenant={id}`

Email'deki link buraya gelir. Sayfa yüklenince otomatik API çağrısı yap:

```
GET /api/waitlist/confirm?entry={id}&tenant={id}
```
- 200 → "Randevunuz onaylandı!" + randevu detayını göster
- 410 → "Bu link süresi dolmuş (30 dakika)" mesajı

---

#### 7.6 Yasal Belgeler
**Dosya:** `app/(public)/sozlesmeler/[type]/page.tsx`
**URL:** `/sozlesmeler/KVKK`, `/sozlesmeler/PRIVACY_POLICY` vb.

```
GET /api/legal/{type}
→ { title, content (HTML), version }
```

`dangerouslySetInnerHTML` ile HTML içeriği göster (güvenli — admin tarafından yazılıyor).

---

### PANEL SAYFALARI (İşletme Sahibi)

---

#### 7.7 Panel Login
**Dosya:** `app/(panel)/panel/giris/page.tsx`
**URL:** `/panel/giris`

```tsx
signIn("credentials", { email, password, redirect: false })
```
Başarılı → `/panel`'e yönlendir.
Admin da buradan giriyor (backend role'e göre yönlendiriyor).

---

#### 7.8 Panel Dashboard
**Dosya:** `app/(panel)/panel/page.tsx`

```
GET /api/panel/dashboard
→ {
    today_count, week_count, month_count, total_count,
    status_breakdown: { CONFIRMED: n, CANCELLED: n, ... },
    upcoming: [ { id, customer_name, start_time, service, staff } ]  // bugünkü randevular
  }
```

**Widgets:**
- 4 sayaç kartı (bugün / bu hafta / bu ay / toplam)
- Durum dağılımı (pasta grafik veya progress bar)
- Bugünün randevuları listesi (timeline görünümü)

---

#### 7.9 Panel Randevular (Takvim)
**Dosya:** `app/(panel)/panel/randevular/page.tsx`

İki görünüm modu: **Takvim** ve **Liste**

**API:**
```
GET /api/panel/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD&status=CONFIRMED,PENDING&staffId=xxx
→ [{
    id, customer_name, customer_phone, customer_email,
    start_time, end_time, status, notes,
    service: { name }, staff: { full_name }
  }]
```

**Takvim:** `react-big-calendar` veya `@fullcalendar/react` kullan.
**Liste:** Tablo görünümü, tarih filtresi, personel filtresi.

**Her randevu kartında:**
- Müşteri adı, hizmet, personel
- Durum değiştirme dropdown (Onayla / Tamamlandı / İptal / Gelmedi)
- Yeniden zamanlama butonu
- Not ekleme

**Durum Değiştirme:**
```
PATCH /api/panel/appointments/{id}
Body: { status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" }
```

**Yeniden Zamanlama Modal:**
```
PATCH /api/panel/appointments/{id}
Body: { action: "reschedule", start_time: "ISO", end_time: "ISO" }
```

---

#### 7.10 Panel Personel
**Dosya:** `app/(panel)/panel/personel/page.tsx`

```
GET /api/panel/staff
→ [{ id, full_name, title, photo_url, is_active, work_hours, services: [{id, name}] }]
```

**Liste görünümü:** Fotoğraf + ad + unvan + aktif/pasif badge + düzenle butonu

**Personel Ekle/Düzenle Modal:**
```
POST /api/panel/staff
PATCH /api/panel/staff/{id}
Body: {
  full_name, title,
  work_hours: {
    mon: [{ start: "09:00", end: "18:00" }],
    tue: [...], wed: [...], thu: [...], fri: [...], sat: [], sun: []
  },
  service_ids: ["uuid1", "uuid2"]
}
```

**Çalışma Saatleri UI:**
Her gün için toggle (açık/kapalı) + saat aralığı seçici.

**Fotoğraf Yükleme:**
```
POST /api/panel/staff/{id}/photo
Content-Type: multipart/form-data
Body: file (JPG/PNG, max 4MB)
→ { photo_url: "https://res.cloudinary.com/..." }
```
Cloudinary URL'ini direkt `<img>` src'ye koy.

---

#### 7.11 Panel Hizmetler
**Dosya:** `app/(panel)/panel/hizmetler/page.tsx`

```
GET /api/panel/services
→ [{ id, name, description, duration_min, is_active, staff_count }]
```

**Hizmet Ekle/Düzenle Modal:**
```
POST /api/panel/services
PATCH /api/panel/services/{id}
Body: { name, description, duration_min }
```

duration_min için slider veya sayı input (15, 30, 45, 60, 90, 120 dakika seçenekleri).

---

#### 7.12 Panel Analitik
**Dosya:** `app/(panel)/panel/analitik/page.tsx`

```
GET /api/panel/analytics?period=7d|30d|90d|365d
→ {
    daily_appointments: [{ date, count }],
    status_breakdown: { CONFIRMED: n, ... },
    top_services: [{ name, count }],
    top_staff: [{ name, count }],
    peak_hours: [{ hour: 9, count: 12 }, ...]
  }
```

**Grafikler** (recharts veya chart.js önerilir):
- Çizgi grafik: günlük randevu sayısı
- Pasta/bar: durum dağılımı
- Bar: en çok tercih edilen hizmetler
- Bar: yoğun saatler (heat map gibi)

Period seçici: 7 gün / 30 gün / 90 gün / 1 yıl

---

#### 7.13 Panel Ayarlar

**Profil** — `app/(panel)/panel/ayarlar/page.tsx`
```
GET /api/panel/settings/profile
PATCH /api/panel/settings/profile
Body: { owner_name, owner_email } veya { current_password, new_password }
```

**Logo Yükle:**
```
POST /api/panel/settings/logo    (multipart/form-data, file field)
DELETE /api/panel/settings/logo
```

**Tema Düzenleyici:**
```
PATCH /api/panel/theme
Body: { primary_color, secondary_color, font, border_radius, tagline }
```
Canlı önizleme ile renk picker, font seçici, köşe yuvarlaklık slider.

**Kapalı Günler** — `app/(panel)/panel/ayarlar/kapali-gunler/page.tsx`
```
GET /api/panel/settings/closed-days
POST /api/panel/settings/closed-days
Body: { date: "YYYY-MM-DD", staff_id?: "uuid", reason?: "string" }
DELETE /api/panel/settings/closed-days/{id}
```
Takvim üzerinde kapalı günleri kırmızı göster.

**Webhook Yönetimi** — `app/(panel)/panel/ayarlar/webhooks/page.tsx`
```
GET /api/panel/settings/webhooks
POST /api/panel/settings/webhooks
Body: { url: "https://...", events: ["appointment.created", ...] }
PATCH /api/panel/settings/webhooks/{id}
DELETE /api/panel/settings/webhooks/{id}
```
Webhook events listesi checkbox'larla göster.

---

#### 7.14 Panel Destek
**Dosya:** `app/(panel)/panel/destek/page.tsx`

```
GET /api/panel/support
→ [{ id, subject, status, priority, created_at, message_count }]

POST /api/panel/support
Body: { subject, message }

GET /api/panel/support/{id}
→ { ticket, messages: [{ sender, content, created_at }] }

POST /api/panel/support/{id}
Body: { message }
```

**UI:** Ticket listesi sol panel, mesajlaşma sağ panel (WhatsApp benzeri).
Durum badge renkleri: OPEN=mavi, IN_PROGRESS=sarı, RESOLVED=yeşil, CLOSED=gri.

---

#### 7.15 Panel Abonelik
**Dosya:** `app/(panel)/panel/abonelik/page.tsx`

```
GET /api/panel/subscription
→ { plan: { name, features... }, status, starts_at, ends_at }

GET /api/panel/subscription/history
→ [{ id, plan_name, amount, status, starts_at, ends_at }]
```

Mevcut plan kartı + özellik listesi + ödeme geçmişi tablosu.

---

### ADMİN SAYFALARI (Platform Yönetimi)

> Admin sayfaları `/admin/...` altında. Sadece `PLATFORM_ADMIN` role'ü erişebilir.

---

#### 7.16 Admin Dashboard
```
GET /api/admin/stats
→ { total_tenants, active_tenants, total_appointments_today, revenue_this_month, ... }
```

---

#### 7.17 Admin Tenant Listesi
**Dosya:** `app/(admin)/admin/tenants/page.tsx`

```
GET /api/admin/tenants?page=1&limit=20&search=xxx&is_active=true
→ { data: [{...}], total, page }
```

Arama, filtre, sayfalama. Her satırda: aktif/pasif toggle, detay linki.

**Tenant Detay** — `/admin/tenants/{id}`
```
GET /api/admin/tenants/{id}
GET /api/admin/tenants/{id}/stats
GET /api/admin/tenants/{id}/subscriptions
PATCH /api/admin/tenants/{id}   Body: { is_active: false }
```

---

#### 7.18 Admin Plan Yönetimi
```
GET /api/admin/plans
POST /api/admin/plans
PATCH /api/admin/plans/{id}
DELETE /api/admin/plans/{id}
```

Plan özelliklerini checkbox + sayı input ile düzenle.

---

#### 7.19 Admin Destek Yönetimi
```
GET /api/admin/support?status=OPEN&priority=HIGH
GET /api/admin/support/{id}
POST /api/admin/support/{id}   Body: { message }
PATCH /api/admin/support/{id}  Body: { status, priority }
```

---

#### 7.20 Admin Hata Logları
```
GET /api/admin/error-logs?method=POST&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50
DELETE /api/admin/error-logs   Body: { older_than_days: 30 }
```

Stack trace expand/collapse ile tablo görünümü.

---

#### 7.21 Admin Kullanıcılar
```
GET /api/admin/users
POST /api/admin/users   Body: { email, password, full_name, role }
PATCH /api/admin/users/{id}
DELETE /api/admin/users/{id}
```
Roller: SUPER_ADMIN, SUPPORT, BILLING, VIEWER

---

## 8. Kullanıcı Akışları

### Akış 1: İlk Kez Randevu Alan Müşteri

```
1. ayse-kuafor.randevya.com → Landing page yüklenir
   → GET /api/tenant + /api/services + /api/staff

2. "Randevu Al" butonuna tıklar → /randevu

3. Adım 1: Hizmet listesi → GET /api/services → "Saç Kesim" seçer

4. Adım 2: Personel listesi → GET /api/staff?serviceId=xxx → "Ayşe" seçer

5. Adım 3: Takvim → 15 Nisan seçer

6. Adım 4: Slotlar → GET /api/slots?serviceId=xxx&date=2026-04-15&staffId=xxx
   → 10:00, 10:30, 11:00 gösterilir → 10:00 seçer

7. Adım 5: Form doldurur → "Ahmet Yılmaz", "0555...", "ahmet@mail.com"

8. Adım 6: POST /api/appointments
   → 201 Created → appointment_id: "abc123"
   → Onay mesajı gösterilir
   → Email + WhatsApp + SMS bildirimleri gider (arka planda)
```

### Akış 2: Müşteri Randevu İptal

```
1. Onay emailindeki link: /randevu/abc123?email=ahmet@mail.com

2. GET /api/appointments/abc123?email=ahmet@mail.com
   → Randevu detayı gösterilir

3. "İptal Et" butonuna tıklar

4. PATCH /api/appointments/abc123
   Body: { action: "cancel", email: "ahmet@mail.com" }
   → 200 OK → "Randevunuz iptal edildi"
   → Bekleme listesindeki bir sonraki kişiye otomatik bildirim gider
```

### Akış 3: İşletme Kaydı

```
1. randevya.com → Kayıt ol

2. GET /api/legal → yasal belgeler listesi

3. Formu doldur:
   { company_name, sector, owner_name, owner_email, password, domain_slug,
     consents: ["KVKK", "PRIVACY_POLICY", "TERMS_OF_USE", "DISTANCE_SALES"] }

4. POST /api/auth/register → 201 Created
   → { id, domain_slug, panel_url }

5. Panel URL'e yönlendir → /panel/giris
```

### Akış 4: İşletme Paneli — Yeni Personel + Hizmet Ekleme

```
1. /panel/giris → signIn("credentials", { email, password })

2. /panel → Dashboard yüklenir

3. /panel/personel → "Personel Ekle"
   POST /api/panel/staff
   → staff_id alır

4. /panel/hizmetler → "Hizmet Ekle"
   POST /api/panel/services
   → service_id alır

5. Personel düzenleme → "Bu kişi hangi hizmetleri verir" seçimi
   PATCH /api/panel/staff/{id}
   Body: { service_ids: ["service_id"] }

6. Artık müşteriler randevu alabilir.
```

### Akış 5: Müşteri Bekleme Listesi

```
1. Müşteri bir randevuyu seçmek ister ama doluysa:
   GET /api/slots → boş döner

2. "Bekleme listesine eklen" butonu göster → /bekle?appointmentId={id}

3. POST /api/waitlist
   Body: { appointment_id, customer_name, customer_phone, customer_email }
   → Sıra numarası gösterilir

4. Başka biri randevusunu iptal ederse:
   → Bekleme listesindeki ilk kişiye email/WA/SMS gider
   → Emaildeki link: /bekle/onayla?entry={id}&tenant={id}

5. Müşteri linke tıklar → GET /api/waitlist/confirm?entry={id}&tenant={id}
   → 30 dakika içinde onaylarsa randevu oluşturulur
   → Geç kalırsa → sıradaki kişiye geçer
```

---

## 9. API Referansı — Hızlı Bakış

### Public Endpoints (Header: `x-tenant-id: slug:{tenant_slug}`)

| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/tenant` | Tenant config + tema |
| GET | `/api/services` | Hizmet listesi |
| GET | `/api/services?staffId={id}` | Personele göre filtreli hizmetler |
| GET | `/api/staff` | Personel listesi |
| GET | `/api/staff?serviceId={id}` | Hizmete göre filtreli personel |
| GET | `/api/slots?serviceId=&date=&staffId=` | Müsait slotlar |
| POST | `/api/appointments` | Randevu oluştur |
| GET | `/api/appointments/{id}?email=` | Randevu detayı |
| PATCH | `/api/appointments/{id}` | Müşteri iptal |
| POST | `/api/waitlist` | Bekleme listesine ekle |
| GET | `/api/waitlist/confirm?entry=&tenant=` | Bekleme onayı |
| GET | `/api/legal` | Yasal belgeler meta listesi |
| GET | `/api/legal/{type}` | Yasal belge içeriği |
| POST | `/api/auth/register` | Yeni işletme kaydı |

### Panel Endpoints (Cookie session gerekli: TENANT_OWNER)

| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/panel/dashboard` | İstatistik özeti |
| GET | `/api/panel/analytics?period=7d` | Detaylı analitik |
| GET | `/api/panel/appointments` | Randevu listesi |
| PATCH | `/api/panel/appointments/{id}` | Durum/reschedule/not |
| GET/POST | `/api/panel/staff` | Personel listesi/ekle |
| PATCH/DELETE | `/api/panel/staff/{id}` | Personel güncelle/sil |
| POST/DELETE | `/api/panel/staff/{id}/photo` | Personel fotoğrafı |
| GET/POST | `/api/panel/services` | Hizmet listesi/ekle |
| PATCH/DELETE | `/api/panel/services/{id}` | Hizmet güncelle/sil |
| GET/PATCH | `/api/panel/settings/profile` | Profil |
| POST/DELETE | `/api/panel/settings/logo` | Logo |
| PATCH | `/api/panel/theme` | Tema |
| GET/POST/DELETE | `/api/panel/settings/closed-days` | Kapalı günler |
| GET/POST | `/api/panel/settings/webhooks` | Webhook listesi/ekle |
| PATCH/DELETE | `/api/panel/settings/webhooks/{id}` | Webhook güncelle/sil |
| GET | `/api/panel/subscription` | Mevcut abonelik |
| GET | `/api/panel/subscription/history` | Ödeme geçmişi |
| GET/POST | `/api/panel/support` | Destek talepleri |
| GET/POST | `/api/panel/support/{id}` | Talep detayı/yanıt |
| GET | `/api/panel/settings/consents` | Sözleşme geçmişi |

### Admin Endpoints (Cookie session gerekli: PLATFORM_ADMIN)

| Method | URL | Açıklama |
|--------|-----|----------|
| GET/PATCH | `/api/admin/tenants` | Tenant listesi |
| GET/PATCH | `/api/admin/tenants/{id}` | Tenant detay |
| GET | `/api/admin/tenants/{id}/stats` | Tenant istatistikleri |
| GET | `/api/admin/tenants/{id}/subscriptions` | Ödeme geçmişi |
| GET/POST | `/api/admin/plans` | Plan yönetimi |
| GET/PATCH/DELETE | `/api/admin/plans/{id}` | Plan detay |
| POST | `/api/admin/subscriptions/{id}/refund` | PayTR iadesi |
| GET/DELETE | `/api/admin/error-logs` | Hata logları |
| GET/POST | `/api/admin/users` | Admin kullanıcılar |
| PATCH/DELETE | `/api/admin/users/{id}` | Admin kullanıcı güncelle |
| GET/PATCH | `/api/admin/support` | Destek talepleri |
| GET/POST/PATCH | `/api/admin/support/{id}` | Talep detay/yanıt |
| GET/POST | `/api/admin/legal` | Yasal belgeler |
| GET/PATCH | `/api/admin/legal/{id}` | Belge detay |

### API Yanıt Formatı
Tüm endpoint'ler aynı formatı döner:
```typescript
// Başarılı
{ success: true, data: T }

// Hata
{ success: false, error: "Hata mesajı", code?: "HATA_KODU" }
```

### Önemli Hata Kodları
```
SLOT_TAKEN          → Seçilen slot doldu (409) — kullanıcıyı step 4'e döndür
RATE_LIMIT_EXCEEDED → Çok fazla istek (429) — birkaç saniye bekle
CONSENTS_INCOMPLETE → Tüm sözleşmeler onaylanmamış (400)
SLUG_TAKEN          → Domain slug kullanımda (409)
EMAIL_TAKEN         → Email kayıtlı (409)
```

---

## 10. Test Bilgileri

```
Sunucu: http://localhost:3003
npm run dev  →  http://localhost:3003

Test Tenant 1:
  Slug: test-kuafor
  Panel Giriş: test@elit-kuafor.com / test1234
  URL: http://localhost:3003 (x-tenant-id: slug:test-kuafor header'ı ekle)

Test Tenant 2:
  Slug: test-klinik
  Panel Giriş: test@drmehmetkara.com / test1234

Platform Admin:
  Email: tmkmuhendislik@gmail.com
  Şifre: Mehmet+123
```

### Postman
`postman/` klasöründe hazır collection ve environment var.
Import et, `base_url=http://localhost:3003`, `tenant_slug=test-kuafor` yap.

---

## 11. Önemli Kurallar

### 1. Backend'e Dokunma
`app/api/`, `lib/`, `prisma/` klasörlerine dokunma. Sadece `app/(public)/`, `app/(panel)/`, `app/(admin)/` altında çalış.

### 2. Shared Types Kullan
`/types` klasöründeki tipleri import et, kendini tip yazma:
```typescript
import type { Appointment, Staff, Service, TimeSlot } from "@/types"
```

### 3. Server Component'ten API Çağrısı
```typescript
// Server Component'te fetch
const res = await fetch(`${process.env.NEXTAUTH_URL}/api/panel/dashboard`, {
  headers: { cookie: (await headers()).get("cookie") ?? "" },
  cache: "no-store",
})
```

### 4. Client Component'ten API Çağrısı
```typescript
"use client"
// Relative URL kullan — cookie otomatik gönderilir
const res = await fetch("/api/panel/staff")
const data = await res.json()
```

### 5. Tailwind v4
`tailwind.config.js` yok. Özel değerler için `globals.css`'te `@theme` direktifi kullan:
```css
@import "tailwindcss";

@theme {
  --color-primary: #2a5cff;
  --font-display: "Inter", sans-serif;
}
```

### 6. Görsel Kütüphaneler (Önerilen)
```
recharts          → grafikler (analitik sayfası)
react-big-calendar → takvim (randevular sayfası)
react-hot-toast    → bildirimler/toast
lucide-react       → ikonlar
date-fns           → tarih formatlama (tr locale)
```

### 7. Bildirim Gösterme
API hataları için toast kullan:
```typescript
import toast from "react-hot-toast"

if (!res.ok) {
  const err = await res.json()
  toast.error(err.error ?? "Bir hata oluştu")
}
```

### 8. Yükleme Durumları
Her form submit'te loading state kullan, butonu disable et. Rate limit 429 gelirse "X saniye sonra tekrar deneyin" mesajı göster.

### 9. Mobile First
Tüm sayfalar mobil uyumlu olmalı. Panel sidebar mobilde drawer'a dönüşmeli.

### 10. Panel Sidebar Navigasyonu
```
Panel Menüsü:
  📊 Dashboard         /panel
  📅 Randevular        /panel/randevular
  👤 Personel          /panel/personel
  🛎 Hizmetler         /panel/hizmetler
  📈 Analitik          /panel/analitik
  🎫 Destek            /panel/destek
  💳 Abonelik          /panel/abonelik
  ⚙️ Ayarlar           /panel/ayarlar

Admin Menüsü:
  🏢 Tenantlar         /admin/tenants
  📦 Planlar           /admin/planlar
  🎫 Destek            /admin/destek
  👥 Kullanıcılar      /admin/kullanicilar
  🔍 Hata Logları      /admin/hata-loglari
  📜 Yasal Belgeler    /admin/yasal
```
