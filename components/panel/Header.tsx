"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  event_type: string
  recipient: string
  status: string
  sent_at: string
}

const EVENT_ICONS: Record<string, { color: string; icon: string; label: string }> = {
  APPOINTMENT_CONFIRM: { color: "bg-emerald-500", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Randevu Onayı" },
  APPOINTMENT_CANCEL: { color: "bg-red-500", icon: "M6 18L18 6M6 6l12 12", label: "Randevu İptali" },
  APPOINTMENT_REMINDER: { color: "bg-amber-500", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Hatırlatma" },
  BUSINESS_NEW_APPOINTMENT: { color: "bg-blue-500", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Yeni Randevu" },
  PAYMENT_CONFIRMATION: { color: "bg-emerald-500", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", label: "Ödeme" },
  INVOICE_SENT: { color: "bg-blue-500", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Fatura" },
  WAITLIST_NOTIFY: { color: "bg-violet-500", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Bekleme Listesi" },
  WELCOME: { color: "bg-blue-500", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Hoş Geldin" },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Az önce"
  if (mins < 60) return `${mins} dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} saat önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/panel/notifications?page=1")
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data.notifications.slice(0, 5))
        setTotalCount(data.data.pagination.total)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
          aria-label="Menüyü aç"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-sm font-medium text-zinc-900 truncate">
          {session?.user?.name || "İşletme Paneli"}
        </h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification bell */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {totalCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-200/60 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900">
                  Bildirimler
                  {totalCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-600 rounded-full">{totalCount}</span>
                  )}
                </h3>
                <button
                  onClick={() => { setOpen(false); router.push("/panel/bildirimler") }}
                  className="text-xs text-[#2a5cff] hover:underline font-medium"
                >
                  Tümünü Gör
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
                {notifications.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">Bildirim yok</p>
                ) : notifications.map((n) => {
                  const cfg = EVENT_ICONS[n.event_type] ?? { color: "bg-zinc-500", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: n.event_type }
                  return (
                    <button
                      key={n.id}
                      onClick={() => { setOpen(false); router.push("/panel/bildirimler") }}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 truncate">{cfg.label}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{n.recipient}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{timeAgo(n.sent_at)}</p>
                      </div>
                      <span className={`text-[9px] px-1 py-0.5 rounded-full font-medium shrink-0 mt-1 ${n.status === "SENT" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {n.status === "SENT" ? "OK" : "HATA"}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="px-4 py-2.5 border-t border-zinc-100">
                <button
                  onClick={() => { setOpen(false); router.push("/panel/bildirimler") }}
                  className="w-full py-2 text-xs font-medium text-center text-[#2a5cff] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Tüm Bildirimleri Gör →
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="text-sm text-zinc-500 hidden md:block truncate max-w-[200px]">
          {session?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/panel/giris" })}
          className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm text-zinc-600 hover:text-red-600 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </div>
    </header>
  )
}
