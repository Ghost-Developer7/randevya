"use client"

import { useState, useEffect, useCallback } from "react"
import Badge from "@/components/ui/Badge"

type Appointment = {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  staff: { id: string; full_name: string }
  service: { id: string; name: string; duration_min: number }
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral"; dot: string }> = {
  PENDING: { label: "Bekliyor", variant: "warning", dot: "bg-amber-500" },
  CONFIRMED: { label: "Onaylı", variant: "success", dot: "bg-emerald-500" },
  CANCELLED: { label: "İptal", variant: "danger", dot: "bg-red-500" },
  COMPLETED: { label: "Tamamlandı", variant: "info", dot: "bg-blue-500" },
  NO_SHOW: { label: "Gelmedi", variant: "neutral", dot: "bg-zinc-400" },
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30)
    return d.toISOString().split("T")[0]
  })

  // Detail modal
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ from: dateFrom, to: dateTo })
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/panel/appointments?${params}`)
      const data = await res.json()
      if (data.success) setAppointments(data.data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [dateFrom, dateTo, statusFilter])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(true)
    try {
      await fetch(`/api/panel/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      fetchAppointments()
      if (selected?.id === id) setSelected(null)
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", weekday: "short" })
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })

  // Günlere göre grupla
  const grouped: Record<string, Appointment[]> = {}
  appointments.forEach((a) => {
    const day = new Date(a.start_time).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(a)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Randevular</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Tüm randevuları görüntüleyin ve yönetin</p>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] bg-white">
          <option value="">Tüm Durumlar</option>
          <option value="PENDING">Bekliyor</option>
          <option value="CONFIRMED">Onaylı</option>
          <option value="COMPLETED">Tamamlandı</option>
          <option value="CANCELLED">İptal</option>
          <option value="NO_SHOW">Gelmedi</option>
        </select>
        <span className="flex items-center text-xs text-zinc-400">{appointments.length} randevu</span>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 rounded-full border-3 border-zinc-200 border-t-[#2a5cff] animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">Bu tarih aralığında randevu bulunamadı</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayApps]) => (
            <div key={day}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">{day}</h3>
              <div className="space-y-2">
                {dayApps.map((a) => {
                  const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.PENDING
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className={`flex items-center gap-4 p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm cursor-pointer transition-all border-l-4 ${
                        a.status === "PENDING" ? "border-l-amber-500" :
                        a.status === "CONFIRMED" ? "border-l-emerald-500" :
                        a.status === "CANCELLED" ? "border-l-red-500" :
                        a.status === "COMPLETED" ? "border-l-blue-500" : "border-l-zinc-300"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-zinc-50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-zinc-900">{formatTime(a.start_time)}</span>
                        <span className="text-[10px] text-zinc-400">{a.service.duration_min}dk</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900">{a.customer_name}</span>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{a.service.name} · {a.staff.full_name}</p>
                        <p className="text-xs text-zinc-400">{a.customer_phone}</p>
                      </div>
                      <div className="shrink-0 flex gap-2">
                        {a.status === "PENDING" && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); updateStatus(a.id, "CANCELLED") }} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Reddet</button>
                            <button onClick={(e) => { e.stopPropagation(); updateStatus(a.id, "CONFIRMED") }} className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2a5cff] rounded-lg hover:opacity-90">Onayla</button>
                          </>
                        )}
                        {a.status === "CONFIRMED" && (
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(a.id, "COMPLETED") }} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">Tamamla</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900">Randevu Detayı</h2>
              <button onClick={() => setSelected(null)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-zinc-50 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Müşteri</span><span className="font-semibold text-zinc-900">{selected.customer_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Telefon</span><span className="text-zinc-900">{selected.customer_phone}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">E-posta</span><span className="text-zinc-900">{selected.customer_email}</span></div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Hizmet</span><span className="font-semibold text-zinc-900">{selected.service.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Personel</span><span className="text-zinc-900">{selected.staff.full_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Süre</span><span className="text-zinc-900">{selected.service.duration_min} dakika</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Tarih</span><span className="text-zinc-900">{formatDate(selected.start_time)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Saat</span><span className="font-semibold text-zinc-900">{formatTime(selected.start_time)} — {formatTime(selected.end_time)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Durum</span><Badge variant={STATUS_CONFIG[selected.status]?.variant ?? "neutral"}>{STATUS_CONFIG[selected.status]?.label ?? selected.status}</Badge></div>
              </div>

              {selected.notes && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Müşteri Notu</p>
                  <p className="text-sm text-amber-800">{selected.notes}</p>
                </div>
              )}

              {/* Aksiyon butonları */}
              <div className="flex gap-2 pt-2">
                {selected.status === "PENDING" && (
                  <>
                    <button disabled={actionLoading} onClick={() => updateStatus(selected.id, "CANCELLED")} className="flex-1 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-40">Reddet</button>
                    <button disabled={actionLoading} onClick={() => updateStatus(selected.id, "CONFIRMED")} className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#2a5cff] rounded-xl hover:opacity-90 disabled:opacity-40">Onayla</button>
                  </>
                )}
                {selected.status === "CONFIRMED" && (
                  <>
                    <button disabled={actionLoading} onClick={() => updateStatus(selected.id, "NO_SHOW")} className="flex-1 py-2.5 text-sm font-semibold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-40">Gelmedi</button>
                    <button disabled={actionLoading} onClick={() => updateStatus(selected.id, "COMPLETED")} className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-40">Tamamlandı</button>
                  </>
                )}
                {(selected.status === "COMPLETED" || selected.status === "CANCELLED" || selected.status === "NO_SHOW") && (
                  <button onClick={() => setSelected(null)} className="flex-1 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50">Kapat</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
