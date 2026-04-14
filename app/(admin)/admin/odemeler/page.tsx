"use client"

import { useState, useEffect, useCallback } from "react"

type InvoiceRow = {
  id: string
  invoice_number: string
  net_amount: number
  kdv_rate: number
  kdv_amount: number
  total_amount: number
  status: string
  pdf_url: string | null
  emailed_at: string | null
  created_at: string
  subscription: {
    id: string
    billing_period: string
    status: string
    starts_at: string
    ends_at: string
    paytr_ref: string | null
  }
  tenant: { id: string; company_name: string; owner_email: string }
  plan_name: string
}

type InvoiceDetail = {
  id: string
  invoice_number: string
  net_amount: number
  kdv_rate: number
  kdv_amount: number
  total_amount: number
  status: string
  pdf_url: string | null
  emailed_at: string | null
  billing_address: {
    type: string; full_name: string | null; company_name: string | null
    tax_office: string | null; tax_number: string | null; tc_kimlik: string | null
    address: string; city: string; district: string; phone: string
  }
  subscription: {
    id: string; billing_period: string; status: string
    starts_at: string; ends_at: string; paytr_ref: string | null
    tenant: { id: string; company_name: string; owner_email: string; owner_name: string }
    plan: { name: string; price_monthly: number }
  }
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Detail modal
  const [detail, setDetail] = useState<InvoiceDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Upload
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Refund
  const [refundConfirm, setRefundConfirm] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [refundMsg, setRefundMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/admin/invoices?${params}`)
      const data = await res.json()
      if (data.success) {
        setInvoices(data.data.invoices)
        setTotalPages(data.data.pagination.pages)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search, statusFilter])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setDetail(null)
    setUploadMsg(null)
    setRefundMsg(null)
    setRefundConfirm(false)
    try {
      const res = await fetch(`/api/admin/invoices/${id}`)
      const data = await res.json()
      if (data.success) setDetail(data.data.invoice)
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  const handleUpload = async (file: File) => {
    if (!detail) return
    setUploading(true)
    setUploadMsg(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch(`/api/admin/invoices/${detail.id}/upload`, { method: "POST", body: formData })
      const data = await res.json()
      if (data.success) {
        setUploadMsg({ type: "ok", text: `Fatura yüklendi: ${data.data.invoice_number}` })
        // Refresh detail and list
        openDetail(detail.id)
        fetchInvoices()
      } else {
        setUploadMsg({ type: "err", text: data.error || "Yükleme başarısız" })
      }
    } catch {
      setUploadMsg({ type: "err", text: "Bağlantı hatası" })
    }
    setUploading(false)
  }

  const handleRefund = async () => {
    if (!detail) return
    setRefunding(true)
    setRefundMsg(null)
    try {
      const amount = Math.round(Number(detail.total_amount) * 100)
      const res = await fetch(`/api/admin/subscriptions/${detail.subscription.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (data.success) {
        setRefundMsg({ type: "ok", text: `İade başarılı: ${(amount / 100).toFixed(2)} ₺` })
        setRefundConfirm(false)
        openDetail(detail.id)
        fetchInvoices()
      } else {
        setRefundMsg({ type: "err", text: data.error || "İade başarısız" })
      }
    } catch {
      setRefundMsg({ type: "err", text: "Bağlantı hatası" })
    }
    setRefunding(false)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-emerald-50 text-emerald-700",
      EXPIRED: "bg-zinc-100 text-zinc-500",
      REFUNDED: "bg-red-50 text-red-600",
      PENDING: "bg-amber-50 text-amber-600",
      CANCELLED: "bg-zinc-100 text-zinc-500",
    }
    const labels: Record<string, string> = {
      ACTIVE: "Aktif", EXPIRED: "Süresi Doldu", REFUNDED: "İade", PENDING: "Bekliyor", CANCELLED: "İptal",
    }
    return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-zinc-100 text-zinc-500"}`}>{labels[status] ?? status}</span>
  }

  const invoiceBadge = (status: string) => {
    if (status === "FATURA_YUKLENDI") return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-600">Yüklendi</span>
    return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600">Bekliyor</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Ödemeler & Faturalar</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Tüm ödemeleri takip edin, fatura yükleyin ve iade işlemi yapın</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="İşletme adı veya fatura no ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] bg-white"
        >
          <option value="">Tüm Durumlar</option>
          <option value="FATURA_BEKLIYOR">Fatura Bekliyor</option>
          <option value="FATURA_YUKLENDI">Fatura Yüklendi</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-xs text-zinc-400 uppercase tracking-wide">
                <th className="text-left py-3 px-4 font-medium">Tarih</th>
                <th className="text-left py-3 px-4 font-medium">İşletme</th>
                <th className="text-left py-3 px-4 font-medium">Plan</th>
                <th className="text-left py-3 px-4 font-medium">Dönem</th>
                <th className="text-right py-3 px-4 font-medium">Net</th>
                <th className="text-right py-3 px-4 font-medium">KDV</th>
                <th className="text-right py-3 px-4 font-medium">Toplam</th>
                <th className="text-center py-3 px-4 font-medium">Durum</th>
                <th className="text-center py-3 px-4 font-medium">Fatura</th>
                <th className="text-right py-3 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="py-12 text-center text-zinc-400">Yükleniyor...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-zinc-400">Henüz ödeme bulunmuyor</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <td className="py-3 px-4 text-zinc-600">{new Date(inv.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-zinc-900">{inv.tenant.company_name}</p>
                    <p className="text-xs text-zinc-400">{inv.tenant.owner_email}</p>
                  </td>
                  <td className="py-3 px-4 text-zinc-600">{inv.plan_name}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
                      {inv.subscription.billing_period === "YEARLY" ? "Yıllık" : "Aylık"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-600">{Number(inv.net_amount).toFixed(0)} ₺</td>
                  <td className="py-3 px-4 text-right text-zinc-400">{Number(inv.kdv_amount).toFixed(0)} ₺</td>
                  <td className="py-3 px-4 text-right font-semibold text-zinc-900">{Number(inv.total_amount).toFixed(0)} ₺</td>
                  <td className="py-3 px-4 text-center">{statusBadge(inv.subscription.status)}</td>
                  <td className="py-3 px-4 text-center">{invoiceBadge(inv.status)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openDetail(inv.id)}
                      className="text-xs text-[#2a5cff] font-medium hover:underline"
                    >Detay</button>
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
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50"
            >Önceki</button>
            <span className="text-xs text-zinc-500">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50"
            >Sonraki</button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setDetail(null); setDetailLoading(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full border-4 border-zinc-200 border-t-[#2a5cff] animate-spin mx-auto" />
                <p className="mt-3 text-sm text-zinc-400">Yükleniyor...</p>
              </div>
            ) : detail && (
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">{detail.invoice_number}</h2>
                    <p className="text-xs text-zinc-400">Fatura Detayı</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="text-zinc-400 hover:text-zinc-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Subscription Info */}
                <div className="p-4 rounded-xl bg-zinc-50 space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Abonelik Bilgileri</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-zinc-400">Plan:</span> <span className="font-medium text-zinc-900">{detail.subscription.plan.name}</span></div>
                    <div><span className="text-zinc-400">Dönem:</span> <span className="font-medium text-zinc-900">{detail.subscription.billing_period === "YEARLY" ? "Yıllık" : "Aylık"}</span></div>
                    <div><span className="text-zinc-400">Başlangıç:</span> <span className="font-medium text-zinc-900">{new Date(detail.subscription.starts_at).toLocaleDateString("tr-TR")}</span></div>
                    <div><span className="text-zinc-400">Bitiş:</span> <span className="font-medium text-zinc-900">{new Date(detail.subscription.ends_at).toLocaleDateString("tr-TR")}</span></div>
                    <div><span className="text-zinc-400">Durum:</span> {statusBadge(detail.subscription.status)}</div>
                    {detail.subscription.paytr_ref && <div><span className="text-zinc-400">PayTR Ref:</span> <span className="text-xs font-mono text-zinc-600">{detail.subscription.paytr_ref}</span></div>}
                  </div>
                </div>

                {/* Tenant */}
                <div className="p-4 rounded-xl bg-zinc-50 space-y-1">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">İşletme</h3>
                  <p className="text-sm font-medium text-zinc-900">{detail.subscription.tenant.company_name}</p>
                  <p className="text-xs text-zinc-400">{detail.subscription.tenant.owner_email}</p>
                </div>

                {/* Billing Address */}
                <div className="p-4 rounded-xl bg-zinc-50 space-y-1">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Fatura Adresi</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${detail.billing_address.type === "KURUMSAL" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {detail.billing_address.type === "KURUMSAL" ? "Kurumsal" : "Bireysel"}
                    </span>
                  </div>
                  {detail.billing_address.type === "KURUMSAL" ? (
                    <>
                      <p className="text-sm font-medium text-zinc-900">{detail.billing_address.company_name}</p>
                      <p className="text-xs text-zinc-500">VD: {detail.billing_address.tax_office} — VN: {detail.billing_address.tax_number}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-zinc-900">{detail.billing_address.full_name}</p>
                      <p className="text-xs text-zinc-500">TC: {detail.billing_address.tc_kimlik}</p>
                    </>
                  )}
                  <p className="text-xs text-zinc-500">{detail.billing_address.address}, {detail.billing_address.district}/{detail.billing_address.city}</p>
                  <p className="text-xs text-zinc-500">Tel: {detail.billing_address.phone}</p>
                </div>

                {/* Amount breakdown */}
                <div className="p-4 rounded-xl border border-zinc-200 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Net Tutar</span><span className="text-zinc-900">{Number(detail.net_amount).toFixed(2)} ₺</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">KDV (%{detail.kdv_rate})</span><span className="text-zinc-900">{Number(detail.kdv_amount).toFixed(2)} ₺</span></div>
                  <div className="border-t border-zinc-100 pt-2 flex justify-between text-sm"><span className="font-semibold text-zinc-900">Toplam</span><span className="font-bold text-zinc-900">{Number(detail.total_amount).toFixed(2)} ₺</span></div>
                </div>

                {/* Invoice Actions */}
                <div className="p-4 rounded-xl border border-zinc-200 space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Fatura İşlemleri</h3>

                  {detail.status === "FATURA_BEKLIYOR" ? (
                    <div>
                      <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-zinc-300 hover:border-[#2a5cff] cursor-pointer transition-colors">
                        <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <div>
                          <p className="text-sm font-medium text-zinc-700">{uploading ? "Yükleniyor..." : "PDF Fatura Yükle"}</p>
                          <p className="text-xs text-zinc-400">Maks. 10MB, sadece PDF</p>
                        </div>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUpload(f)
                            e.target.value = ""
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <a
                        href={detail.pdf_url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Faturayı Görüntüle
                      </a>
                      {detail.emailed_at && <p className="text-[10px] text-zinc-400">Gönderildi: {new Date(detail.emailed_at).toLocaleDateString("tr-TR")}</p>}
                    </div>
                  )}

                  {uploadMsg && (
                    <p className={`text-xs p-2 rounded-lg ${uploadMsg.type === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{uploadMsg.text}</p>
                  )}
                </div>

                {/* Refund */}
                {detail.subscription.status !== "REFUNDED" && (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-3">
                    <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide">İade İşlemi</h3>
                    {!refundConfirm ? (
                      <button
                        onClick={() => setRefundConfirm(true)}
                        className="w-full py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >İade Et</button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-red-700">
                          <strong>{Number(detail.total_amount).toFixed(2)} ₺</strong> iade edilecek. Bu işlem geri alınamaz.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRefundConfirm(false)}
                            className="flex-1 py-2 text-sm rounded-xl border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                          >Vazgeç</button>
                          <button
                            onClick={handleRefund}
                            disabled={refunding}
                            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >{refunding ? "İşleniyor..." : "Onayla"}</button>
                        </div>
                      </div>
                    )}
                    {refundMsg && (
                      <p className={`text-xs p-2 rounded-lg ${refundMsg.type === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{refundMsg.text}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
