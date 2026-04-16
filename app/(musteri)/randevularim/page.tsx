"use client"

import { useState } from "react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"

type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"

type MockAppointment = {
  id: string
  business_name: string
  business_logo?: string
  service_name: string
  staff_name: string
  date: string
  time: string
  status: AppointmentStatus
  payment_status: "unpaid" | "paid_online" | "paid_venue"
}

const statusConfig: Record<AppointmentStatus, { label: string; variant: "warning" | "success" | "danger" | "info" | "neutral" }> = {
  PENDING: { label: "Onay Bekleniyor", variant: "warning" },
  CONFIRMED: { label: "Onaylandı", variant: "success" },
  CANCELLED: { label: "İptal Edildi", variant: "danger" },
  COMPLETED: { label: "Tamamlandı", variant: "info" },
  NO_SHOW: { label: "Gidilmedi", variant: "neutral" },
}

const paymentLabels: Record<string, string> = {
  unpaid: "Ödenmedi",
  paid_online: "Online Ödendi",
  paid_venue: "Yerinde Ödenecek",
}

// Mock data — API entegrasyonunda kaldırılacak
const mockAppointments: MockAppointment[] = [
  {
    id: "1",
    business_name: "Elit Kuaför",
    service_name: "Saç Kesimi",
    staff_name: "Ahmet Usta",
    date: "2026-04-15",
    time: "14:00",
    status: "PENDING",
    payment_status: "unpaid",
  },
  {
    id: "2",
    business_name: "Dr. Mehmet Kara Diş Kliniği",
    service_name: "Diş Temizliği",
    staff_name: "Dr. Mehmet Kara",
    date: "2026-04-18",
    time: "10:30",
    status: "CONFIRMED",
    payment_status: "paid_online",
  },
  {
    id: "3",
    business_name: "Beauty Center",
    service_name: "Cilt Bakımı",
    staff_name: "Ayse Hanim",
    date: "2026-04-10",
    time: "16:00",
    status: "COMPLETED",
    payment_status: "paid_venue",
  },
  {
    id: "4",
    business_name: "Elit Kuaför",
    service_name: "Sakal Tıraş",
    staff_name: "Mehmet Usta",
    date: "2026-04-05",
    time: "11:00",
    status: "CANCELLED",
    payment_status: "unpaid",
  },
]

type Tab = "upcoming" | "past"

// Fake işletmeler ve personeller
const fakeBusinesses = [
  {
    id: "b1", name: "Elit Kuaför", sector: "Kuaför",
    staff: [
      { id: "s1", name: "Ahmet Usta", title: "Uzman Kuaför" },
      { id: "s2", name: "Mehmet Usta", title: "Berber" },
    ],
    services: [
      { id: "sv1", name: "Saç Kesimi", duration: 45 },
      { id: "sv2", name: "Sakal Tıraş", duration: 30 },
      { id: "sv3", name: "Saç Boyama", duration: 90 },
    ],
  },
  {
    id: "b2", name: "Dr. Mehmet Kara Diş Kliniği", sector: "Sağlık",
    staff: [
      { id: "s3", name: "Dr. Mehmet Kara", title: "Diş Hekimi" },
      { id: "s4", name: "Dr. Ayşe Demir", title: "Ortodontist" },
    ],
    services: [
      { id: "sv4", name: "Diş Temizliği", duration: 30 },
      { id: "sv5", name: "Dolgu", duration: 45 },
      { id: "sv6", name: "Kanal Tedavisi", duration: 600 },
    ],
  },
  {
    id: "b3", name: "Beauty Center", sector: "Güzellik",
    staff: [
      { id: "s5", name: "Zeynep Hanım", title: "Güzellik Uzmanı" },
    ],
    services: [
      { id: "sv7", name: "Cilt Bakımı", duration: 60 },
      { id: "sv8", name: "Manikür", duration: 45 },
      { id: "sv9", name: "Pedikür", duration: 60 },
    ],
  },
]

const fakeTimeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]

// Fake dolu günler — bazı slotlar dolu, bazıları tamamen dolu
const fakeBusyDays: Record<string, "full" | "partial"> = {}
const now = new Date()
for (let i = 0; i < 30; i++) {
  const d = new Date(now)
  d.setDate(d.getDate() + i)
  const key = d.toISOString().split("T")[0]
  const r = Math.random()
  if (r < 0.15) fakeBusyDays[key] = "full"
  else if (r < 0.45) fakeBusyDays[key] = "partial"
}

const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfMonth(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

type BookingStep = "business" | "staff" | "datetime" | "confirm"

export default function MyAppointmentsPage() {
  const [tab, setTab] = useState<Tab>("upcoming")
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingStep, setBookingStep] = useState<BookingStep>("business")
  const [selectedBusiness, setSelectedBusiness] = useState<typeof fakeBusinesses[0] | null>(null)
  const [selectedService, setSelectedService] = useState<typeof fakeBusinesses[0]["services"][0] | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<typeof fakeBusinesses[0]["staff"][0] | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [bookingNotes, setBookingNotes] = useState("")
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [appointments, setAppointments] = useState(mockAppointments)

  const now = new Date()
  const upcoming = appointments.filter(
    (a) => new Date(a.date) >= now && a.status !== "CANCELLED"
  )
  const past = appointments.filter(
    (a) => new Date(a.date) < now || a.status === "CANCELLED" || a.status === "COMPLETED"
  )
  const list = tab === "upcoming" ? upcoming : past

  const openBooking = () => {
    setBookingStep("business")
    setSelectedBusiness(null)
    setSelectedService(null)
    setSelectedStaff(null)
    setSelectedDate("")
    setSelectedTime("")
    setBookingNotes("")
    setBookingOpen(true)
  }

  const confirmBooking = () => {
    if (!selectedBusiness || !selectedService || !selectedDate || !selectedTime) return
    const newApt: MockAppointment = {
      id: `new-${Date.now()}`,
      business_name: selectedBusiness.name,
      service_name: selectedService.name,
      staff_name: selectedStaff?.name || "Fark Etmez",
      date: selectedDate,
      time: selectedTime,
      status: "PENDING",
      payment_status: "unpaid",
    }
    setAppointments((prev) => [newApt, ...prev])
    setBookingOpen(false)
    setTab("upcoming")
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Randevularım</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Tüm randevularınızı buradan takip edin</p>
        </div>
        <Button size="sm" className="w-full sm:w-auto" onClick={openBooking}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Randevu
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit mb-6">
        <button
          onClick={() => setTab("upcoming")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "upcoming"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Yaklaşan ({upcoming.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "past"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Geçmiş ({past.length})
        </button>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
          <svg className="w-12 h-12 mx-auto text-zinc-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-zinc-500 text-sm">
            {tab === "upcoming"
              ? "Yaklaşan randevunuz bulunmuyor."
              : "Geçmiş randevunuz bulunmuyor."}
          </p>
          {tab === "upcoming" && (
            <Button size="sm" className="mt-4" onClick={openBooking}>Randevu Al</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((apt) => {
            const status = statusConfig[apt.status]
            const isPending = apt.status === "PENDING"
            const isConfirmed = apt.status === "CONFIRMED"

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Business avatar */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                      <span className="font-bold text-zinc-400 text-sm">
                        {apt.business_name.charAt(0)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-zinc-900 text-sm">
                        {apt.business_name}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {apt.service_name} &middot; {apt.staff_name}
                      </p>
                      <div className="flex items-center gap-x-3 gap-y-1 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(apt.date).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            weekday: "short",
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {apt.time}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {paymentLabels[apt.payment_status]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <Badge variant={status.variant}>{status.label}</Badge>

                    {isPending && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        İşletme onayını bekliyor
                      </span>
                    )}

                    {isConfirmed && apt.payment_status === "unpaid" && (
                      <button className="text-xs text-[#2a5cff] font-medium hover:underline">
                        Online Öde
                      </button>
                    )}

                    {(isPending || isConfirmed) && (
                      <button className="text-xs text-red-500 hover:underline">
                        İptal Et
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Yeni Randevu Modal */}
      <Modal open={bookingOpen} onClose={() => setBookingOpen(false)} title={
        bookingStep === "business" ? "İşletme Seçin" :
        bookingStep === "staff" ? "Personel Seçin" :
        bookingStep === "datetime" ? "Tarih & Saat Seçin" :
        "Hizmet Seçin & Onaylayın"
      }>
        {/* Progress */}
        <div className="flex gap-1.5 mb-5">
          {(["business", "staff", "datetime", "confirm"] as BookingStep[]).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${
              (["business", "staff", "datetime", "confirm"] as BookingStep[]).indexOf(bookingStep) >= i
                ? "bg-[#2a5cff]" : "bg-zinc-200"
            }`} />
          ))}
        </div>

        {/* Step 1: İşletme */}
        {bookingStep === "business" && (
          <div className="space-y-2">
            {fakeBusinesses.map((b) => (
              <button
                key={b.id}
                onClick={() => { setSelectedBusiness(b); setSelectedService(null); setSelectedStaff(null); setBookingStep("staff") }}
                className="w-full text-left p-3 rounded-xl border border-zinc-200 hover:border-[#2a5cff] hover:bg-blue-50/30 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2a5cff] to-[#6366f1] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {b.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{b.name}</p>
                  <p className="text-xs text-zinc-400">{b.sector}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Personel */}
        {bookingStep === "staff" && selectedBusiness && (
          <div className="space-y-2">
            <button onClick={() => setBookingStep("business")} className="text-xs text-[#2a5cff] hover:underline mb-2 flex items-center gap-1">
              ← {selectedBusiness.name}
            </button>
            <button
              onClick={() => { setSelectedStaff(null); setBookingStep("datetime") }}
              className="w-full text-left p-3 rounded-xl border border-zinc-200 hover:border-[#2a5cff] hover:bg-blue-50/30 transition-all"
            >
              <p className="text-sm font-semibold text-zinc-900">Fark Etmez</p>
              <p className="text-xs text-zinc-400">Müsait herhangi bir personel</p>
            </button>
            {selectedBusiness.staff.map((st) => (
              <button
                key={st.id}
                onClick={() => { setSelectedStaff(st); setBookingStep("datetime") }}
                className="w-full text-left p-3 rounded-xl border border-zinc-200 hover:border-[#2a5cff] hover:bg-blue-50/30 transition-all flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {st.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{st.name}</p>
                  <p className="text-xs text-zinc-400">{st.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Tarih & Saat — Takvim */}
        {bookingStep === "datetime" && (() => {
          const daysInMonth = getDaysInMonth(calYear, calMonth)
          const firstDay = getFirstDayOfMonth(calYear, calMonth)
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const prevMonth = () => {
            if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
            else setCalMonth(calMonth - 1)
          }
          const nextMonth = () => {
            if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
            else setCalMonth(calMonth + 1)
          }

          return (
            <div className="space-y-4">
              <button onClick={() => setBookingStep("staff")} className="text-xs text-[#2a5cff] hover:underline mb-1 flex items-center gap-1">
                ← Personel Seçimi
              </button>

              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-zinc-100">
                    <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm font-bold text-zinc-900">{MONTH_NAMES[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-zinc-100">
                    <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e-${i}`} className="h-9" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayDate = new Date(calYear, calMonth, i + 1)
                    const key = dayDate.toISOString().split("T")[0]
                    const isPast = dayDate < today
                    const isToday = dayDate.getTime() === today.getTime()
                    const isSelected = selectedDate === key
                    const busy = fakeBusyDays[key]
                    const isFull = busy === "full"

                    return (
                      <button
                        key={i}
                        disabled={isPast || isFull}
                        onClick={() => { setSelectedDate(key); setSelectedTime("") }}
                        className={`h-9 rounded-lg text-xs font-medium relative transition-all
                          ${isPast ? "text-zinc-300 cursor-not-allowed" : ""}
                          ${isFull && !isPast ? "text-red-300 cursor-not-allowed bg-red-50" : ""}
                          ${isSelected ? "bg-[#2a5cff] text-white ring-2 ring-[#2a5cff] ring-offset-1" : ""}
                          ${!isPast && !isFull && !isSelected ? "hover:bg-blue-50 text-zinc-700" : ""}
                          ${isToday && !isSelected ? "font-bold text-[#2a5cff]" : ""}
                        `}
                      >
                        {i + 1}
                        {busy === "partial" && !isSelected && !isPast && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                        )}
                        {isFull && !isPast && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Kısmen dolu</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Tamamen dolu</span>
                </div>
              </div>

              {/* Saat seçimi — gün seçildiyse */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    {new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })} — Müsait Saatler
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {fakeTimeSlots.map((t) => {
                      const isBusy = Math.random() > 0.7 && fakeBusyDays[selectedDate] === "partial"
                      return (
                        <button
                          key={t}
                          disabled={isBusy}
                          onClick={() => setSelectedTime(t)}
                          className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                            selectedTime === t
                              ? "border-[#2a5cff] bg-[#2a5cff] text-white"
                              : isBusy
                                ? "border-zinc-100 text-zinc-300 bg-zinc-50 cursor-not-allowed line-through"
                                : "border-zinc-200 text-zinc-700 hover:border-[#2a5cff]"
                          }`}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Not + Devam */}
              {selectedDate && selectedTime && (
                <div>
                  <Input
                    label="Not (Opsiyonel)"
                    placeholder="Ek bilgi ekleyebilirsiniz"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                  <Button fullWidth className="mt-3" onClick={() => setBookingStep("confirm")}>
                    Devam Et
                  </Button>
                </div>
              )}
            </div>
          )
        })()}

        {/* Step 5: Onay */}
        {bookingStep === "confirm" && selectedBusiness && (
          <div className="space-y-4">
            <button onClick={() => setBookingStep("datetime")} className="text-xs text-[#2a5cff] hover:underline mb-1 flex items-center gap-1">
              ← Tarih/Saat Seçimi
            </button>

            {/* Özet */}
            <div className="p-3 rounded-xl bg-zinc-50 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">İşletme</span>
                <span className="font-medium text-zinc-900">{selectedBusiness.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Personel</span>
                <span className="font-medium text-zinc-900">{selectedStaff?.name || "Fark Etmez"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tarih</span>
                <span className="font-medium text-zinc-900">
                  {new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Saat</span>
                <span className="font-medium text-zinc-900">{selectedTime}</span>
              </div>
            </div>

            {/* Hizmet seçimi */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Ne yaptırmak istiyorsunuz?</label>
              <div className="space-y-1.5">
                {selectedBusiness.services.map((sv) => (
                  <button
                    key={sv.id}
                    onClick={() => setSelectedService(sv)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                      selectedService?.id === sv.id
                        ? "border-[#2a5cff] bg-[#2a5cff]/5 font-semibold text-[#2a5cff]"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {sv.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Not */}
            <Input
              label="Açıklama / Not (Opsiyonel)"
              placeholder="Ne yaptırmak istediğinizi kısaca yazabilirsiniz"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
            />

            <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Randevu talebi işletme onayına gönderilecektir.
            </p>
            <Button fullWidth onClick={confirmBooking} disabled={!selectedService}>
              Randevu Talebi Gönder
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
