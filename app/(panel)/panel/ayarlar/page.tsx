"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"

// ─── TABS ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: "profil", label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "isletme", label: "İşletme", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { id: "tema", label: "Tema", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  { id: "bildirim", label: "Bildirimler", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { id: "calisma", label: "Çalışma Saatleri", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "abonelik", label: "Abonelik", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
]

const FONTS = ["Inter", "Poppins", "Roboto", "Nunito", "Montserrat", "Open Sans"]
const RADIUS_OPTIONS = ["4px", "8px", "12px", "16px", "20px"]

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState("profil")
  const [saved, setSaved] = useState(false)

  // Profile
  const [ownerName, setOwnerName] = useState("Gökhan Mülayim")
  const [ownerEmail, setOwnerEmail] = useState("gkhnmlym@gmail.com")
  const [ownerPhone, setOwnerPhone] = useState("0532 123 45 67")

  // Business
  const [companyName, setCompanyName] = useState("Elit Kuaför")
  const [sector, setSector] = useState("Kuaför / Berber")
  const [address, setAddress] = useState("Atatürk Cad. No:42, Kadıköy/İstanbul")
  const [description, setDescription] = useState("2015'ten beri profesyonel kuaför hizmeti sunmaktayız.")

  // Theme
  const [primaryColor, setPrimaryColor] = useState("#2a5cff")
  const [secondaryColor, setSecondaryColor] = useState("#ff4d2e")
  const [font, setFont] = useState("Inter")
  const [borderRadius, setBorderRadius] = useState("12px")
  const [tagline, setTagline] = useState("Saçlarınız için en iyi bakım")

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true)
  const [whatsappNotif, setWhatsappNotif] = useState(true)
  const [reminderHours, setReminderHours] = useState(24)

  // Working hours
  const [workHours, setWorkHours] = useState({
    mon: { active: true, start: "09:00", end: "18:00" },
    tue: { active: true, start: "09:00", end: "18:00" },
    wed: { active: true, start: "09:00", end: "18:00" },
    thu: { active: true, start: "09:00", end: "18:00" },
    fri: { active: true, start: "09:00", end: "18:00" },
    sat: { active: true, start: "10:00", end: "16:00" },
    sun: { active: false, start: "09:00", end: "18:00" },
  })

  const DAY_LABELS: Record<string, string> = {
    mon: "Pazartesi", tue: "Salı", wed: "Çarşamba", thu: "Perşembe",
    fri: "Cuma", sat: "Cumartesi", sun: "Pazar",
  }

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Ayarlar</h1>
        <p className="text-sm text-zinc-500 mt-0.5">İşletme ve hesap ayarlarınızı yönetin</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-[#2a5cff]/10 text-[#2a5cff]"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                </svg>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ── Profil ── */}
          {tab === "profil" && (
            <Card>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">Profil Bilgileri</h2>
              <p className="text-xs text-zinc-400 mb-5">Hesap sahibi bilgilerini güncelleyin</p>
              <div className="space-y-4 max-w-lg">
                <Input label="Ad Soyad" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                <Input label="E-posta" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                <Input label="Telefon" type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
                <div className="pt-2">
                  <Button onClick={save}>{saved ? "Kaydedildi ✓" : "Kaydet"}</Button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 max-w-lg">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Şifre Değiştir</h3>
                <div className="space-y-3">
                  <Input label="Mevcut Şifre" type="password" placeholder="Mevcut şifreniz" />
                  <Input label="Yeni Şifre" type="password" placeholder="En az 8 karakter" />
                  <Input label="Yeni Şifre Tekrar" type="password" placeholder="Yeni şifrenizi tekrar girin" />
                  <Button variant="outline">Şifreyi Değiştir</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── İşletme ── */}
          {tab === "isletme" && (
            <Card>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">İşletme Bilgileri</h2>
              <p className="text-xs text-zinc-400 mb-5">İşletmenizin genel bilgilerini düzenleyin</p>
              <div className="space-y-4 max-w-lg">
                <Input label="İşletme Adı" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Sektör</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                  >
                    {["Kuaför / Berber", "Güzellik Salonu", "Klinik / Sağlık", "Diş Hekimi", "Fizyoterapi", "Veteriner", "Danışmanlık", "Spor / Fitness", "Diğer"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <Input label="Adres" value={address} onChange={(e) => setAddress(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Açıklama</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a5cff] resize-none"
                  />
                </div>

                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2a5cff] to-[#6366f1] flex items-center justify-center text-white text-xl font-bold">
                      {companyName.charAt(0)}
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Logo Yükle</Button>
                      <p className="text-xs text-zinc-400 mt-1">PNG, JPG — Maks 4MB</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={save}>{saved ? "Kaydedildi ✓" : "Kaydet"}</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Tema ── */}
          {tab === "tema" && (
            <Card>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">Tema Ayarları</h2>
              <p className="text-xs text-zinc-400 mb-5">Müşterilerinizin gördüğü sayfanın görünümünü özelleştirin</p>
              <div className="space-y-5 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ana Renk</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-zinc-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-300 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">İkincil Renk</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-zinc-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Font</label>
                  <div className="flex flex-wrap gap-2">
                    {FONTS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFont(f)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          font === f ? "bg-[#2a5cff] text-white border-[#2a5cff]" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        }`}
                        style={{ fontFamily: f }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Köşe Yuvarlaklığı</label>
                  <div className="flex gap-2">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setBorderRadius(r)}
                        className={`w-12 h-12 border-2 transition-colors flex items-center justify-center text-xs font-mono ${
                          borderRadius === r ? "border-[#2a5cff] text-[#2a5cff] bg-blue-50" : "border-zinc-200 text-zinc-400"
                        }`}
                        style={{ borderRadius: r }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} hint="Müşteri sayfanızda görünecek slogan" />

                {/* Preview */}
                <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50">
                  <p className="text-xs text-zinc-400 mb-3">Önizleme</p>
                  <div className="p-4 bg-white rounded-xl" style={{ fontFamily: font, borderRadius }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: primaryColor, borderRadius }}>
                        {companyName.charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{companyName}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{tagline}</p>
                    <button className="mt-3 px-4 py-1.5 text-xs text-white font-medium" style={{ background: primaryColor, borderRadius }}>
                      Randevu Al
                    </button>
                  </div>
                </div>

                <Button onClick={save}>{saved ? "Kaydedildi ✓" : "Temayı Kaydet"}</Button>
              </div>
            </Card>
          )}

          {/* ── Bildirimler ── */}
          {tab === "bildirim" && (
            <Card>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">Bildirim Ayarları</h2>
              <p className="text-xs text-zinc-400 mb-5">Müşterilerinize gönderilecek bildirimleri yönetin</p>
              <div className="space-y-4 max-w-lg">
                {[
                  { label: "E-posta Bildirimleri", desc: "Randevu onay, iptal ve hatırlatma e-postaları", checked: emailNotif, onChange: () => setEmailNotif(!emailNotif) },
                  { label: "WhatsApp Bildirimleri", desc: "WhatsApp üzerinden anlık bildirimler", checked: whatsappNotif, onChange: () => setWhatsappNotif(!whatsappNotif) },
                ].map((item) => (
                  <label key={item.label} className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={item.onChange}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-[#2a5cff] focus:ring-[#2a5cff]"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Hatırlatma Süresi</label>
                  <select
                    value={reminderHours}
                    onChange={(e) => setReminderHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                  >
                    <option value={1}>1 saat önce</option>
                    <option value={2}>2 saat önce</option>
                    <option value={6}>6 saat önce</option>
                    <option value={12}>12 saat önce</option>
                    <option value={24}>24 saat önce (1 gün)</option>
                    <option value={48}>48 saat önce (2 gün)</option>
                  </select>
                  <p className="text-xs text-zinc-400 mt-1">Randevudan kaç saat önce hatırlatma gönderilsin</p>
                </div>

                <div className="pt-2">
                  <Button onClick={save}>{saved ? "Kaydedildi ✓" : "Kaydet"}</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Çalışma Saatleri ── */}
          {tab === "calisma" && (
            <Card>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">Çalışma Saatleri</h2>
              <p className="text-xs text-zinc-400 mb-5">İşletmenizin genel açılış/kapanış saatlerini belirleyin</p>
              <div className="space-y-2 max-w-lg">
                {Object.entries(workHours).map(([day, wh]) => (
                  <div key={day} className="flex items-center gap-3 py-2">
                    <button
                      onClick={() => setWorkHours((prev) => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], active: !wh.active } }))}
                      className={`w-24 text-left text-sm font-medium py-2 px-3 rounded-xl transition-colors ${
                        wh.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                    {wh.active ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={wh.start}
                          onChange={(e) => setWorkHours((prev) => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], start: e.target.value } }))}
                          className="px-3 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#2a5cff]"
                        />
                        <span className="text-zinc-400">—</span>
                        <input
                          type="time"
                          value={wh.end}
                          onChange={(e) => setWorkHours((prev) => ({ ...prev, [day]: { ...prev[day as keyof typeof prev], end: e.target.value } }))}
                          className="px-3 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#2a5cff]"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-300">Kapalı</span>
                    )}
                  </div>
                ))}
                <div className="pt-4">
                  <Button onClick={save}>{saved ? "Kaydedildi ✓" : "Kaydet"}</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Abonelik ── */}
          {tab === "abonelik" && (
            <SubscriptionTab />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SUBSCRIPTION TAB ───────────────────────────────────────────────────────

function SubscriptionTab() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [currentPlan, setCurrentPlan] = useState("giris")
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<"confirm" | "payment" | "processing" | "success" | null>(null)
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")

  const tick = (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
  const cross = (
    <svg className="w-4 h-4 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )

  const plans = [
    {
      id: "deneme",
      name: "Deneme",
      desc: "Giriş paketini 14 gün ücretsiz deneyin",
      monthly: 0,
      yearly: 0,
      isFree: true,
      features: [
        { text: "Giriş paketi özellikleri", has: true },
        { text: "14 gün süre limiti", has: true },
      ],
    },
    {
      id: "giris",
      name: "Giriş",
      desc: "Küçük işletmeler için temel paket",
      monthly: 299,
      yearly: 239,
      isFree: false,
      features: [
        { text: "5 personel", has: true },
        { text: "Sınırsız hizmet", has: true },
        { text: "E-posta bildirimi", has: true },
        { text: "E-posta destek", has: true },
        { text: "7/24 destek", has: true },
        { text: "Basit analitik rapor", has: true },
        { text: "WhatsApp bildirim", has: false },
        { text: "Özel alan adı", has: false },
      ],
    },
    {
      id: "profesyonel",
      name: "Profesyonel",
      desc: "Büyüyen işletmeler için gelişmiş özellikler",
      monthly: 599,
      yearly: 479,
      isFree: false,
      highlighted: true,
      features: [
        { text: "Sınırsız personel", has: true },
        { text: "Sınırsız hizmet", has: true },
        { text: "WhatsApp bildirim", has: true },
        { text: "Özel alan adı", has: true },
        { text: "7/24 öncelikli destek", has: true },
        { text: "WhatsApp destek", has: true },
        { text: "Tam analitik & rapor", has: true },
        { text: "Webhook & API", has: true },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[#2a5cff] to-[#6366f1] text-white">
          <div>
            <p className="text-xs text-blue-200 font-medium">Mevcut Planınız</p>
            <p className="text-xl font-bold mt-0.5">Giriş — 299 ₺/ay</p>
            <p className="text-xs text-blue-200 mt-1">Sonraki yenileme: 10 Mayıs 2026</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">Aktif</span>
          </div>
        </div>
      </Card>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${billing === "monthly" ? "text-zinc-900" : "text-zinc-400"}`}>Aylık</span>
        <button
          onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
          className={`relative w-14 h-7 rounded-full transition-colors ${billing === "yearly" ? "bg-[#2a5cff]" : "bg-zinc-300"}`}
        >
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${billing === "yearly" ? "translate-x-7" : "translate-x-0.5"}`} />
        </button>
        <span className={`text-sm font-medium ${billing === "yearly" ? "text-zinc-900" : "text-zinc-400"}`}>
          Yıllık
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">%20</span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const price = billing === "yearly" ? plan.yearly : plan.monthly

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-5 transition-all ${
                plan.highlighted
                  ? "border-[#2a5cff] shadow-lg shadow-blue-500/10"
                  : isCurrent
                    ? "border-emerald-300 bg-emerald-50/30"
                    : "border-zinc-200"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2a5cff] text-white text-[10px] font-bold rounded-full uppercase">
                  Önerilen
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">Mevcut</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                {plan.isFree ? (
                  <div>
                    <span className="text-3xl font-extrabold text-zinc-900">Ücretsiz</span>
                    <p className="text-xs text-zinc-400 mt-0.5">14 gün</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-zinc-900">{price} ₺</span>
                      <span className="text-sm text-zinc-400">/ay</span>
                    </div>
                    {billing === "yearly" && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        <span className="line-through text-zinc-400 mr-1">{plan.monthly} ₺</span>
                        Yıllık ödeme ile {plan.monthly - plan.yearly} ₺ tasarruf
                      </p>
                    )}
                    {billing === "yearly" && (
                      <p className="text-xs text-zinc-400 mt-0.5">Yıllık toplam: {price * 12} ₺</p>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2.5 mb-5">
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2">
                    {f.has ? tick : cross}
                    <span className={`text-xs ${f.has ? "text-zinc-700" : "text-zinc-400"}`}>{f.text}</span>
                  </div>
                ))}
              </div>

              {/* Action */}
              {isCurrent ? (
                <div className="w-full py-2.5 text-center text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl">
                  Mevcut Planınız
                </div>
              ) : plan.isFree ? (
                <div className="w-full py-2.5 text-center text-sm font-medium text-zinc-400 bg-zinc-50 rounded-xl">
                  Deneme süresi doldu
                </div>
              ) : (
                <button
                  onClick={() => setConfirmPlan(plan.id)}
                  className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    plan.highlighted
                      ? "bg-[#2a5cff] text-white hover:opacity-90 shadow-md shadow-blue-500/20"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  {plan.monthly > (plans.find((p) => p.id === currentPlan)?.monthly || 0) ? "Yükselt" : "Geçiş Yap"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment History */}
      <Card>
        <h2 className="text-sm font-bold text-zinc-900 mb-4">Ödeme Geçmişi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400 uppercase tracking-wide">
                <th className="text-left py-2 font-medium">Tarih</th>
                <th className="text-left py-2 font-medium">Plan</th>
                <th className="text-left py-2 font-medium">Dönem</th>
                <th className="text-right py-2 font-medium">Tutar</th>
                <th className="text-right py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: "10 Nis 2026", plan: "Giriş", period: "Aylık", amount: "299 ₺", status: "Ödendi" },
                { date: "10 Mar 2026", plan: "Giriş", period: "Aylık", amount: "299 ₺", status: "Ödendi" },
                { date: "10 Şub 2026", plan: "Giriş", period: "Aylık", amount: "299 ₺", status: "Ödendi" },
                { date: "10 Oca 2026", plan: "Giriş", period: "Aylık", amount: "299 ₺", status: "Ödendi" },
                { date: "27 Ara 2025", plan: "Deneme", period: "14 gün", amount: "0 ₺", status: "Ücretsiz" },
              ].map((p, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  <td className="py-2.5 text-zinc-900">{p.date}</td>
                  <td className="py-2.5 text-zinc-600">{p.plan}</td>
                  <td className="py-2.5 text-zinc-400">{p.period}</td>
                  <td className="py-2.5 text-right font-semibold text-zinc-900">{p.amount}</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === "Ödendi" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Modal */}
      {confirmPlan && (() => {
        const selectedPlan = plans.find((p) => p.id === confirmPlan)
        if (!selectedPlan) return null
        const price = billing === "yearly" ? selectedPlan.yearly : selectedPlan.monthly
        const totalYearly = billing === "yearly" ? price * 12 : price

        const closeModal = () => { setConfirmPlan(null); setPaymentStep(null); setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvv("") }

        const startPayment = () => setPaymentStep("payment")

        const processPayment = () => {
          setPaymentStep("processing")
          // TODO: Gerçek PayTR API entegrasyonu
          // POST /api/panel/subscription/upgrade { plan_id, billing_period, card_token }
          setTimeout(() => {
            setPaymentStep("success")
            setCurrentPlan(confirmPlan)
          }, 2500)
        }

        const formatCardNumber = (val: string) => {
          const nums = val.replace(/\D/g, "").slice(0, 16)
          return nums.replace(/(\d{4})(?=\d)/g, "$1 ")
        }

        const formatExpiry = (val: string) => {
          const nums = val.replace(/\D/g, "").slice(0, 4)
          if (nums.length >= 3) return nums.slice(0, 2) + "/" + nums.slice(2)
          return nums
        }

        return (
          <Modal open={true} onClose={closeModal} title={
            paymentStep === "success" ? "Ödeme Başarılı" :
            paymentStep === "processing" ? "Ödeme İşleniyor" :
            paymentStep === "payment" ? "Ödeme Bilgileri" :
            "Plan Yükseltme"
          }>
            {/* Step 1: Confirm */}
            {(!paymentStep || paymentStep === "confirm") && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#2a5cff]/5 to-[#6366f1]/5 border border-[#2a5cff]/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-zinc-900">{selectedPlan.name}</h3>
                    <span className="text-lg font-extrabold text-[#2a5cff]">{price} ₺<span className="text-xs text-zinc-400 font-normal">/ay</span></span>
                  </div>
                  <div className="text-xs text-zinc-500 space-y-0.5">
                    <p>Ödeme tipi: <strong className="text-zinc-700">{billing === "yearly" ? "Yıllık" : "Aylık"}</strong></p>
                    {billing === "yearly" && <p>Yıllık toplam: <strong className="text-zinc-700">{totalYearly} ₺</strong></p>}
                    {billing === "yearly" && <p className="text-emerald-600">%20 indirim uygulanmış fiyat</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedPlan.features.filter((f) => f.has).slice(0, 5).map((f) => (
                    <div key={f.text} className="flex items-center gap-2 text-xs text-zinc-600">
                      {tick}
                      {f.text}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" fullWidth onClick={closeModal}>Vazgeç</Button>
                  <Button fullWidth onClick={startPayment}>Ödemeye Geç</Button>
                </div>
              </div>
            )}

            {/* Step 2: PayTR Payment Form */}
            {paymentStep === "payment" && (
              <div className="space-y-4">
                {/* PayTR badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">Pay</span>
                    </div>
                    <span className="text-xs text-zinc-400">PayTR Güvenli Ödeme</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] text-emerald-600 font-medium">256-bit SSL</span>
                  </div>
                </div>

                {/* Order summary */}
                <div className="p-3 rounded-xl bg-zinc-50 flex items-center justify-between">
                  <div className="text-xs text-zinc-500">
                    <p className="font-medium text-zinc-900">{selectedPlan.name} — {billing === "yearly" ? "Yıllık" : "Aylık"}</p>
                  </div>
                  <span className="text-base font-bold text-zinc-900">{billing === "yearly" ? totalYearly : price} ₺</span>
                </div>

                {/* Card form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Kart Numarası</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] font-mono tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Kart Üzerindeki İsim</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="AD SOYAD"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] uppercase"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">Son Kullanma</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="AA/YY"
                        maxLength={5}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] font-mono"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 text-center">
                  Ödemeniz PayTR altyapısı ile güvenli şekilde işlenir. Kart bilgileriniz sunucularımızda saklanmaz.
                </p>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" fullWidth onClick={() => setPaymentStep(null)}>Geri</Button>
                  <Button
                    fullWidth
                    onClick={processPayment}
                    disabled={cardNumber.replace(/\s/g, "").length < 16 || !cardName || cardExpiry.length < 5 || cardCvv.length < 3}
                  >
                    {billing === "yearly" ? totalYearly : price} ₺ Öde
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Processing */}
            {paymentStep === "processing" && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full border-4 border-zinc-200 border-t-[#2a5cff] animate-spin mx-auto" />
                <p className="mt-4 text-sm font-medium text-zinc-900">Ödemeniz işleniyor...</p>
                <p className="text-xs text-zinc-400 mt-1">Lütfen sayfayı kapatmayın</p>
              </div>
            )}

            {/* Step 4: Success */}
            {paymentStep === "success" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mt-4">Ödeme Başarılı!</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  <strong>{selectedPlan.name}</strong> planına geçiş yapıldı.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-zinc-50 text-xs text-zinc-500 space-y-1">
                  <p>Plan: <strong className="text-zinc-900">{selectedPlan.name}</strong></p>
                  <p>Ödeme: <strong className="text-zinc-900">{billing === "yearly" ? totalYearly : price} ₺ ({billing === "yearly" ? "Yıllık" : "Aylık"})</strong></p>
                  <p>Sonraki yenileme: <strong className="text-zinc-900">{billing === "yearly" ? "10 Nisan 2027" : "10 Mayıs 2026"}</strong></p>
                </div>
                <div className="mt-4">
                  <Button fullWidth onClick={closeModal}>Tamam</Button>
                </div>
              </div>
            )}
          </Modal>
        )
      })()}
    </div>
  )
}
