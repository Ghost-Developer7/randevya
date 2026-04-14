"use client"

import { useState, useEffect, useCallback } from "react"

type CouponRow = {
  id: string; code: string; discount_percent: number; plan_name: string; plan_id: string | null
  valid_from: string; valid_until: string; max_uses: number; used_count: number
  is_active: boolean; created_at: string
}

type CouponUsage = {
  id: string; tenant_name: string; tenant_email: string
  discount_amount: number; original_amount: number; final_amount: number
  billing_period: string; subscription_status: string; used_at: string
}

type Plan = { id: string; name: string }

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [createForm, setCreateForm] = useState({
    code: "", discount_percent: 10, plan_id: "", valid_from: "", valid_until: "", max_uses: 100,
  })
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Detail modal
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailCoupon, setDetailCoupon] = useState<CouponRow | null>(null)
  const [detailUsages, setDetailUsages] = useState<CouponUsage[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/coupons?${params}`)
      const data = await res.json()
      if (data.success) {
        setCoupons(data.data.coupons)
        setTotalPages(data.data.pagination.pages)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search])

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plans")
      const data = await res.json()
      if (data.success) setPlans(data.data.plans ?? data.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])
  useEffect(() => { fetchPlans() }, [fetchPlans])

  const handleCreate = async () => {
    setCreating(true)
    setCreateMsg(null)
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          plan_id: createForm.plan_id || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCreateMsg({ type: "ok", text: `Kupon oluşturuldu: ${data.data.coupon.code}` })
        fetchCoupons()
        setTimeout(() => { setShowCreate(false); setCreateMsg(null) }, 1500)
      } else {
        setCreateMsg({ type: "err", text: data.error || "Oluşturulamadı" })
      }
    } catch {
      setCreateMsg({ type: "err", text: "Bağlantı hatası" })
    }
    setCreating(false)
  }

  const openDetail = async (id: string) => {
    setDetailId(id)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/coupons/${id}`)
      const data = await res.json()
      if (data.success) {
        setDetailCoupon(data.data.coupon)
        setDetailUsages(data.data.usages)
      }
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active }),
      })
      fetchCoupons()
      if (detailCoupon?.id === id) openDetail(id)
    } catch { /* ignore */ }
  }

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Kuponlar</h1>
          <p className="text-sm text-zinc-500 mt-0.5">İndirim kuponlarını yönetin</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateMsg(null); setCreateForm({ code: "", discount_percent: 10, plan_id: "", valid_from: "", valid_until: "", max_uses: 100 }) }}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#2a5cff] text-white hover:opacity-90"
        >Yeni Kupon</button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Kupon kodu ara..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        className="w-full max-w-sm px-4 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-xs text-zinc-400 uppercase tracking-wide">
                <th className="text-left py-3 px-4 font-medium">Kod</th>
                <th className="text-center py-3 px-4 font-medium">İndirim</th>
                <th className="text-left py-3 px-4 font-medium">Plan</th>
                <th className="text-left py-3 px-4 font-medium">Geçerlilik</th>
                <th className="text-center py-3 px-4 font-medium">Kullanım</th>
                <th className="text-center py-3 px-4 font-medium">Durum</th>
                <th className="text-right py-3 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-zinc-400">Yükleniyor...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-zinc-400">Henüz kupon bulunmuyor</td></tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-zinc-900">{c.code}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.discount_percent === 100 ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      %{c.discount_percent}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-600">{c.plan_name}</td>
                  <td className="py-3 px-4 text-xs text-zinc-500">
                    {new Date(c.valid_from).toLocaleDateString("tr-TR")} — {new Date(c.valid_until).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-semibold text-zinc-900">{c.used_count}</span>
                    <span className="text-xs text-zinc-400">/{c.max_uses}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleActive(c.id, !c.is_active)}
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium cursor-pointer ${c.is_active ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}
                    >{c.is_active ? "Aktif" : "Deaktif"}</button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openDetail(c.id)} className="text-xs text-[#2a5cff] font-medium hover:underline">Detay</button>
                      <button
                        onClick={() => {
                          if (confirm(c.is_active ? `"${c.code}" kuponunu pasife almak istediğinize emin misiniz?` : `"${c.code}" kuponunu aktife almak istediğinize emin misiniz?`)) {
                            toggleActive(c.id, !c.is_active)
                          }
                        }}
                        className={`text-xs font-medium px-2 py-1 rounded-lg ${c.is_active ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                      >{c.is_active ? "Pasife Al" : "Aktife Al"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-zinc-100">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50">Önceki</button>
            <span className="text-xs text-zinc-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50">Sonraki</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Yeni Kupon Oluştur</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Kupon Kodu</label>
                <div className="flex gap-2">
                  <input className={`${inputCls} font-mono uppercase flex-1`} placeholder="HOSGELDIN50" value={createForm.code} onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })} />
                  <button
                    type="button"
                    onClick={() => {
                      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
                      let code = ""
                      for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
                      setCreateForm({ ...createForm, code })
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-xl border border-zinc-300 text-zinc-600 hover:bg-zinc-50 shrink-0"
                    title="Rastgele kod üret"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">İndirim Oranı (%)</label>
                  <input type="number" min={1} max={100} className={inputCls} value={createForm.discount_percent} onChange={(e) => setCreateForm({ ...createForm, discount_percent: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Maks. Kullanım</label>
                  <input type="number" min={1} className={inputCls} value={createForm.max_uses} onChange={(e) => setCreateForm({ ...createForm, max_uses: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Geçerli Plan (opsiyonel)</label>
                <select className={`${inputCls} bg-white`} value={createForm.plan_id} onChange={(e) => setCreateForm({ ...createForm, plan_id: e.target.value })}>
                  <option value="">Tüm Planlar</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Başlangıç Tarihi</label>
                  <input type="date" className={inputCls} value={createForm.valid_from} onChange={(e) => setCreateForm({ ...createForm, valid_from: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Bitiş Tarihi</label>
                  <input type="date" className={inputCls} value={createForm.valid_until} onChange={(e) => setCreateForm({ ...createForm, valid_until: e.target.value })} />
                </div>
              </div>
              {createMsg && (
                <p className={`text-xs p-2 rounded-lg ${createMsg.type === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{createMsg.text}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-zinc-300 text-zinc-600 hover:bg-zinc-50">Vazgeç</button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createForm.code || !createForm.valid_from || !createForm.valid_until || createForm.discount_percent < 1}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#2a5cff] text-white hover:opacity-90 disabled:opacity-40"
                >{creating ? "Oluşturuluyor..." : "Oluştur"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setDetailId(null); setDetailCoupon(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="py-8 text-center"><div className="w-10 h-10 rounded-full border-4 border-zinc-200 border-t-[#2a5cff] animate-spin mx-auto" /></div>
            ) : detailCoupon && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-mono text-zinc-900">{detailCoupon.code}</h2>
                    <p className="text-xs text-zinc-400">Kupon Detayı</p>
                  </div>
                  <button onClick={() => { setDetailId(null); setDetailCoupon(null) }} className="text-zinc-400 hover:text-zinc-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-50">
                    <p className="text-xs text-zinc-400">İndirim</p>
                    <p className="text-lg font-bold text-zinc-900">%{detailCoupon.discount_percent}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50">
                    <p className="text-xs text-zinc-400">Kullanım</p>
                    <p className="text-lg font-bold text-zinc-900">{detailCoupon.used_count}<span className="text-sm text-zinc-400 font-normal">/{detailCoupon.max_uses}</span></p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50">
                    <p className="text-xs text-zinc-400">Plan</p>
                    <p className="text-sm font-medium text-zinc-900">{detailCoupon.plan_name}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50">
                    <p className="text-xs text-zinc-400">Durum</p>
                    <button
                      onClick={() => toggleActive(detailCoupon.id, !detailCoupon.is_active)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${detailCoupon.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"}`}
                    >{detailCoupon.is_active ? "Aktif" : "Deaktif"}</button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 text-xs text-zinc-500">
                  <p>Geçerlilik: {new Date(detailCoupon.valid_from).toLocaleDateString("tr-TR")} — {new Date(detailCoupon.valid_until).toLocaleDateString("tr-TR")}</p>
                </div>

                {/* Usage logs */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-2">Kullanım Geçmişi ({detailUsages.length})</h3>
                  {detailUsages.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4 text-center">Henüz kullanılmamış</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {detailUsages.map((u) => (
                        <div key={u.id} className="p-3 rounded-xl border border-zinc-100 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-zinc-900">{u.tenant_name}</span>
                            <span className="text-zinc-400">{new Date(u.used_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-zinc-400">{u.tenant_email}</p>
                          <div className="flex gap-3 mt-1 text-zinc-500">
                            <span>Orijinal: {Number(u.original_amount).toFixed(0)} ₺</span>
                            <span className="text-emerald-600">İndirim: -{Number(u.discount_amount).toFixed(0)} ₺</span>
                            <span className="font-medium text-zinc-900">Ödenen: {Number(u.final_amount).toFixed(0)} ₺</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
