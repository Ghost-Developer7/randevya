"use client"

import { useState, useRef, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

// Fake bildirimler — API entegrasyonunda değişecek
const fakeNotifications = [
  {
    id: "1",
    type: "new_appointment" as const,
    title: "Yeni Randevu Talebi",
    message: "Elif Demir — Saç Kesimi, 15 Nis 14:00",
    time: "2 dk önce",
    read: false,
  },
  {
    id: "2",
    type: "new_appointment" as const,
    title: "Yeni Randevu Talebi",
    message: "Mehmet Kaya — Sakal Tıraş, 16 Nis 10:30",
    time: "15 dk önce",
    read: false,
  },
  {
    id: "3",
    type: "cancelled" as const,
    title: "Randevu İptali",
    message: "Ali Öztürk randevusunu iptal etti",
    time: "1 saat önce",
    read: false,
  },
  {
    id: "4",
    type: "new_appointment" as const,
    title: "Yeni Randevu Talebi",
    message: "Ayşe Yılmaz — Cilt Bakımı, 17 Nis 16:00",
    time: "3 saat önce",
    read: true,
  },
  {
    id: "5",
    type: "payment" as const,
    title: "Ödeme Alındı",
    message: "Fatma Şen online ödeme yaptı — 250 ₺",
    time: "5 saat önce",
    read: true,
  },
]

const typeConfig = {
  new_appointment: { color: "bg-amber-500", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  cancelled: { color: "bg-red-500", icon: "M6 18L18 6M6 6l12 12" },
  payment: { color: "bg-emerald-500", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
}

export default function Header() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState(fakeNotifications)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const handleApprove = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true, type: "payment" as const, title: "Randevu Onaylandı", message: n.message.replace("—", "onaylandı —") } : n))
    setExpandedId(null)
  }

  const handleReject = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true, type: "cancelled" as const, title: "Randevu Reddedildi" } : n))
    setExpandedId(null)
  }

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setExpandedId(null)
  }

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-sm font-medium text-zinc-900">
          {session?.user?.name || "İşletme Paneli"}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-200/60 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900">
                  Bildirimler
                  {unreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">{unreadCount}</span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#2a5cff] hover:underline font-medium">
                    Tümünü okundu işaretle
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-[28rem] overflow-y-auto divide-y divide-zinc-50">
                {notifications.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-400">Bildirim bulunmuyor</div>
                )}
                {notifications.map((n) => {
                  const tc = typeConfig[n.type]
                  const isExpanded = expandedId === n.id
                  const isNewAppointment = n.type === "new_appointment"

                  return (
                    <div key={n.id}>
                      <button
                        onClick={() => { markRead(n.id); setExpandedId(isExpanded ? null : n.id) }}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors ${!n.read ? "bg-blue-50/30" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${tc.color} flex items-center justify-center shrink-0 mt-0.5`}>
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tc.icon} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-semibold ${!n.read ? "text-zinc-900" : "text-zinc-600"}`}>{n.title}</p>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#2a5cff] shrink-0" />}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5 truncate">{n.message}</p>
                          <p className="text-[10px] text-zinc-400 mt-1">{n.time}</p>
                        </div>
                        <svg className={`w-4 h-4 text-zinc-300 shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div className="px-4 pb-3 pt-0">
                          <div className="ml-11 p-3 rounded-xl bg-zinc-50 space-y-2.5">
                            <p className="text-xs text-zinc-600">{n.message}</p>

                            {isNewAppointment ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReject(n.id)}
                                  className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  Reddet
                                </button>
                                <button
                                  onClick={() => handleApprove(n.id)}
                                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#2a5cff] hover:opacity-90 rounded-lg transition-colors"
                                >
                                  Onayla
                                </button>
                                <Link
                                  href="/panel/randevular"
                                  onClick={() => setOpen(false)}
                                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors"
                                >
                                  Detay
                                </Link>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Link
                                  href="/panel/randevular"
                                  onClick={() => setOpen(false)}
                                  className="flex-1 px-3 py-1.5 text-xs font-medium text-center text-[#2a5cff] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  Randevuya Git
                                </Link>
                                <button
                                  onClick={() => handleDismiss(n.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors"
                                >
                                  Kaldır
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-zinc-100 text-center">
                <Link
                  href="/panel/randevular"
                  onClick={() => setOpen(false)}
                  className="text-xs text-[#2a5cff] font-medium hover:underline"
                >
                  Tüm randevuları gör
                </Link>
              </div>
            </div>
          )}
        </div>

        <span className="text-sm text-zinc-500 hidden sm:block">
          {session?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/panel/giris" })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 hover:text-red-600 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış
        </button>
      </div>
    </header>
  )
}
