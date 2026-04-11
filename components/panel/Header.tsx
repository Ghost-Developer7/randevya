"use client"

import { useState, useRef, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  type: "new_appointment" | "cancelled" | "payment"
  title: string
  message: string
  time: string
  read: boolean
}

const fakeNotifications: Notification[] = [
  { id: "1", type: "new_appointment", title: "Yeni Randevu Talebi", message: "Elif Demir — Saç Kesimi, 15 Nis 14:00", time: "2 dk önce", read: false },
  { id: "2", type: "new_appointment", title: "Yeni Randevu Talebi", message: "Mehmet Kaya — Sakal Tıraş, 16 Nis 10:30", time: "15 dk önce", read: false },
  { id: "3", type: "cancelled", title: "Randevu İptali", message: "Ali Öztürk randevusunu iptal etti", time: "1 saat önce", read: false },
  { id: "4", type: "new_appointment", title: "Yeni Randevu Talebi", message: "Ayşe Yılmaz — Cilt Bakımı, 17 Nis 16:00", time: "3 saat önce", read: true },
]

const typeIcon: Record<string, { color: string; icon: string }> = {
  new_appointment: { color: "bg-amber-500", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  cancelled: { color: "bg-red-500", icon: "M6 18L18 6M6 6l12 12" },
  payment: { color: "bg-emerald-500", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
}

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(fakeNotifications)
  const ref = useRef<HTMLDivElement>(null)

  // localStorage'dan senkronize et
  const [unreadCount, setUnreadCount] = useState(fakeNotifications.filter((n) => !n.read).length)

  useEffect(() => {
    const sync = () => {
      const val = localStorage.getItem("randevya_unread")
      if (val !== null) setUnreadCount(parseInt(val))
    }
    window.addEventListener("storage", sync)
    // Initial sync
    const val = localStorage.getItem("randevya_unread")
    if (val !== null) setUnreadCount(parseInt(val))
    return () => window.removeEventListener("storage", sync)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const goToNotification = (id: string) => {
    setOpen(false)
    // Bildirimler sayfasına git ve ilgili bildirimi aç
    router.push(`/panel/bildirimler?id=${id}`)
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
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-200/60 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900">
                  Bildirimler
                  {unreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">{unreadCount}</span>
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
                {notifications.slice(0, 5).map((n) => {
                  const tc = typeIcon[n.type] || typeIcon.payment
                  return (
                    <button
                      key={n.id}
                      onClick={() => goToNotification(n.id)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors ${!n.read ? "bg-blue-50/30" : ""}`}
                    >
                      <div className={`w-7 h-7 rounded-lg ${tc.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tc.icon} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-semibold truncate ${!n.read ? "text-zinc-900" : "text-zinc-500"}`}>{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#2a5cff] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{n.message}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{n.time}</p>
                      </div>
                      <svg className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
