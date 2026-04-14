"use client"

import { useState, useEffect, useCallback } from "react"

type Notification = {
  id: string
  channel: string
  recipient: string
  event_type: string
  status: string
  error_msg: string | null
  sent_at: string
}

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  APPOINTMENT_CONFIRM: { label: "Randevu Onayı", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-500 bg-emerald-50" },
  APPOINTMENT_CANCEL: { label: "Randevu İptali", icon: "M6 18L18 6M6 6l12 12", color: "text-red-500 bg-red-50" },
  APPOINTMENT_REMINDER: { label: "Randevu Hatırlatma", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-amber-500 bg-amber-50" },
  WAITLIST_NOTIFY: { label: "Bekleme Listesi", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-violet-500 bg-violet-50" },
  BUSINESS_NEW_APPOINTMENT: { label: "Yeni Randevu", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-blue-500 bg-blue-50" },
  PAYMENT_CONFIRMATION: { label: "Ödeme Onayı", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", color: "text-emerald-500 bg-emerald-50" },
  INVOICE_SENT: { label: "Fatura Gönderimi", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-blue-500 bg-blue-50" },
  SUBSCRIPTION_EXPIRED: { label: "Abonelik Süresi Doldu", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-red-500 bg-red-50" },
  WELCOME: { label: "Hoş Geldin", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-blue-500 bg-blue-50" },
}

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "E-posta",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState("")

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/panel/notifications?page=${page}`)
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data.notifications)
        setTotalPages(data.data.pagination.pages)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const filtered = filter
    ? notifications.filter((n) => n.event_type === filter)
    : notifications

  // Günlere göre grupla
  const grouped: Record<string, Notification[]> = {}
  filtered.forEach((n) => {
    const day = new Date(n.sent_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(n)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Bildirimler</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Gönderilen tüm bildirimlerin geçmişi</p>
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("")} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${!filter ? "bg-[#2a5cff] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>Tümü</button>
        {Object.entries(EVENT_LABELS).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === key ? "bg-[#2a5cff] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>{cfg.label}</button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 rounded-full border-3 border-zinc-200 border-t-[#2a5cff] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">Bildirim bulunamadı</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayNotifs]) => (
            <div key={day}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">{day}</h3>
              <div className="space-y-2">
                {dayNotifs.map((n) => {
                  const cfg = EVENT_LABELS[n.event_type] ?? { label: n.event_type, icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-zinc-500 bg-zinc-50" }
                  return (
                    <div key={n.id} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-zinc-200">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cfg.icon} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900">{cfg.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${n.status === "SENT" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                            {n.status === "SENT" ? "Gönderildi" : "Başarısız"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium">
                            {CHANNEL_LABELS[n.channel] ?? n.channel}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Alıcı: {n.recipient}
                        </p>
                        {n.error_msg && (
                          <p className="text-xs text-red-500 mt-1">Hata: {n.error_msg}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 shrink-0">
                        {new Date(n.sent_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50">Önceki</button>
          <span className="text-xs text-zinc-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50">Sonraki</button>
        </div>
      )}
    </div>
  )
}
