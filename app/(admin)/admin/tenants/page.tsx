"use client"

import { useState, useEffect, useCallback } from "react"

type Tenant = {
  id: string
  domain_slug: string
  custom_domain: string | null
  company_name: string
  sector: string
  owner_email: string
  owner_name: string
  is_active: boolean
  created_at: string
  plan: { name: string; price_monthly: number }
  stats: { appointments: number; staff: number }
}

type DomainInfo = {
  domain_slug: string
  custom_domain: string | null
  vercel: { verified: boolean } | null
  dns: { configured: boolean } | null
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Domain modal
  const [domainModal, setDomainModal] = useState<Tenant | null>(null)
  const [domainInput, setDomainInput] = useState("")
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null)
  const [domainLoading, setDomainLoading] = useState(false)
  const [domainMsg, setDomainMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/tenants?${params}`)
      const data = await res.json()
      if (data.success) {
        setTenants(data.data.tenants)
        setTotalPages(data.data.pagination.pages)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  // ── Domain modal aç ─────────────────────────────────────────────────────────
  const openDomainModal = async (tenant: Tenant) => {
    setDomainModal(tenant)
    setDomainInput(tenant.custom_domain || "")
    setDomainMsg(null)
    setDomainInfo(null)
    setDomainLoading(true)

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}/domain`)
      const data = await res.json()
      if (data.success) setDomainInfo(data.data)
    } catch {
      // ignore
    } finally {
      setDomainLoading(false)
    }
  }

  // ── Domain ekle ─────────────────────────────────────────────────────────────
  const handleAddDomain = async () => {
    if (!domainModal || !domainInput.trim()) return
    setDomainLoading(true)
    setDomainMsg(null)

    try {
      const res = await fetch(`/api/admin/tenants/${domainModal.id}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput.trim() }),
      })
      const data = await res.json()

      if (data.success) {
        const d = data.data
        setDomainMsg({
          type: "ok",
          text: d.dns_configured
            ? `${d.domain} eklendi ve DNS doğrulandı!`
            : `${d.domain} Vercel'e eklendi. Müşteri DNS ayarını yapmalı.`,
        })
        // Tenant listesini güncelle
        setTenants((prev) =>
          prev.map((t) => (t.id === domainModal.id ? { ...t, custom_domain: d.domain } : t))
        )
        // Domain info'yu yenile
        const infoRes = await fetch(`/api/admin/tenants/${domainModal.id}/domain`)
        const infoData = await infoRes.json()
        if (infoData.success) setDomainInfo(infoData.data)
      } else {
        setDomainMsg({ type: "err", text: data.error || "Hata oluştu" })
      }
    } catch {
      setDomainMsg({ type: "err", text: "Bağlantı hatası" })
    } finally {
      setDomainLoading(false)
    }
  }

  // ── Domain kaldır ───────────────────────────────────────────────────────────
  const handleRemoveDomain = async () => {
    if (!domainModal) return
    if (!confirm("Domain'i kaldırmak istediğinize emin misiniz?")) return
    setDomainLoading(true)
    setDomainMsg(null)

    try {
      const res = await fetch(`/api/admin/tenants/${domainModal.id}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      })
      const data = await res.json()

      if (data.success) {
        setDomainMsg({ type: "ok", text: "Domain kaldırıldı" })
        setDomainInput("")
        setDomainInfo(null)
        setTenants((prev) =>
          prev.map((t) => (t.id === domainModal.id ? { ...t, custom_domain: null } : t))
        )
      } else {
        setDomainMsg({ type: "err", text: data.error || "Hata oluştu" })
      }
    } catch {
      setDomainMsg({ type: "err", text: "Bağlantı hatası" })
    } finally {
      setDomainLoading(false)
    }
  }

  // ── Domain doğrula ──────────────────────────────────────────────────────────
  const handleVerifyDomain = async () => {
    if (!domainModal) return
    setDomainLoading(true)
    setDomainMsg(null)

    try {
      const res = await fetch(`/api/admin/tenants/${domainModal.id}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      })
      const data = await res.json()

      if (data.success) {
        const d = data.data
        setDomainMsg({
          type: d.dns_configured ? "ok" : "err",
          text: d.dns_configured
            ? "DNS doğrulandı! Domain aktif."
            : "DNS henüz yapılandırılmamış. Müşteri CNAME kaydını eklemeli.",
        })
        // Info yenile
        const infoRes = await fetch(`/api/admin/tenants/${domainModal.id}/domain`)
        const infoData = await infoRes.json()
        if (infoData.success) setDomainInfo(infoData.data)
      } else {
        setDomainMsg({ type: "err", text: data.error || "Doğrulama başarısız" })
      }
    } catch {
      setDomainMsg({ type: "err", text: "Bağlantı hatası" })
    } finally {
      setDomainLoading(false)
    }
  }

  // ── Tenant önizleme ─────────────────────────────────────────────────────────
  const previewTenant = async (tenant: Tenant) => {
    try {
      const res = await fetch("/api/admin/tenant-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenant.id }),
      })
      const data = await res.json()
      if (data.success) {
        window.open("/panel", "_blank")
      }
    } catch {
      // ignore
    }
  }

  // ── Tenant aktif/pasif ──────────────────────────────────────────────────────
  const toggleActive = async (tenant: Tenant) => {
    const newStatus = !tenant.is_active
    if (!confirm(`${tenant.company_name} - ${newStatus ? "aktif" : "pasif"} yapılsın mı?`)) return

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      })
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, is_active: newStatus } : t))
        )
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">İşletmeler</h1>
            <p className="text-sm text-zinc-500 mt-1">Tüm işletmeleri yönet, domain ata, plan değiştir</p>
          </div>
          <a
            href="/admin"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            &larr; Dashboard
          </a>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="İşletme adı, email veya slug ile ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full max-w-md px-4 py-2.5 text-sm rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-zinc-400">Yükleniyor...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">İşletme bulunamadı</div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="text-left px-4 py-3 font-medium text-zinc-600">İşletme</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600">Domain</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600">Durum</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600">İstatistik</th>
                    <th className="text-right px-4 py-3 font-medium text-zinc-600">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      {/* İşletme */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{tenant.company_name}</p>
                        <p className="text-xs text-zinc-400">{tenant.owner_email}</p>
                        <p className="text-xs text-zinc-400">{tenant.sector}</p>
                      </td>
                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {tenant.plan.name}
                        </span>
                      </td>
                      {/* Domain */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-zinc-500">{tenant.domain_slug}.randevya.com</p>
                        {tenant.custom_domain && (
                          <p className="text-xs font-medium text-emerald-600 mt-0.5">
                            {tenant.custom_domain}
                          </p>
                        )}
                      </td>
                      {/* Durum */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                            tenant.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {tenant.is_active ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      {/* İstatistik */}
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        <p>{tenant.stats.staff} personel</p>
                        <p>{tenant.stats.appointments} randevu</p>
                      </td>
                      {/* İşlem */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => previewTenant(tenant)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            Panel
                          </button>
                          <button
                            onClick={() => openDomainModal(tenant)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                          >
                            Domain
                          </button>
                          <button
                            onClick={() => toggleActive(tenant)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              tenant.is_active
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {tenant.is_active ? "Pasife Al" : "Aktif Et"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-zinc-100">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40"
                >
                  &larr; Önceki
                </button>
                <span className="text-xs text-zinc-400">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40"
                >
                  Sonraki &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Domain Modal ─────────────────────────────────────────────────────── */}
      {domainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDomainModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Domain Yönetimi</h2>
                <p className="text-sm text-zinc-500">{domainModal.company_name}</p>
              </div>
              <button
                onClick={() => setDomainModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-400"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mevcut durum */}
            <div className="p-4 rounded-xl bg-zinc-50 mb-4">
              <p className="text-xs text-zinc-500 mb-1">Varsayılan adres</p>
              <p className="text-sm font-medium text-zinc-700">
                {domainModal.domain_slug}.randevya.com
              </p>

              {domainInfo?.custom_domain && (
                <>
                  <p className="text-xs text-zinc-500 mt-3 mb-1">Custom domain</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900">
                      {domainInfo.custom_domain}
                    </p>
                    {domainInfo.vercel?.verified && domainInfo.dns?.configured ? (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        DNS Bekleniyor
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mesaj */}
            {domainMsg && (
              <div
                className={`p-3 rounded-xl mb-4 text-sm ${
                  domainMsg.type === "ok"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {domainMsg.text}
              </div>
            )}

            {/* Domain input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Custom Domain
                </label>
                <input
                  type="text"
                  placeholder="takvim.firmam.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Müşterinin kullanmak istediği domain adresini girin
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAddDomain}
                  disabled={domainLoading || !domainInput.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {domainLoading ? "İşleniyor..." : "Domain Ekle / Güncelle"}
                </button>

                {domainInfo?.custom_domain && (
                  <>
                    <button
                      onClick={handleVerifyDomain}
                      disabled={domainLoading}
                      className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 transition-colors"
                    >
                      DNS Doğrula
                    </button>
                    <button
                      onClick={handleRemoveDomain}
                      disabled={domainLoading}
                      className="px-4 py-2 text-sm font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"
                    >
                      Kaldır
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* DNS talimatları */}
            {domainInfo?.custom_domain && domainInfo.dns && !domainInfo.dns.configured && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-2">
                  Müşteriye iletilecek DNS ayarları:
                </p>
                <div className="space-y-2 text-xs text-amber-700">
                  <div className="p-2 rounded-lg bg-white/60">
                    <p className="font-medium">Alt domain için (ör: takvim.firmam.com)</p>
                    <p className="font-mono mt-1">CNAME → cname.vercel-dns.com</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60">
                    <p className="font-medium">Root domain için (ör: firmam.com)</p>
                    <p className="font-mono mt-1">A → 76.76.21.21</p>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  DNS değişiklikleri 24 saate kadar sürebilir. Yayıldıktan sonra &quot;DNS Doğrula&quot; butonuna tıklayın.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
