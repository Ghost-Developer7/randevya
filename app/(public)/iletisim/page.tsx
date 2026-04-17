"use client"

import { useState } from "react"
import Navbar from "@/components/public/Navbar"
import Footer from "@/components/public/Footer"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.error || "Bir hata oluştu")
      }
    } catch {
      setError("Bağlantı hatası")
    }
    setLoading(false)
  }

  const inputCls = "w-full px-4 py-3 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] bg-white"

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900">Bize Ulaşın</h1>
            <p className="mt-3 text-lg text-zinc-500">Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* İletişim Bilgileri */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 mb-6">İletişim Bilgileri</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2a5cff] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">Adres</h3>
                      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                        Uluğbey Binası, Pınarbaşı Mah. Hürriyet Cad.<br />
                        Antalya Teknokent, Akdeniz Ünv. K:3 No:B116<br />
                        07070 Konyaaltı/Antalya
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2a5cff] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">Telefon</h3>
                      <a href="tel:05528658832" className="text-sm text-zinc-500 mt-1 hover:text-[#2a5cff] transition-colors">0552 865 88 32</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2a5cff] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">E-posta</h3>
                      <a href="mailto:info@randevya.com" className="text-sm text-zinc-500 mt-1 hover:text-[#2a5cff] transition-colors">info@randevya.com</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Çalışma Saatleri */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Destek Saatleri</h3>
                <div className="space-y-2 text-sm text-zinc-500">
                  <div className="flex justify-between"><span>Pazartesi - Cuma</span><span className="font-medium text-zinc-700">09:00 - 18:00</span></div>
                  <div className="flex justify-between"><span>Cumartesi</span><span className="font-medium text-zinc-700">10:00 - 14:00</span></div>
                  <div className="flex justify-between"><span>Pazar</span><span className="text-zinc-400">Kapalı</span></div>
                </div>
              </div>
            </div>

            {/* İletişim Formu */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">Mesajınız Gönderildi</h2>
                  <p className="text-sm text-zinc-500 mt-2">En kısa sürede size dönüş yapacağız.</p>
                  <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }) }} className="mt-4 text-sm text-[#2a5cff] font-medium hover:underline">
                    Yeni mesaj gönder
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-zinc-900 mb-6">İletişim Formu</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Ad Soyad</label>
                        <input className={inputCls} placeholder="Adınız Soyadınız" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">E-posta</label>
                        <input type="email" className={inputCls} placeholder="ornek@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">Konu</label>
                      <input className={inputCls} placeholder="Mesajınızın konusu" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">Mesaj</label>
                      <textarea
                        className={`${inputCls} resize-none`}
                        rows={5}
                        placeholder="Mesajınızı yazın..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        maxLength={5000}
                      />
                    </div>

                    {error && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 text-sm font-semibold text-white bg-[#2a5cff] rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
                    >
                      {loading ? "Gönderiliyor..." : "Mesaj Gönder"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
