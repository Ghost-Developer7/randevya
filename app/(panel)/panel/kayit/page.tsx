"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Logo from "@/components/ui/Logo"

const sectors = [
  "Kuaför / Berber",
  "Güzellik Salonu",
  "Klinik / Sağlık",
  "Diş Hekimi",
  "Fizyoterapi",
  "Veteriner",
  "Dövme / Piercing",
  "Danışmanlık",
  "Eğitim / Kurs",
  "Spor / Fitness",
  "Diğer",
]

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Step 1 - Business info
  const [companyName, setCompanyName] = useState("")
  const [sector, setSector] = useState("")

  // Step 2 - Owner info
  const [ownerFirstName, setOwnerFirstName] = useState("")
  const [ownerLastName, setOwnerLastName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")

  // Step 3 - Consents
  const [consents, setConsents] = useState({
    KVKK: false,
    PRIVACY_POLICY: false,
    TERMS_OF_USE: false,
    DISTANCE_SALES: false,
  })

  const toggleConsent = (key: keyof typeof consents) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const allConsentsAccepted = Object.values(consents).every(Boolean)

  const handleSubmit = async () => {
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor")
      return
    }
    if (!allConsentsAccepted) {
      setError("Tüm sozlesmeleri onaylamanız gerekiyor")
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          sector,
          domain_slug: companyName.toLowerCase().replace(/ş/g,"s").replace(/ç/g,"c").replace(/ö/g,"o").replace(/ü/g,"u").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/İ/g,"i").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").trim() || "isletme",
          owner_name: `${ownerFirstName} ${ownerLastName}`,
          owner_email: ownerEmail,
          password,
          consents: Object.keys(consents).filter(
            (k) => consents[k as keyof typeof consents]
          ),
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push("/panel/giris?registered=true")
      } else {
        setError(data.error || "Kayıt sırasında bir hata oluştu")
        if (data.code === "EMAIL_TAKEN") {
          setStep(1)
        }
      }
    } catch {
      setError("Bir hata olustu. Lutfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding + pricing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2a5cff] to-[#1a3fcc] relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full overflow-y-auto">
          <Logo size="lg" invertText />

          <div className="my-8">
            <h2 className="text-3xl font-bold leading-tight mb-2">
              İşletmenize uygun planı seçin
            </h2>
            <p className="text-blue-200 text-sm mb-6">Kayıt sonrası 14 gün tüm özellikler ücretsiz.</p>

            {/* Pricing cards */}
            <div className="space-y-3">
              {/* Deneme */}
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base">Deneme</h3>
                  <div className="text-right">
                    <span className="text-lg font-bold">14 Gün</span>
                    <p className="text-[10px] text-blue-200">ücretsiz deneme</p>
                  </div>
                </div>
                <p className="text-xs text-blue-100">Giriş paketinin tüm özellikleri 14 gün ücretsiz.</p>
              </div>

              {/* Pro */}
              <div className="p-4 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 ring-1 ring-white/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">Giriş</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">299 ₺</span>
                    <span className="text-xs text-blue-200">/ay</span>
                  </div>
                </div>
                <div className="flex justify-end mb-2">
                  <span className="text-[11px] text-emerald-300">Yıllık öde <span className="font-bold line-through text-white/40">299 ₺</span> → <span className="font-bold">239 ₺</span>/ay <span className="bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-1">%20</span></span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-100">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    5 personel
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    E-posta bildirimi
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    E-posta destek
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    7/24 destek
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Basit analitik rapor
                  </span>
                </div>
              </div>

              {/* Enterprise */}
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base">Profesyonel</h3>
                  <div className="text-right">
                    <span className="text-lg font-bold">599 ₺</span>
                    <span className="text-xs text-blue-200">/ay</span>
                  </div>
                </div>
                <div className="flex justify-end mb-2">
                  <span className="text-[11px] text-emerald-300">Yıllık öde <span className="font-bold line-through text-white/40">599 ₺</span> → <span className="font-bold">479 ₺</span>/ay <span className="bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-1">%20</span></span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-100">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Sınırsız personel
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Sınırsız hizmet
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    WhatsApp bildirim
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Özel alan adı
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    7/24 öncelikli destek
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    WhatsApp destek
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Tam analitik & rapor
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-blue-200/60 mt-4 text-center">
              Plan seçimi kayıt sonrası yapılır. İlk 14 gün Giriş paketi ücretsiz açıktır.
            </p>
          </div>

          <p className="text-sm text-blue-200">
            &copy; 2026 Randevya. Tüm hakları saklıdır.
          </p>
        </div>
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-white/5" />
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold text-zinc-900">
            İşletme Kaydı
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Adım {step}/3 —{" "}
            {step === 1
              ? "İşletme Bilgileri"
              : step === 2
                ? "Kişisel Bilgiler"
                : "Sözleşmeler"}
          </p>

          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step
                    ? "bg-[#2a5cff]"
                    : "bg-zinc-200"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="mt-6 space-y-5">
              <Input
                label="İşletme Adı"
                placeholder="Örnek Kuaför Salonu"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />

              <div className="w-full">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Sektor
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                  required
                >
                  <option value="">Sektör seçin...</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <Input
                label="E-posta"
                type="email"
                placeholder="ornek@isletme.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
              />

              <Button
                fullWidth
                size="lg"
                onClick={() => {
                  if (companyName && sector && ownerEmail) {
                    setError("")
                    setStep(2)
                  }
                }}
              >
                Devam Et
              </Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ad"
                  placeholder="Ayşe"
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Soyad"
                  placeholder="Yılmaz"
                  value={ownerLastName}
                  onChange={(e) => setOwnerLastName(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Şifre"
                type="password"
                placeholder="En az 8 karakter, boşluk hariç"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
                error={password && password.length < 8 ? "En az 8 karakter olmalı" : undefined}
                required
              />

              <Input
                label="Şifre Tekrar"
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value.replace(/\s/g, ""))}
                error={passwordConfirm && password !== passwordConfirm ? "Şifreler eşleşmiyor" : undefined}
                required
              />

              <div className="flex gap-3">
                <Button variant="outline" fullWidth size="lg" onClick={() => setStep(1)}>
                  Geri
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => {
                    if (ownerFirstName && ownerLastName && password.length >= 8 && password === passwordConfirm) {
                      setError("")
                      setStep(3)
                    }
                  }}
                >
                  Devam Et
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="mt-6 space-y-5">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={consents.KVKK && consents.PRIVACY_POLICY && consents.TERMS_OF_USE && consents.DISTANCE_SALES}
                  onChange={() => {
                    const allChecked = consents.KVKK && consents.PRIVACY_POLICY && consents.TERMS_OF_USE && consents.DISTANCE_SALES
                    const val = !allChecked
                    setConsents({ KVKK: val, PRIVACY_POLICY: val, TERMS_OF_USE: val, DISTANCE_SALES: val })
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-[#2a5cff] focus:ring-[#2a5cff]"
                />
                <span className="text-sm text-zinc-700 leading-relaxed">
                  <Link href="/sozlesmeler/KVKK" target="_blank" className="text-[#2a5cff] hover:underline">KVKK Aydınlatma Metni</Link>,{" "}
                  <Link href="/sozlesmeler/PRIVACY_POLICY" target="_blank" className="text-[#2a5cff] hover:underline">Gizlilik Politikası</Link>,{" "}
                  <Link href="/sozlesmeler/TERMS_OF_USE" target="_blank" className="text-[#2a5cff] hover:underline">Kullanım Koşulları</Link> ve{" "}
                  <Link href="/sozlesmeler/DISTANCE_SALES" target="_blank" className="text-[#2a5cff] hover:underline">Mesafeli Satış Sözleşmesi</Link>&apos;ni okudum ve kabul ediyorum.
                </span>
              </label>

              <div className="flex gap-3">
                <Button variant="outline" fullWidth size="lg" onClick={() => setStep(2)}>
                  Geri
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  loading={loading}
                  disabled={!allConsentsAccepted}
                  onClick={handleSubmit}
                >
                  Kayıt Ol
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600">
              Zaten hesabınız var mı?{" "}
              <Link
                href="/panel/giris"
                className="text-[#2a5cff] font-medium hover:underline"
              >
                Giriş Yap
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              &larr; Ana sayfaya don
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
