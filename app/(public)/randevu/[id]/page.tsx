"use client"

import { useSearchParams, useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import Spinner from "@/components/ui/Spinner"

type Appointment = {
  id: string
  customer_name: string
  customer_email: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  service: { id?: string; name: string; duration_min: number }
  staff: { id?: string; full_name: string }
}

type Slot = { start: string; end: string; staff_id: string; staff_name: string }

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  CONFIRMED: { label: "Onaylandı", variant: "success" },
  PENDING: { label: "Bekliyor", variant: "warning" },
  CANCELLED: { label: "İptal Edildi", variant: "danger" },
  COMPLETED: { label: "Tamamlandı", variant: "info" },
  NO_SHOW: { label: "Gelmedi", variant: "neutral" },
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [apt, setApt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  // Reschedule state
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel-confirm">("view")
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0])
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const fetchAppointment = useCallback(() => {
    if (!params.id || !email) return
    return fetch(`/api/appointments/${params.id}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setApt(data.data)
        else setError(data.error || "Randevu bulunamadı")
      })
      .catch(() => setError("Bir hata oluştu"))
  }, [params.id, email])

  useEffect(() => {
    fetchAppointment()?.finally(() => setLoading(false))
  }, [fetchAppointment])

  // URL hash'e göre otomatik aksiyon (email butonlarından gelirken)
  useEffect(() => {
    if (!apt) return
    const hash = window.location.hash.replace("#", "")
    if (hash === "reschedule" && mode === "view") setMode("reschedule")
    else if (hash === "cancel" && mode === "view") setMode("cancel-confirm")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apt])

  // Slot fetch (reschedule modunda)
  const fetchSlots = useCallback(async () => {
    if (!apt || !apt.service.id || !newDate) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      const url = `/api/slots?serviceId=${apt.service.id}&date=${newDate}${apt.staff.id ? `&staffId=${apt.staff.id}` : ""}`
      const res = await fetch(url)
      const data = await res.json()
      setSlots(data.success ? data.data : [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [apt, newDate])

  useEffect(() => {
    if (mode === "reschedule") fetchSlots()
  }, [mode, fetchSlots])

  const handleCancel = async () => {
    setCancelling(true)
    setError("")
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", email }),
      })
      const data = await res.json()
      if (data.success) {
        setApt((prev) => prev ? { ...prev, status: "CANCELLED" } : null)
        setMode("view")
        setInfo("Randevunuz iptal edildi.")
      } else {
        setError(data.error || "İptal yapılamadı")
      }
    } catch {
      setError("Bir hata oluştu")
    } finally {
      setCancelling(false)
    }
  }

  const handleReschedule = async () => {
    if (!selectedSlot) return setError("Yeni saat seçin")
    setRescheduling(true)
    setError("")
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", email, start_time: selectedSlot.start }),
      })
      const data = await res.json()
      if (data.success) {
        setApt((prev) => prev ? { ...prev, start_time: data.data.start_time, end_time: data.data.end_time } : null)
        setMode("view")
        setInfo("Randevunuz yeni saate taşındı.")
        setSelectedSlot(null)
      } else {
        setError(data.error || "Güncelleme yapılamadı")
      }
    } catch {
      setError("Bir hata oluştu")
    } finally {
      setRescheduling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && !apt) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!apt) return null

  const status = statusMap[apt.status] || { label: apt.status, variant: "neutral" as const }
  const canChange =
    (apt.status === "CONFIRMED" || apt.status === "PENDING") &&
    new Date(apt.start_time).getTime() - Date.now() > 2 * 60 * 60 * 1000

  return (
    <div className="min-h-screen bg-zinc-50 py-6 sm:py-12">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">
          Randevu Detayı
        </h1>

        {info && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            {info}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Durum</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm text-zinc-500 shrink-0">Hizmet</span>
            <span className="text-sm font-medium text-zinc-900 text-right">{apt.service.name}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm text-zinc-500 shrink-0">Personel</span>
            <span className="text-sm font-medium text-zinc-900 text-right">{apt.staff.full_name}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm text-zinc-500 shrink-0">Tarih</span>
            <span className="text-sm font-medium text-zinc-900 text-right">
              {new Date(apt.start_time).toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm text-zinc-500 shrink-0">Saat</span>
            <span className="text-sm font-medium text-zinc-900 text-right">
              {new Date(apt.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              {" - "}
              {new Date(apt.end_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {apt.notes && (
            <div className="pt-2 border-t border-zinc-200">
              <span className="text-sm text-zinc-500">Not:</span>
              <p className="text-sm text-zinc-700 mt-1 break-words">{apt.notes}</p>
            </div>
          )}
        </div>

        {canChange && mode === "view" && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setMode("reschedule")}
            >
              Tarihi Değiştir
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => setMode("cancel-confirm")}
            >
              Randevuyu İptal Et
            </Button>
          </div>
        )}

        {!canChange && (apt.status === "CONFIRMED" || apt.status === "PENDING") && (
          <p className="mt-4 text-xs text-zinc-500 text-center">
            Randevuya 2 saatten az kaldığı için değişiklik yapılamıyor.
          </p>
        )}

        {/* ─── İptal onay ──────────────────────────────────────────────── */}
        {mode === "cancel-confirm" && (
          <div className="mt-5 bg-white rounded-2xl border border-red-200 p-5">
            <h2 className="text-base font-bold text-zinc-900 mb-1">İptal etmek istediğinize emin misiniz?</h2>
            <p className="text-sm text-zinc-500 mb-4">Bu işlem geri alınamaz.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="ghost" fullWidth onClick={() => setMode("view")} disabled={cancelling}>
                Vazgeç
              </Button>
              <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancel}>
                Evet, İptal Et
              </Button>
            </div>
          </div>
        )}

        {/* ─── Tarih değiştirme ────────────────────────────────────────── */}
        {mode === "reschedule" && (
          <div className="mt-5 bg-white rounded-2xl border border-zinc-200 p-5">
            <h2 className="text-base font-bold text-zinc-900 mb-1">Yeni Tarih Seç</h2>
            <p className="text-sm text-zinc-500 mb-4">
              {apt.service.name} · {apt.staff.full_name}
            </p>

            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Tarih</label>
            <input
              type="date"
              value={newDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
            />

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-700 mb-2">Müsait Saatler</label>
              {slotsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 rounded-full border-2 border-zinc-200 border-t-[#2a5cff] animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center bg-zinc-50 rounded-xl">
                  Bu tarihte müsait saat yok. Başka bir gün deneyin.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {slots.map((s) => {
                    const isSelected = selectedSlot?.start === s.start && selectedSlot?.staff_id === s.staff_id
                    const time = new Date(s.start).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                    return (
                      <button
                        key={`${s.staff_id}-${s.start}`}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-[#2a5cff] text-white border-[#2a5cff]"
                            : "bg-white text-zinc-700 border-zinc-200 hover:border-[#2a5cff]"
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="ghost" fullWidth onClick={() => { setMode("view"); setSelectedSlot(null) }} disabled={rescheduling}>
                Vazgeç
              </Button>
              <Button
                fullWidth
                loading={rescheduling}
                disabled={!selectedSlot}
                onClick={handleReschedule}
              >
                Güncelle
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
