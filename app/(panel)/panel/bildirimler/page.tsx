"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"

// ─── TYPES ──────────────────────────────────────────────────────────────────

type NotifType = "new_appointment" | "cancelled" | "payment" | "reminder" | "system"
type Notification = {
  id: string
  type: NotifType
  title: string
  message: string
  time: string
  read: boolean
  // Randevu detayları (new_appointment ve cancelled için)
  appointment?: {
    customer_name: string
    customer_phone: string
    customer_email: string
    service: string
    staff: string
    date: string
    time_slot: string
    payment_method: string
    notes?: string
  }
}

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const typeConfig: Record<NotifType, { label: string; color: string; bg: string; icon: string }> = {
  new_appointment: { label: "Yeni Randevu", color: "text-amber-700", bg: "bg-amber-50", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  cancelled: { label: "İptal", color: "text-red-700", bg: "bg-red-50", icon: "M6 18L18 6M6 6l12 12" },
  payment: { label: "Ödeme", color: "text-emerald-700", bg: "bg-emerald-50", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  reminder: { label: "Hatırlatma", color: "text-blue-700", bg: "bg-blue-50", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  system: { label: "Sistem", color: "text-zinc-700", bg: "bg-zinc-100", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
}

// ─── FAKE DATA ──────────────────────────────────────────────────────────────

const fakeNotifications: Notification[] = [
  {
    id: "1", type: "new_appointment", title: "Yeni Randevu Talebi", read: false, time: "2 dk önce",
    message: "Elif Demir saç kesimi için randevu talebi gönderdi.",
    appointment: { customer_name: "Elif Demir", customer_phone: "0532 111 22 33", customer_email: "elif@mail.com", service: "Saç Kesimi", staff: "Ahmet Usta", date: "15 Nisan 2026", time_slot: "14:00 – 14:45", payment_method: "Yerinde ödeme", notes: "Kısa kesim istiyorum" },
  },
  {
    id: "2", type: "new_appointment", title: "Yeni Randevu Talebi", read: false, time: "15 dk önce",
    message: "Mehmet Kaya sakal tıraş için randevu talebi gönderdi.",
    appointment: { customer_name: "Mehmet Kaya", customer_phone: "0533 222 33 44", customer_email: "mehmet@mail.com", service: "Sakal Tıraş", staff: "Mehmet Usta", date: "16 Nisan 2026", time_slot: "10:30 – 11:00", payment_method: "Online ödeme" },
  },
  {
    id: "3", type: "new_appointment", title: "Yeni Randevu Talebi", read: false, time: "45 dk önce",
    message: "Ayşe Yılmaz cilt bakımı için randevu talebi gönderdi.",
    appointment: { customer_name: "Ayşe Yılmaz", customer_phone: "0534 333 44 55", customer_email: "ayse@mail.com", service: "Cilt Bakımı", staff: "Zeynep Hanım", date: "17 Nisan 2026", time_slot: "16:00 – 17:00", payment_method: "Yerinde ödeme" },
  },
  {
    id: "4", type: "cancelled", title: "Randevu İptali", read: false, time: "1 saat önce",
    message: "Ali Öztürk 18 Nisan'daki randevusunu iptal etti.",
    appointment: { customer_name: "Ali Öztürk", customer_phone: "0535 444 55 66", customer_email: "ali@mail.com", service: "Saç Kesimi", staff: "Ahmet Usta", date: "18 Nisan 2026", time_slot: "11:00 – 11:45", payment_method: "Online ödeme" },
  },
  {
    id: "5", type: "payment", title: "Online Ödeme Alındı", read: true, time: "3 saat önce",
    message: "Fatma Şen online ödeme yaptı — 250 ₺ (Saç Kesimi)",
  },
  {
    id: "6", type: "reminder", title: "Yaklaşan Randevu", read: true, time: "5 saat önce",
    message: "Bugün saat 15:00'te Hasan Çelik — Saç Boyama randevusu var.",
  },
  {
    id: "7", type: "new_appointment", title: "Yeni Randevu Talebi", read: true, time: "Dün",
    message: "Zehra Arslan manikür için randevu talebi gönderdi.",
    appointment: { customer_name: "Zehra Arslan", customer_phone: "0538 777 88 99", customer_email: "zehra@mail.com", service: "Manikür", staff: "Zeynep Hanım", date: "20 Nisan 2026", time_slot: "13:00 – 13:45", payment_method: "Yerinde ödeme" },
  },
  {
    id: "8", type: "system", title: "Sistem Bildirimi", read: true, time: "2 gün önce",
    message: "Aboneliğiniz 10 Mayıs'ta yenilenecektir.",
  },
]

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function NotificationsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-400">Yükleniyor...</div>}>
      <NotificationsPage />
    </Suspense>
  )
}

function NotificationsPage() {
  const searchParams = useSearchParams()
  const [notifications, setNotifications] = useState(fakeNotifications)
  const [filter, setFilter] = useState<"all" | "unread" | NotifType>("all")
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("09:00")
  const [rescheduleStaff, setRescheduleStaff] = useState("")
  const [rescheduleNote, setRescheduleNote] = useState("")
  const [initialLoad, setInitialLoad] = useState(true)
  const allStaff = ["Ahmet Usta", "Mehmet Usta", "Zeynep Hanım"]

  // URL'den ?id=X parametresini oku ve o bildirimi otomatik aç
  useEffect(() => {
    if (!initialLoad) return
    const targetId = searchParams.get("id")
    if (targetId) {
      const notif = fakeNotifications.find((n) => n.id === targetId)
      if (notif) {
        setSelectedNotif(notif)
        // Okundu işaretle
        setNotifications((prev) => prev.map((n) => n.id === targetId ? { ...n, read: true } : n))
        // Tarih/saat doldur
        if (notif.appointment) {
          const timeStr = notif.appointment.time_slot.split("–")[0].split(" – ")[0].trim()
          setRescheduleTime(timeStr)
          setRescheduleStaff(notif.appointment.staff)
          const dateMap: Record<string, string> = {
            "15 Nisan 2026": "2026-04-15", "16 Nisan 2026": "2026-04-16",
            "17 Nisan 2026": "2026-04-17", "18 Nisan 2026": "2026-04-18",
            "20 Nisan 2026": "2026-04-20",
          }
          setRescheduleDate(dateMap[notif.appointment.date] || "")
        }
      }
    }
    setInitialLoad(false)
  }, [searchParams, initialLoad])

  // O güne ait diğer randevular (fake)
  const fakeDaySchedule: Record<string, { time: string; customer: string; service: string; staff: string; status: "CONFIRMED" | "PENDING" | "CANCELLED" }[]> = {
    "15 Nisan 2026": [
      { time: "09:00", customer: "Hasan Çelik", service: "Saç Boyama", staff: "Mehmet Usta", status: "CONFIRMED" },
      { time: "10:30", customer: "Burak Koç", service: "Saç Kesimi", staff: "Ahmet Usta", status: "CONFIRMED" },
      { time: "14:00", customer: "Elif Demir", service: "Saç Kesimi", staff: "Ahmet Usta", status: "PENDING" },
      { time: "15:30", customer: "Selin Aktaş", service: "Cilt Bakımı", staff: "Zeynep Hanım", status: "CONFIRMED" },
    ],
    "16 Nisan 2026": [
      { time: "09:00", customer: "Gül Özkan", service: "Manikür", staff: "Zeynep Hanım", status: "CONFIRMED" },
      { time: "10:30", customer: "Mehmet Kaya", service: "Sakal Tıraş", staff: "Mehmet Usta", status: "PENDING" },
      { time: "13:00", customer: "Emre Yıldız", service: "Saç Kesimi", staff: "Ahmet Usta", status: "CONFIRMED" },
    ],
    "17 Nisan 2026": [
      { time: "11:00", customer: "Deniz Aydın", service: "Saç Boyama", staff: "Mehmet Usta", status: "CONFIRMED" },
      { time: "14:00", customer: "Okan Tekin", service: "Sakal Tıraş", staff: "Ahmet Usta", status: "CANCELLED" },
      { time: "16:00", customer: "Ayşe Yılmaz", service: "Cilt Bakımı", staff: "Zeynep Hanım", status: "PENDING" },
    ],
    "18 Nisan 2026": [
      { time: "11:00", customer: "Ali Öztürk", service: "Saç Kesimi", staff: "Ahmet Usta", status: "CANCELLED" },
      { time: "14:30", customer: "Neslihan Kurt", service: "Pedikür", staff: "Zeynep Hanım", status: "CONFIRMED" },
    ],
    "20 Nisan 2026": [
      { time: "10:00", customer: "Serkan Aksoy", service: "Saç Kesimi", staff: "Mehmet Usta", status: "CONFIRMED" },
      { time: "13:00", customer: "Zehra Arslan", service: "Manikür", staff: "Zeynep Hanım", status: "PENDING" },
      { time: "15:00", customer: "Fatma Şen", service: "Saç Boyama", staff: "Zeynep Hanım", status: "CONFIRMED" },
    ],
  }

  const statusDot: Record<string, string> = { CONFIRMED: "bg-emerald-500", PENDING: "bg-amber-500", CANCELLED: "bg-red-500" }
  const statusText: Record<string, string> = { CONFIRMED: "Onaylı", PENDING: "Bekliyor", CANCELLED: "İptal" }

  const unreadCount = notifications.filter((n) => !n.read).length
  const pendingCount = notifications.filter((n) => n.type === "new_appointment" && !n.read).length

  // localStorage ile diğer component'lere bildir
  useEffect(() => {
    localStorage.setItem("randevya_unread", String(unreadCount))
    window.dispatchEvent(new Event("storage"))
  }, [unreadCount])

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.type === filter
  })

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleApprove = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true, type: "payment" as NotifType, title: "Randevu Onaylandı", message: `${n.appointment?.customer_name} randevusu onaylandı — ${n.appointment?.date} ${n.appointment?.time_slot}` } : n))
    setSelectedNotif(null)
  }

  const handleReject = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true, type: "cancelled" as NotifType, title: "Randevu Reddedildi", message: `${n.appointment?.customer_name} randevusu reddedildi.` } : n))
    setSelectedNotif(null)
  }

  const handleReschedule = (id: string) => {
    if (!rescheduleDate) return
    setNotifications((prev) => prev.map((n) => n.id === id ? {
      ...n, read: true, type: "reminder" as NotifType, title: "Randevu Yeniden Zamanlandı",
      message: `${n.appointment?.customer_name} randevusu ${rescheduleDate} ${rescheduleTime}'e taşındı.${rescheduleNote ? ` Not: ${rescheduleNote}` : ""}`,
    } : n))
    setSelectedNotif(null)
    setRescheduleDate("")
    setRescheduleTime("09:00")
    setRescheduleNote("")
  }

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setSelectedNotif(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Bildirimler</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}
            {pendingCount > 0 && <span className="text-amber-600 font-medium"> &middot; {pendingCount} onay bekliyor</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">{pendingCount} randevu talebi onayınızı bekliyor</p>
            <p className="text-xs text-amber-700 mt-0.5">Müşterileriniz yanıt bekliyor — lütfen en kısa sürede değerlendirin.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { key: "all", label: "Tümü" },
          { key: "unread", label: `Okunmamış (${unreadCount})` },
          { key: "new_appointment", label: "Randevu Talepleri" },
          { key: "cancelled", label: "İptaller" },
          { key: "payment", label: "Ödemeler" },
          { key: "reminder", label: "Hatırlatmalar" },
        ] as { key: typeof filter; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f.key ? "bg-[#2a5cff] text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-sm text-zinc-400">Bu filtrede bildirim bulunmuyor.</p>
            </Card>
          )}
          {filtered.map((n) => {
            const tc = typeConfig[n.type]
            const isSelected = selectedNotif?.id === n.id
            return (
              <button
                key={n.id}
                onClick={() => {
                  setSelectedNotif(n)
                  markRead(n.id)
                  if (n.appointment) {
                    const timeStr = n.appointment.time_slot.split("–")[0].split(" – ")[0].trim()
                    setRescheduleTime(timeStr)
                    setRescheduleStaff(n.appointment.staff)
                    setRescheduleNote("")
                    // Türkçe tarih → ISO dönüşümü
                    const dateMap: Record<string, string> = {
                      "15 Nisan 2026": "2026-04-15", "16 Nisan 2026": "2026-04-16",
                      "17 Nisan 2026": "2026-04-17", "18 Nisan 2026": "2026-04-18",
                      "20 Nisan 2026": "2026-04-20",
                    }
                    setRescheduleDate(dateMap[n.appointment.date] || "")
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected ? "border-[#2a5cff] bg-blue-50/30 shadow-md" :
                  !n.read ? "border-amber-200 bg-amber-50/20 hover:border-amber-300" :
                  "border-zinc-100 bg-white hover:border-zinc-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg ${tc.bg} flex items-center justify-center shrink-0`}>
                    <svg className={`w-4 h-4 ${tc.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tc.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${!n.read ? "text-zinc-900" : "text-zinc-600"}`}>{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#2a5cff] shrink-0" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${tc.bg} ${tc.color}`}>{tc.label}</span>
                      <span className="text-[10px] text-zinc-400">{n.time}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!selectedNotif ? (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="w-12 h-12 text-zinc-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-zinc-400">Detayını görmek için bir bildirim seçin</p>
            </Card>
          ) : (() => {
            const tc = typeConfig[selectedNotif.type]
            const apt = selectedNotif.appointment
            const isPending = selectedNotif.type === "new_appointment"

            return (
              <Card>
                {/* Detail header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${tc.bg} flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${tc.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tc.icon} />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-zinc-900">{selectedNotif.title}</h2>
                      <p className="text-xs text-zinc-400">{selectedNotif.time}</p>
                    </div>
                  </div>
                  <Badge variant={isPending ? "warning" : selectedNotif.type === "cancelled" ? "danger" : selectedNotif.type === "payment" ? "success" : "info"}>
                    {tc.label}
                  </Badge>
                </div>

                <p className="text-sm text-zinc-600 mb-5">{selectedNotif.message}</p>

                {/* Appointment details */}
                {apt && (
                  <div className="p-4 rounded-xl bg-zinc-50 mb-5">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Randevu Detayı</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-zinc-400">Müşteri</p>
                        <p className="font-medium text-zinc-900">{apt.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Telefon</p>
                        <p className="font-medium text-zinc-900">{apt.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">E-posta</p>
                        <p className="font-medium text-zinc-900">{apt.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Hizmet</p>
                        <p className="font-medium text-zinc-900">{apt.service}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Personel</p>
                        <p className="font-medium text-zinc-900">{apt.staff}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Tarih</p>
                        <p className="font-medium text-zinc-900">{apt.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Saat</p>
                        <p className="font-medium text-zinc-900">{apt.time_slot}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Ödeme</p>
                        <p className="font-medium text-zinc-900">{apt.payment_method}</p>
                      </div>
                      {apt.notes && (
                        <div className="col-span-2">
                          <p className="text-xs text-zinc-400">Müşteri Notu</p>
                          <p className="font-medium text-zinc-700 italic">&ldquo;{apt.notes}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {isPending && (
                  <div className="space-y-3">
                    {/* Tarih/Saat/Personel düzenleme — mevcut randevu bilgileriyle dolu gelir */}
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Randevu Zamanı & Personel</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1">Tarih</label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1">Saat</label>
                          <select
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                          >
                            {Array.from({ length: 19 }, (_, i) => {
                              const h = Math.floor(i / 2) + 9
                              const m = i % 2 === 0 ? "00" : "30"
                              return `${String(h).padStart(2, "0")}:${m}`
                            }).map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 mb-1">Personel</label>
                          <select
                            value={rescheduleStaff}
                            onChange={(e) => setRescheduleStaff(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                          >
                            {allStaff.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(() => {
                        const origTime = apt?.time_slot.split("–")[0].split(" – ")[0].trim() || ""
                        const origStaff = apt?.staff || ""
                        const dateMap: Record<string, string> = {
                          "15 Nisan 2026": "2026-04-15", "16 Nisan 2026": "2026-04-16",
                          "17 Nisan 2026": "2026-04-17", "18 Nisan 2026": "2026-04-18",
                          "20 Nisan 2026": "2026-04-20",
                        }
                        const origDate = dateMap[apt?.date || ""] || ""
                        const changed = rescheduleDate !== origDate || rescheduleTime !== origTime || rescheduleStaff !== origStaff
                        if (!changed) return null
                        return (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-zinc-600 mb-1">Müşteriye Not (Opsiyonel)</label>
                            <input
                              type="text"
                              value={rescheduleNote}
                              onChange={(e) => setRescheduleNote(e.target.value)}
                              placeholder="Ör: Bu saatte müsait değiliz, önerilen zamana uyar mısınız?"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#2a5cff]"
                            />
                            <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              Değişiklik yapıldı — onaylarsanız müşteriye yeni öneri gönderilecek.
                            </p>
                          </div>
                        )
                      })()}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="danger" fullWidth onClick={() => handleReject(selectedNotif.id)}>
                        Reddet
                      </Button>
                      <Button fullWidth onClick={() => {
                        const origTime = apt?.time_slot.split("–")[0].split(" – ")[0].trim() || ""
                        const origStaff = apt?.staff || ""
                        const dateMap: Record<string, string> = {
                          "15 Nisan 2026": "2026-04-15", "16 Nisan 2026": "2026-04-16",
                          "17 Nisan 2026": "2026-04-17", "18 Nisan 2026": "2026-04-18",
                          "20 Nisan 2026": "2026-04-20",
                        }
                        const origDate = dateMap[apt?.date || ""] || ""
                        const changed = rescheduleDate !== origDate || rescheduleTime !== origTime || rescheduleStaff !== origStaff

                        if (changed) {
                          handleReschedule(selectedNotif.id)
                        } else {
                          handleApprove(selectedNotif.id)
                        }
                      }}>
                        {(() => {
                          const origTime = apt?.time_slot.split("–")[0].split(" – ")[0].trim() || ""
                          const origStaff = apt?.staff || ""
                          const dateMap: Record<string, string> = {
                            "15 Nisan 2026": "2026-04-15", "16 Nisan 2026": "2026-04-16",
                            "17 Nisan 2026": "2026-04-17", "18 Nisan 2026": "2026-04-18",
                            "20 Nisan 2026": "2026-04-20",
                          }
                          const origDate = dateMap[apt?.date || ""] || ""
                          const changed = rescheduleDate !== origDate || rescheduleTime !== origTime || rescheduleStaff !== origStaff
                          return changed ? "Onayla & Öneri Gönder" : "Onayla"
                        })()}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedNotif.type === "cancelled" && apt && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium">Bu saat artık müsait — bekleme listesindeki müşterilere bildirim gönderilebilir.</p>
                  </div>
                )}

                {!isPending && (
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" fullWidth size="sm" onClick={() => handleDismiss(selectedNotif.id)}>
                      Bildirimi Kaldır
                    </Button>
                  </div>
                )}

                {/* Day schedule — o günün tüm randevuları */}
                {apt && fakeDaySchedule[apt.date] && (
                  <div className="mt-6 pt-5 border-t border-zinc-100">
                    <h3 className="text-sm font-bold text-zinc-900 mb-1">{apt.date} — Günün Programı</h3>
                    <p className="text-xs text-zinc-400 mb-3">Bu gündeki tüm randevular</p>
                    <div className="space-y-1.5">
                      {fakeDaySchedule[apt.date].map((slot, idx) => {
                        const isThis = apt.time_slot.startsWith(slot.time)
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              isThis ? "bg-[#2a5cff]/5 ring-1 ring-[#2a5cff]/30" :
                              slot.status === "CANCELLED" ? "bg-zinc-50 opacity-50 line-through" : "bg-zinc-50 hover:bg-zinc-100"
                            }`}
                          >
                            <span className="text-xs font-mono font-bold text-zinc-900 w-12 shrink-0">{slot.time}</span>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[slot.status]}`} />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-zinc-900">{slot.customer}</span>
                              <span className="text-xs text-zinc-400 ml-1.5">{slot.service}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 shrink-0">{slot.staff}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              slot.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-600" :
                              slot.status === "PENDING" ? "bg-amber-50 text-amber-600" :
                              "bg-red-50 text-red-500"
                            }`}>
                              {statusText[slot.status]}
                            </span>
                            {isThis && (
                              <span className="text-[9px] font-bold text-[#2a5cff] bg-[#2a5cff]/10 px-1.5 py-0.5 rounded">BU</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Müsait saat uyarısı */}
                    {fakeDaySchedule[apt.date].some((s) => s.status === "CANCELLED") && (
                      <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[11px] text-emerald-700">İptal edilen saatlerde yeni randevu alınabilir.</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })()}
        </div>
      </div>

    </div>
  )
}
