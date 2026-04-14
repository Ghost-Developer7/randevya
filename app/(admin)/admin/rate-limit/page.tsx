"use client"

import { useState } from "react"

export default function RateLimitPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null)

  const handleCheck = async () => {
    if (!email.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/rate-limit?email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      if (data.success) {
        const d = data.data
        setResult({
          type: d.blocked ? "err" : "info",
          text: d.blocked
            ? `${d.email} — ENGELLENMİŞ (${d.login_attempts}/${d.limit} deneme)`
            : `${d.email} — ${d.login_attempts}/${d.limit} deneme (engelsiz)`,
        })
      } else {
        setResult({ type: "err", text: data.error || "Sorgulama başarısız" })
      }
    } catch {
      setResult({ type: "err", text: "Bağlantı hatası" })
    }
    setLoading(false)
  }

  const handleClear = async () => {
    if (!email.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setResult({ type: "ok", text: data.data.message })
      } else {
        setResult({ type: "err", text: data.error || "Temizleme başarısız" })
      }
    } catch {
      setResult({ type: "err", text: "Bağlantı hatası" })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Giriş Limitleri</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Kullanıcıların giriş deneme limitlerini sorgula ve temizle</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">E-posta Adresi</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kullanici@ornek.com"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          />
        </div>

        {result && (
          <div className={`p-3 rounded-xl text-sm ${
            result.type === "ok" ? "bg-emerald-50 text-emerald-700" :
            result.type === "err" ? "bg-red-50 text-red-600" :
            "bg-blue-50 text-blue-700"
          }`}>
            {result.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCheck}
            disabled={loading || !email.trim()}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >{loading ? "..." : "Sorgula"}</button>
          <button
            onClick={handleClear}
            disabled={loading || !email.trim()}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
          >{loading ? "..." : "Limiti Temizle"}</button>
        </div>

        <p className="text-[11px] text-zinc-400">
          Her e-posta adresi için 15 dakikada en fazla 5 giriş denemesi yapılabilir. Limit aşılırsa kullanıcı geçici olarak engellenir.
        </p>
      </div>
    </div>
  )
}
