"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Logo from "@/components/ui/Logo"
import Input from "@/components/ui/Input"

function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Geçersiz Bağlantı</h1>
        <p className="text-sm text-zinc-500 mb-4">Şifre sıfırlama bağlantısı geçersiz veya eksik.</p>
        <Link href="/panel/sifremi-unuttum" className="text-sm text-[#2a5cff] font-medium hover:underline">
          Yeni talep oluştur
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError("Şifre en az 8 karakter olmalı"); return }
    if (password !== confirm) { setError("Şifreler eşleşmiyor"); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || "Bir hata oluştu")
      }
    } catch {
      setError("Bağlantı hatası")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Şifreniz Güncellendi</h1>
        <p className="text-sm text-zinc-500 mt-2">Yeni şifrenizle giriş yapabilirsiniz.</p>
        <Link href="/panel/giris" className="inline-block mt-6 px-6 py-2.5 text-sm font-semibold text-white bg-[#2a5cff] rounded-xl hover:opacity-90">
          Giriş Yap
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-xl font-bold text-zinc-900 text-center mb-1">Yeni Şifre Belirle</h1>
      <p className="text-sm text-zinc-500 text-center mb-6">Yeni şifrenizi girin.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Yeni Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="En az 8 karakter"
          required
          minLength={8}
        />
        <Input
          label="Şifre Tekrar"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Şifrenizi tekrar girin"
          required
        />

        {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-sm font-semibold text-white bg-[#2a5cff] rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {loading ? "Güncelleniyor..." : "Şifremi Güncelle"}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><Logo size="md" /></div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <Suspense fallback={<div className="text-center text-sm text-zinc-400">Yükleniyor...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
