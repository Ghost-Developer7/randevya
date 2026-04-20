"use client"

import { useEffect, useState, useCallback } from "react"

type Service = { id: string; name: string; duration_min: number; is_active: boolean }
type StaffItem = {
  id: string
  full_name: string
  is_active: boolean
  services: { id: string; name: string }[]
}
type Slot = { start: string; end: string; staff_id: string; staff_name: string }

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function NewAppointmentModal({ onClose, onCreated }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<StaffItem[]>([])

  const [serviceId, setServiceId] = useState("")
  const [staffId, setStaffId] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])

  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hizmet ve personel listelerini yükle
  useEffect(() => {
    fetch("/api/panel/services")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setServices((d.data as Service[]).filter((s) => s.is_active))
      })
      .catch(() => {})
    fetch("/api/panel/staff")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStaff((d.data as StaffItem[]).filter((s) => s.is_active))
      })
      .catch(() => {})
  }, [])

  // Seçilen hizmete göre uygun personel listesi
  const eligibleStaff = serviceId
    ? staff.filter((s) => s.services.some((sv) => sv.id === serviceId))
    : staff

  // Hizmet değişince staff seçimini temizle
  useEffect(() => {
    if (staffId && !eligibleStaff.some((s) => s.id === staffId)) {
      setStaffId("")
    }
    setSlots([])
    setSelectedSlot(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  // Slotları çek
  const fetchSlots = useCallback(async () => {
    if (!serviceId || !date) {
      setSlots([])
      return
    }
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      const params = new URLSearchParams({ serviceId, date })
      if (staffId) params.set("staffId", staffId)
      const res = await fetch(`/api/panel/appointments/available-slots?${params}`)
      const data = await res.json()
      if (data.success) setSlots(data.data as Slot[])
      else setSlots([])
    } catch {
      setSlots([])
    }
    setSlotsLoading(false)
  }, [serviceId, staffId, date])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })

  const submit = async () => {
    setError(null)
    if (!serviceId) return setError("Hizmet seçin")
    if (!selectedSlot) return setError("Saat seçin")
    if (!name.trim() || !phone.trim() || !email.trim()) return setError("Müşteri bilgilerini doldurun")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Geçersiz e-posta")

    setSubmitting(true)
    try {
      const res = await fetch("/api/panel/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          staff_id: selectedSlot.staff_id,
          start_time: selectedSlot.start,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim(),
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? "Randevu oluşturulamadı")
        setSubmitting(false)
        return
      }
      onCreated()
    } catch {
      setError("Sunucu hatası")
      setSubmitting(false)
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"

  // Gruplanmış slotlar (personele göre)
  const slotsByStaff: Record<string, { name: string; items: Slot[] }> = {}
  for (const s of slots) {
    if (!slotsByStaff[s.staff_id]) slotsByStaff[s.staff_id] = { name: s.staff_name, items: [] }
    slotsByStaff[s.staff_id].items.push(s)
  }

  const canSubmit =
    !submitting && serviceId && selectedSlot && name.trim() && phone.trim() && email.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900">Yeni Randevu</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Hizmet */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Hizmet *</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className={`${inputCls} bg-white`}
            >
              <option value="">Hizmet seçin</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_min} dk)
                </option>
              ))}
            </select>
            {services.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Henüz hizmet tanımlı değil. Hizmetler sayfasından ekleyin.
              </p>
            )}
          </div>

          {/* Personel + Tarih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Personel</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                disabled={!serviceId}
                className={`${inputCls} bg-white disabled:bg-zinc-50 disabled:text-zinc-400`}
              >
                <option value="">Farketmez (tümü)</option>
                {eligibleStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Tarih *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Slotlar */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Saat *</label>
            {!serviceId ? (
              <div className="text-xs text-zinc-400 py-4 text-center bg-zinc-50 rounded-xl">
                Önce hizmet seçin
              </div>
            ) : slotsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 rounded-full border-2 border-zinc-200 border-t-[#2a5cff] animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-xs text-zinc-500 py-4 text-center bg-zinc-50 rounded-xl">
                Bu tarihte müsait saat yok. Başka tarih veya personel deneyin.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(slotsByStaff).map(([sid, group]) => (
                  <div key={sid}>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                      {group.name}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {group.items.map((s) => {
                        const isSelected =
                          selectedSlot?.start === s.start && selectedSlot?.staff_id === s.staff_id
                        return (
                          <button
                            key={`${s.staff_id}-${s.start}`}
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              isSelected
                                ? "bg-[#2a5cff] text-white border-[#2a5cff]"
                                : "bg-white text-zinc-700 border-zinc-200 hover:border-[#2a5cff] hover:text-[#2a5cff]"
                            }`}
                          >
                            {formatTime(s.start)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Müşteri bilgileri */}
          <div className="border-t border-zinc-100 pt-5 space-y-3">
            <p className="text-xs font-semibold text-zinc-700">Müşteri Bilgileri</p>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Ad Soyad *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Ayşe Yılmaz"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Telefon *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                  placeholder="05xx xxx xx xx"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">E-posta *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="musteri@mail.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Not (opsiyonel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
                placeholder="Müşteriye özel notlar..."
              />
            </div>
          </div>

          {error && (
            <p className="text-xs p-3 rounded-xl bg-red-50 text-red-600 font-medium">{error}</p>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-zinc-100 bg-zinc-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 bg-white rounded-xl hover:bg-zinc-50 disabled:opacity-40"
          >
            Vazgeç
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#2a5cff] rounded-xl hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Oluşturuluyor..." : "Randevu Oluştur"}
          </button>
        </div>
      </div>
    </div>
  )
}
