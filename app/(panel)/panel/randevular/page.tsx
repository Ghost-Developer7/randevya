"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"

// ─── TYPES ──────────────────────────────────────────────────────────────────

type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"

type Appointment = {
  id: string
  customer_name: string
  customer_phone: string
  service_name: string
  staff_name: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  payment_method: "online" | "venue"
  notes?: string
}

// ─── STATUS CONFIG ──────────────────────────────────────────────────────────

const statusConfig: Record<AppointmentStatus, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral"; color: string; dot: string }> = {
  PENDING: { label: "Bekliyor", variant: "warning", color: "border-l-amber-500", dot: "bg-amber-500" },
  CONFIRMED: { label: "Onaylı", variant: "success", color: "border-l-emerald-500", dot: "bg-emerald-500" },
  CANCELLED: { label: "İptal", variant: "danger", color: "border-l-red-500", dot: "bg-red-500" },
  COMPLETED: { label: "Tamamlandı", variant: "info", color: "border-l-blue-500", dot: "bg-blue-500" },
  NO_SHOW: { label: "Gelmedi", variant: "neutral", color: "border-l-zinc-400", dot: "bg-zinc-400" },
}

// ─── FAKE DATA ──────────────────────────────────────────────────────────────

function generateFakeAppointments(): Appointment[] {
  const names = ["Elif Demir", "Mehmet Kaya", "Ayşe Yılmaz", "Ali Öztürk", "Fatma Şen", "Hasan Çelik", "Zehra Arslan", "Burak Koç", "Selin Aktaş", "Emre Yıldız", "Deniz Aydın", "Gül Özkan"]
  const services = ["Saç Kesimi", "Sakal Tıraş", "Saç Boyama", "Cilt Bakımı", "Manikür", "Pedikür"]
  const staffNames = ["Ahmet Usta", "Mehmet Usta", "Zeynep Hanım"]
  const statuses: AppointmentStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "CONFIRMED", "CONFIRMED", "PENDING"]
  const payments: ("online" | "venue")[] = ["online", "venue"]

  const appointments: Appointment[] = []
  const now = new Date()

  for (let dayOffset = -7; dayOffset <= 14; dayOffset++) {
    const count = Math.floor(Math.random() * 5) + 1
    for (let i = 0; i < count; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + dayOffset)
      const hour = 9 + Math.floor(Math.random() * 9)
      const minute = Math.random() > 0.5 ? 0 : 30
      date.setHours(hour, minute, 0, 0)

      const endDate = new Date(date)
      endDate.setMinutes(endDate.getMinutes() + (Math.random() > 0.5 ? 45 : 30))

      const status = dayOffset < 0
        ? (Math.random() > 0.2 ? "COMPLETED" : "CANCELLED")
        : statuses[Math.floor(Math.random() * statuses.length)]

      appointments.push({
        id: `apt-${dayOffset}-${i}`,
        customer_name: names[Math.floor(Math.random() * names.length)],
        customer_phone: `053${Math.floor(Math.random() * 10)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`,
        service_name: services[Math.floor(Math.random() * services.length)],
        staff_name: staffNames[Math.floor(Math.random() * staffNames.length)],
        start_time: date.toISOString(),
        end_time: endDate.toISOString(),
        status,
        payment_method: payments[Math.floor(Math.random() * 2)],
        notes: Math.random() > 0.7 ? "Kısa kesim istiyorum" : undefined,
      })
    }
  }

  return appointments.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
}

const allAppointments = generateFakeAppointments()

// ─── HELPERS ────────────────────────────────────────────────────────────────

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9) // 09:00 - 18:00

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(allAppointments)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ date: "", hour: "", minute: "", staff: "", service: "", notes: "" })
  const [filterStatus, setFilterStatus] = useState<"all" | AppointmentStatus>("all")

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => { setCurrentDate(new Date()); setSelectedDay(new Date()) }

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((a) => isSameDay(new Date(a.start_time), day))
  }

  const getAppointmentsForHour = (day: Date, hour: number) => {
    return appointments.filter((a) => {
      const d = new Date(a.start_time)
      return isSameDay(d, day) && d.getHours() === hour
    })
  }

  const handleAction = (id: string, action: "confirm" | "cancel") => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: (action === "confirm" ? "CONFIRMED" : "CANCELLED") as AppointmentStatus } : a
      )
    )
    setSelectedApt(null)
    setEditMode(false)
  }

  const openEdit = (apt: Appointment) => {
    const d = new Date(apt.start_time)
    setEditData({
      date: d.toISOString().split("T")[0],
      hour: String(d.getHours()).padStart(2, "0"),
      minute: String(d.getMinutes()).padStart(2, "0"),
      staff: apt.staff_name,
      service: apt.service_name,
      notes: apt.notes || "",
    })
    setEditMode(true)
  }

  const handleSave = () => {
    if (!selectedApt) return
    const newStart = new Date(`${editData.date}T${editData.hour}:${editData.minute}:00`)
    const oldDuration = new Date(selectedApt.end_time).getTime() - new Date(selectedApt.start_time).getTime()
    const newEnd = new Date(newStart.getTime() + oldDuration)

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === selectedApt.id
          ? {
              ...a,
              start_time: newStart.toISOString(),
              end_time: newEnd.toISOString(),
              staff_name: editData.staff,
              service_name: editData.service,
              notes: editData.notes || undefined,
            }
          : a
      )
    )
    setEditMode(false)
    setSelectedApt(null)
  }

  const staffNames = ["Ahmet Usta", "Mehmet Usta", "Zeynep Hanım"]
  const serviceNames = ["Saç Kesimi", "Sakal Tıraş", "Saç Boyama", "Cilt Bakımı", "Manikür", "Pedikür"]

  // Filter for day view
  const dayAppointments = selectedDay
    ? getAppointmentsForDay(selectedDay).filter((a) => filterStatus === "all" || a.status === filterStatus)
    : []

  // Check conflicts
  const getConflicts = (day: Date, hour: number) => {
    const apts = getAppointmentsForHour(day, hour).filter((a) => a.status !== "CANCELLED")
    const staffMap = new Map<string, Appointment[]>()
    apts.forEach((a) => {
      const list = staffMap.get(a.staff_name) || []
      list.push(a)
      staffMap.set(a.staff_name, list)
    })
    const conflicts: string[] = []
    staffMap.forEach((list, staff) => {
      if (list.length > 1) conflicts.push(`${staff}: ${list.length} randevu çakışıyor!`)
    })
    return conflicts
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Randevular</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Takvim görünümü ile randevularınızı yönetin</p>
        </div>
        <Button size="sm" onClick={goToday}>Bugün</Button>
      </div>

      {/* Calendar */}
      <Card padding="sm">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-zinc-900">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-t border-zinc-100">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-zinc-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 border-t border-zinc-100">
          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 sm:h-24 border-b border-r border-zinc-200" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = new Date(year, month, i + 1)
            const dayApts = getAppointmentsForDay(day)
            const isToday = isSameDay(day, today)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const activeApts = dayApts.filter((a) => a.status !== "CANCELLED")
            // Unique staff for the day
            const dayStaff = [...new Set(activeApts.map((a) => a.staff_name))]
            const STAFF_COLORS: Record<string, string> = { "Ahmet Usta": "bg-blue-500", "Mehmet Usta": "bg-violet-500", "Zeynep Hanım": "bg-pink-500" }

            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedDay(day)
                  setTimeout(() => {
                    const el = document.getElementById("day-detail")
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
                  }, 100)
                }}
                className={`group h-24 sm:h-28 border-b border-r border-zinc-200 p-1 sm:p-1.5 text-left cursor-pointer transition-all duration-200 relative overflow-hidden hover:z-10 hover:shadow-lg hover:scale-[1.08] hover:rounded-lg hover:bg-white ${
                  isSelected ? "bg-blue-50 ring-2 ring-[#2a5cff] ring-inset z-10" : ""
                } ${isToday ? "bg-amber-50/40" : "hover:bg-white"}`}
              >
                {/* Day number */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isToday ? "bg-[#2a5cff] text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-zinc-700"}`}>
                    {i + 1}
                  </span>
                  {dayApts.length > 0 && (
                    <span className="text-[10px] font-medium text-zinc-400">{dayApts.length}</span>
                  )}
                </div>

                {/* Appointment previews */}
                {activeApts.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {activeApts.slice(0, 2).map((apt) => {
                      const sc = statusConfig[apt.status]
                      return (
                        <div key={apt.id} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] sm:text-[10px] leading-tight truncate border-l-2 ${sc.color} bg-zinc-50`}>
                          <span className="font-medium text-zinc-700 truncate">{apt.customer_name.split(" ")[0]}</span>
                          <span className="text-zinc-400 hidden sm:inline truncate">{apt.service_name.split(" ")[0]}</span>
                        </div>
                      )
                    })}
                    {activeApts.length > 2 && (
                      <span className="text-[9px] text-zinc-400 pl-1">+{activeApts.length - 2} daha</span>
                    )}
                  </div>
                )}

                {/* Staff bubbles */}
                {dayStaff.length > 0 && (
                  <div className="absolute bottom-1 right-1 flex -space-x-1">
                    {dayStaff.slice(0, 3).map((name) => (
                      <div
                        key={name}
                        title={name}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${STAFF_COLORS[name] || "bg-zinc-400"} text-white text-[8px] font-bold flex items-center justify-center ring-1 ring-white`}
                      >
                        {name.charAt(0)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-zinc-100 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Onaylı</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Bekliyor</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> İptal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Tamamlandı</span>
        </div>
      </Card>

      {/* Day Detail View */}
      {selectedDay && (
        <Card padding="sm" id="day-detail">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900">
              {selectedDay.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              <span className="ml-2 text-zinc-400 font-normal">({dayAppointments.length} randevu)</span>
            </h3>
            {/* Status filter */}
            <div className="flex gap-1 flex-wrap">
              {(["all", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                    filterStatus === s
                      ? "bg-[#2a5cff] text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {s === "all" ? "Tümü" : statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Hourly timeline */}
          <div className="divide-y divide-zinc-50">
            {HOURS.map((hour) => {
              const hourApts = dayAppointments.filter((a) => new Date(a.start_time).getHours() === hour)
              const conflicts = getConflicts(selectedDay, hour)

              return (
                <div key={hour} className="flex min-h-[3.5rem]">
                  {/* Hour label */}
                  <div className="w-16 sm:w-20 shrink-0 py-2 px-2 sm:px-4 text-right">
                    <span className="text-xs font-mono text-zinc-400">{String(hour).padStart(2, "0")}:00</span>
                  </div>

                  {/* Appointments */}
                  <div className="flex-1 py-1.5 px-2 space-y-1.5 border-l border-zinc-100">
                    {conflicts.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 border border-red-200">
                        <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-[11px] text-red-600 font-medium">{conflicts[0]}</span>
                      </div>
                    )}

                    {hourApts.length === 0 && (
                      <div className="h-full min-h-[2rem]" />
                    )}

                    {hourApts.map((apt) => {
                      const sc = statusConfig[apt.status]
                      return (
                        <button
                          key={apt.id}
                          onClick={() => setSelectedApt(apt)}
                          className={`w-full text-left px-3 py-2 rounded-lg border-l-4 ${sc.color} bg-white border border-zinc-100 hover:shadow-md transition-all group`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-zinc-900 truncate">{apt.customer_name}</p>
                                <Badge variant={sc.variant}>{sc.label}</Badge>
                              </div>
                              <p className="text-xs text-zinc-500 truncate mt-0.5">
                                {apt.service_name} &middot; {apt.staff_name} &middot;{" "}
                                {new Date(apt.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                –{new Date(apt.end_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Appointment Detail / Edit Modal */}
      <Modal open={!!selectedApt} onClose={() => { setSelectedApt(null); setEditMode(false) }} title={editMode ? "Randevu Düzenle" : "Randevu Detayı"}>
        {selectedApt && (() => {
          const sc = statusConfig[selectedApt.status]
          const cancelledAtSameTime = appointments.filter((a) =>
            a.status === "CANCELLED" &&
            a.id !== selectedApt.id &&
            new Date(a.start_time).getHours() === new Date(selectedApt.start_time).getHours() &&
            isSameDay(new Date(a.start_time), new Date(selectedApt.start_time))
          )

          // ── EDIT MODE ──
          if (editMode) {
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Saat</label>
                    <select
                      value={editData.hour}
                      onChange={(e) => setEditData({ ...editData, hour: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 9).map((h) => (
                        <option key={h} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Dakika</label>
                    <select
                      value={editData.minute}
                      onChange={(e) => setEditData({ ...editData, minute: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                    >
                      <option value="00">00</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                      <option value="45">45</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Personel</label>
                  <select
                    value={editData.staff}
                    onChange={(e) => setEditData({ ...editData, staff: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                  >
                    {staffNames.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Hizmet</label>
                  <select
                    value={editData.service}
                    onChange={(e) => setEditData({ ...editData, service: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
                  >
                    {serviceNames.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Not</label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Opsiyonel not ekleyin"
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] resize-none"
                  />
                </div>

                {/* Müşteri bilgisi (salt okunur) */}
                <div className="p-3 rounded-xl bg-zinc-50 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">{selectedApt.customer_name}</span> &middot; {selectedApt.customer_phone}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" fullWidth size="sm" onClick={() => setEditMode(false)}>
                    Vazgeç
                  </Button>
                  <Button fullWidth size="sm" onClick={handleSave}>
                    Kaydet
                  </Button>
                </div>
              </div>
            )
          }

          // ── VIEW MODE ──
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                  <span className="text-xs text-zinc-400">
                    {selectedApt.payment_method === "online" ? "Online ödeme" : "Yerinde ödeme"}
                  </span>
                </div>
                {(selectedApt.status === "PENDING" || selectedApt.status === "CONFIRMED") && (
                  <button
                    onClick={() => openEdit(selectedApt)}
                    className="flex items-center gap-1 text-xs text-[#2a5cff] hover:underline font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Düzenle
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Müşteri</span>
                  <span className="text-sm font-medium text-zinc-900">{selectedApt.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Telefon</span>
                  <span className="text-sm font-medium text-zinc-900">{selectedApt.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Hizmet</span>
                  <span className="text-sm font-medium text-zinc-900">{selectedApt.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Personel</span>
                  <span className="text-sm font-medium text-zinc-900">{selectedApt.staff_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Tarih</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {new Date(selectedApt.start_time).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Saat</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {new Date(selectedApt.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(selectedApt.end_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {selectedApt.notes && (
                  <div className="pt-2 border-t border-zinc-100">
                    <p className="text-xs text-zinc-500">Not: <span className="text-zinc-700">{selectedApt.notes}</span></p>
                  </div>
                )}
              </div>

              {/* Cancelled at same time warning */}
              {cancelledAtSameTime.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-medium text-amber-700 mb-1">Bu saatte iptal edilen randevular:</p>
                  {cancelledAtSameTime.map((a) => (
                    <p key={a.id} className="text-xs text-amber-600">
                      {a.customer_name} — {a.service_name} (İptal edildi)
                    </p>
                  ))}
                  <p className="text-xs text-amber-500 mt-1 italic">Bu saat müsait — yeni randevu alınabilir.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedApt.status === "PENDING" && (
                  <>
                    <Button variant="danger" fullWidth size="sm" onClick={() => handleAction(selectedApt.id, "cancel")}>
                      Reddet
                    </Button>
                    <Button fullWidth size="sm" onClick={() => handleAction(selectedApt.id, "confirm")}>
                      Onayla
                    </Button>
                  </>
                )}
                {selectedApt.status === "CONFIRMED" && (
                  <>
                    <Button variant="danger" fullWidth size="sm" onClick={() => handleAction(selectedApt.id, "cancel")}>
                      İptal Et
                    </Button>
                    <Button variant="outline" fullWidth size="sm" onClick={() => openEdit(selectedApt)}>
                      Düzenle
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
