"use client"

import { useState, useEffect, useCallback } from "react"

type Plan = {
  id: string; name: string; price_monthly: number
  max_staff: number; max_services: number
  whatsapp_enabled: boolean; custom_domain: boolean
  waitlist_enabled: boolean; analytics: boolean; priority_support: boolean
  active_subscriber_count?: number
}

const FEATURE_LABELS: Record<string, string> = {
  whatsapp_enabled: "WhatsApp Bildirim",
  custom_domain: "Özel Alan Adı",
  waitlist_enabled: "Bekleme Listesi",
  analytics: "Analitik & Rapor",
  priority_support: "Öncelikli Destek",
}

const emptyPlan = {
  name: "", price_monthly: 0, max_staff: 5, max_services: 50,
  whatsapp_enabled: false, custom_domain: false, waitlist_enabled: true,
  analytics: false, priority_support: false,
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  // Edit/Create modal
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState(emptyPlan)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/plans")
      const data = await res.json()
      if (data.success) {
        // Her plan için abone sayısını çek
        const enriched = await Promise.all(
          data.data.map(async (p: Plan) => {
            try {
              const r = await fetch(`/api/admin/plans/${p.id}`)
              const d = await r.json()
              return d.success ? { ...p, active_subscriber_count: d.data.active_subscriber_count } : p
            } catch { return p }
          })
        )
        setPlans(enriched)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const openEdit = (plan: Plan) => {
    setIsNew(false)
    setEditPlan(plan)
    setForm({
      name: plan.name, price_monthly: plan.price_monthly,
      max_staff: plan.max_staff, max_services: plan.max_services,
      whatsapp_enabled: plan.whatsapp_enabled, custom_domain: plan.custom_domain,
      waitlist_enabled: plan.waitlist_enabled, analytics: plan.analytics,
      priority_support: plan.priority_support,
    })
    setMsg(null)
  }

  const openNew = () => {
    setIsNew(true)
    setEditPlan({} as Plan)
    setForm(emptyPlan)
    setMsg(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const url = isNew ? "/api/admin/plans" : `/api/admin/plans/${editPlan?.id}`
      const method = isNew ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price_monthly: Number(form.price_monthly),
          max_staff: Number(form.max_staff),
          max_services: Number(form.max_services),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMsg({ type: "ok", text: isNew ? "Plan oluşturuldu" : "Plan güncellendi" })
        fetchPlans()
        setTimeout(() => { setEditPlan(null); setMsg(null) }, 1200)
      } else {
        setMsg({ type: "err", text: data.error || "Kayıt başarısız" })
      }
    } catch {
      setMsg({ type: "err", text: "Bağlantı hatası" })
    }
    setSaving(false)
  }

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Planlar</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Abonelik planlarını ve özelliklerini yönetin</p>
        </div>
        <button onClick={openNew} className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#2a5cff] text-white hover:opacity-90">
          Yeni Plan
        </button>
      </div>

      {/* Plan kartları */}
      {loading ? (
        <div className="text-sm text-zinc-400">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl bg-white border border-zinc-200 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-zinc-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                  <button onClick={() => openEdit(plan)} className="text-xs text-[#2a5cff] font-medium hover:underline">Düzenle</button>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-zinc-900">{Number(plan.price_monthly).toFixed(0)} ₺</span>
                  <span className="text-sm text-zinc-400">/ay</span>
                </div>
                {plan.active_subscriber_count != null && (
                  <p className="text-xs text-zinc-400 mt-1">{plan.active_subscriber_count} aktif abone</p>
                )}
              </div>

              {/* Limitler */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Personel Limiti</span>
                  <span className="font-semibold text-zinc-900">{plan.max_staff >= 999 ? "Sınırsız" : plan.max_staff}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Hizmet Limiti</span>
                  <span className="font-semibold text-zinc-900">{plan.max_services >= 999 ? "Sınırsız" : plan.max_services}</span>
                </div>

                <div className="border-t border-zinc-100 pt-3 space-y-2">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                    const enabled = plan[key as keyof Plan] as boolean
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {enabled ? (
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        <span className={enabled ? "text-zinc-700" : "text-zinc-400"}>{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {editPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditPlan(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900">{isNew ? "Yeni Plan" : `${form.name} Düzenle`}</h2>
              <button onClick={() => setEditPlan(null)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Plan Adı</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Profesyonel" />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Aylık Fiyat (₺, net)</label>
                <input type="number" className={inputCls} value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: parseFloat(e.target.value) || 0 })} min={0} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Maks. Personel</label>
                  <input type="number" className={inputCls} value={form.max_staff} onChange={(e) => setForm({ ...form, max_staff: parseInt(e.target.value) || 1 })} min={1} />
                  <p className="text-[10px] text-zinc-400 mt-0.5">999 = Sınırsız</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Maks. Hizmet</label>
                  <input type="number" className={inputCls} value={form.max_services} onChange={(e) => setForm({ ...form, max_services: parseInt(e.target.value) || 1 })} min={1} />
                  <p className="text-[10px] text-zinc-400 mt-0.5">999 = Sınırsız</p>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Özellikler</p>
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key as keyof typeof form] as boolean}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      className="w-4 h-4 accent-[#2a5cff] rounded"
                    />
                    <span className="text-sm text-zinc-700">{label}</span>
                  </label>
                ))}
              </div>

              {msg && (
                <p className={`text-xs p-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{msg.text}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditPlan(null)} className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-zinc-300 text-zinc-600 hover:bg-zinc-50">Vazgeç</button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#2a5cff] text-white hover:opacity-90 disabled:opacity-40"
                >{saving ? "Kaydediliyor..." : isNew ? "Oluştur" : "Kaydet"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
