"use client"

import { useState } from "react"
import Link from "next/link"
import Logo from "@/components/ui/Logo"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
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

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="md" />
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-zinc-900">E-posta Gönderildi</h1>
              <p className="text-sm text-zinc-500 mt-2">
                Kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderilmiştir. Lütfen gelen kutunuzu kontrol edin.
              </p>
              <Link href="/panel/giris" className="inline-block mt-6 text-sm text-[#2a5cff] font-medium hover:underline">
                Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-zinc-900 text-center mb-1">Şifremi Unuttum</h1>
              <p className="text-sm text-zinc-500 text-center mb-6">
                Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">E-posta Adresi</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@isletme.com"
                    required
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-[#2a5cff] rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link href="/panel/giris" className="text-xs text-zinc-500 hover:text-zinc-700">
                  Giriş sayfasına dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
