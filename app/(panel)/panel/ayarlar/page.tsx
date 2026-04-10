"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

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
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Mevcut Plan</h2>
                <p className="text-xs text-zinc-400 mb-4">Abonelik durumunuz ve plan detayları</p>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#2a5cff] to-[#6366f1] text-white">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-100">Mevcut Plan</p>
                    <p className="text-2xl font-bold mt-1">Giriş</p>
                    <p className="text-sm text-blue-200 mt-1">299 ₺/ay &middot; Yenileme: 10 Mayıs 2026</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                    Planı Yükselt
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="text-sm font-bold text-zinc-900 mb-3">Plan Karşılaştırma</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="text-left py-2 pr-4 font-medium text-zinc-500">Özellik</th>
                        <th className="text-center py-2 px-3 font-semibold text-zinc-900">Giriş</th>
                        <th className="text-center py-2 px-3 font-semibold text-[#2a5cff]">Profesyonel</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {[
                        { feature: "Personel", giris: "5", pro: "Sınırsız" },
                        { feature: "Hizmet", giris: "Sınırsız", pro: "Sınırsız" },
                        { feature: "E-posta Bildirim", giris: "✓", pro: "✓" },
                        { feature: "WhatsApp Bildirim", giris: "✗", pro: "✓" },
                        { feature: "Özel Alan Adı", giris: "✗", pro: "✓" },
                        { feature: "Gelişmiş Analitik", giris: "Basit", pro: "Tam" },
                        { feature: "WhatsApp Destek", giris: "✗", pro: "✓" },
                        { feature: "7/24 Destek", giris: "E-posta", pro: "Öncelikli" },
                      ].map((row) => (
                        <tr key={row.feature} className="border-b border-zinc-50">
                          <td className="py-2 pr-4 text-zinc-600">{row.feature}</td>
                          <td className="py-2 px-3 text-center text-zinc-700">{row.giris}</td>
                          <td className="py-2 px-3 text-center font-medium text-[#2a5cff]">{row.pro}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <h2 className="text-sm font-bold text-zinc-900 mb-3">Ödeme Geçmişi</h2>
                <div className="space-y-2">
                  {[
                    { date: "10 Nis 2026", amount: "299 ₺", status: "Ödendi", plan: "Giriş" },
                    { date: "10 Mar 2026", amount: "299 ₺", status: "Ödendi", plan: "Giriş" },
                    { date: "10 Şub 2026", amount: "299 ₺", status: "Ödendi", plan: "Giriş" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 text-sm">
                      <div>
                        <span className="text-zinc-900 font-medium">{p.date}</span>
                        <span className="text-zinc-400 ml-2">{p.plan}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-zinc-900">{p.amount}</span>
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
