# Acil Düzenleme Listesi

Satış sonrası öncelikli düzeltilecek sorunlar.

---

## 1. Double Booking (Çift Rezervasyon) — KRİTİK

**Sorun:** İki kişi aynı anda aynı slotu seçerse ikisi de onaylanabilir. Kontrol (`isSlotAvailable`) ile kayıt (`create`) arasında atomik koruma yok, veritabanında da kısıt yok.

**Etkilenen dosyalar:**
- `lib/slots.ts` — `isSlotAvailable()` fonksiyonu
- `app/api/appointments/route.ts` — public booking POST
- `app/api/panel/appointments/route.ts` — panel booking POST
- `prisma/schema.prisma` — Appointment modelinde unique index eksik

**Yapılacak:**
- `prisma/schema.prisma` Appointment modeline index ekle
- Check + insert işlemini `prisma.$transaction()` içine al

---

## 2. Appointment PATCH'te Tenant Filtresi Eksik — YÜKSEK

**Sorun:** Panel'de randevu güncellerken WHERE koşulu sadece `id` kullanıyor, `tenant_id` kontrolü yok. Yetkili bir kullanıcı başka işletmenin randevu UUID'sini bilirse güncelleyebilir.

**Etkilenen dosyalar:**
- `app/api/panel/appointments/[id]/route.ts` — PATCH handler içindeki `update({ where: { id } })` satırları

**Yapılacak:**
- Tüm `update` ve `delete` sorgularına `where: { id, tenant_id: tenantId }` ekle

---

## 3. Staff / Service / Photo Route'larında findUnique Tenant Filtresi Eksik — ORTA

**Sorun:** Kayıt önce ID ile çekiliyor, sonra tenant kontrolü yapılıyor. Atomik değil.

**Etkilenen dosyalar:**
- `app/api/panel/staff/[id]/route.ts`
- `app/api/panel/services/[id]/route.ts`
- `app/api/panel/staff/[id]/photo/route.ts`

**Yapılacak:**
- `findUnique({ where: { id } })` → `findFirst({ where: { id, tenant_id: tenantId } })` olarak değiştir

---

## Zaten Düzeltildi (referans için)

- Timezone hatası: randevular yanlış saatte kaydediliyordu → `lib/slots.ts`, `lib/email.ts`, `lib/whatsapp.ts`, dashboard, analytics, closed-days düzeltildi
