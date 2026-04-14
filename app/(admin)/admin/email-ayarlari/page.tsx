"use client"

import { useState, useEffect } from "react"

export default function EmailSettingsPage() {
  const [config, setConfig] = useState({
    smtp_host: "", smtp_port: 465, smtp_secure: true,
    smtp_user: "", smtp_pass: "", from_email: "", from_name: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [source, setSource] = useState("")

  useEffect(() => {
    fetch("/api/admin/email-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const c = data.data.config
          setConfig({
            smtp_host: c.smtp_host, smtp_port: c.smtp_port, smtp_secure: c.smtp_secure,
            smtp_user: c.smtp_user, smtp_pass: c.smtp_pass, from_email: c.from_email, from_name: c.from_name,
          })
          setSource(c.source)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/email-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        setMsg({ type: "ok", text: "SMTP ayarları kaydedildi" })
        setSource("db")
      } else {
        setMsg({ type: "err", text: data.error || "Kayıt başarısız" })
      }
    } catch {
      setMsg({ type: "err", text: "Bağlantı hatası" })
    }
    setSaving(false)
  }

  const handleTest = async () => {
    setTesting(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        setMsg({ type: "ok", text: `Test e-postası gönderildi: ${data.data.to}` })
      } else {
        setMsg({ type: "err", text: data.error || "Test başarısız" })
      }
    } catch {
      setMsg({ type: "err", text: "Bağlantı hatası" })
    }
    setTesting(false)
  }

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">E-Posta Ayarları</h1>
        <div className="text-sm text-zinc-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">E-Posta Ayarları</h1>
        <p className="text-sm text-zinc-500 mt-0.5">SMTP sunucu yapılandırması</p>
        {source && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${source === "db" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            {source === "db" ? "Veritabanından" : "Ortam Değişkenlerinden"}
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">SMTP Sunucu</label>
            <input className={inputCls} value={config.smtp_host} onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })} placeholder="mail.kurumsaleposta.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Port</label>
            <input type="number" className={inputCls} value={config.smtp_port} onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 0 })} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
          <input type="checkbox" checked={config.smtp_secure} onChange={(e) => setConfig({ ...config, smtp_secure: e.target.checked })} className="accent-[#2a5cff]" />
          SSL/TLS (Güvenli bağlantı)
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Kullanıcı Adı</label>
            <input className={inputCls} value={config.smtp_user} onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })} placeholder="noreply@randevya.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Şifre</label>
            <input type="password" className={inputCls} value={config.smtp_pass} onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Gönderen E-posta</label>
            <input className={inputCls} value={config.from_email} onChange={(e) => setConfig({ ...config, from_email: e.target.value })} placeholder="noreply@randevya.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Gönderen Adı</label>
            <input className={inputCls} value={config.from_name} onChange={(e) => setConfig({ ...config, from_name: e.target.value })} placeholder="Randevya" />
          </div>
        </div>

        {msg && (
          <p className={`text-xs p-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{msg.text}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-zinc-300 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
          >{testing ? "Gönderiliyor..." : "Test Gönder"}</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#2a5cff] text-white hover:opacity-90 disabled:opacity-40"
          >{saving ? "Kaydediliyor..." : "Kaydet"}</button>
        </div>
      </div>
    </div>
  )
}
