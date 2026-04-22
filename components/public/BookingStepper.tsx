"use client"

import { useState, useCallback, useEffect } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Turnstile from "@/components/ui/Turnstile"

type BookingState = {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7
  service_id: string | null
  service_name: string | null
  service_duration: number | null
  staff_id: string | null
  staff_name: string | null
  date: string | null
  start_time: string | null
  end_time: string | null
  customer_name: string
  customer_phone: string
  customer_email: string
  notes: string
  payment_method: "online" | "venue" | null
}

type Service = { id: string; name: string; description?: string; duration_min: number }
type Staff = { id: string; full_name: string; title?: string; photo_url?: string }
type Slot = { start: string; end: string; staff_id: string; staff_name: string }

const steps = [
  "Hizmet",
  "Personel",
  "Tarih",
  "Saat",
  "Bilgiler",
  "Ödeme",
  "Onay",
]

export default function BookingStepper() {
  const [state, setState] = useState<BookingState>({
    step: 1,
    service_id: null,
    service_name: null,
    service_duration: null,
    staff_id: null,
    staff_name: null,
    date: null,
    start_time: null,
    end_time: null,
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    notes: "",
    payment_method: "venue", // Online ödeme şimdilik devre dışı — yerinde öde varsayılan
  })

  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [kvkkAccepted, setKvkkAccepted] = useState(false)

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/services")
      const data = await res.json()
      if (data.success) setServices(data.data)
    } catch {
      setError("Hizmetler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async (serviceId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff?serviceId=${serviceId}`)
      const data = await res.json()
      if (data.success) setStaff(data.data)
    } catch {
      setError("Personel listesi yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async (serviceId: string, date: string, staffId?: string) => {
    setLoading(true)
    setSlots([])
    try {
      let url = `/api/slots?serviceId=${serviceId}&date=${date}`
      if (staffId) url += `&staffId=${staffId}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setSlots(data.data)
    } catch {
      setError("Müsait saatler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: state.service_id,
          staff_id: state.staff_id,
          start_time: state.start_time,
          customer_name: state.customer_name,
          customer_phone: state.customer_phone,
          customer_email: state.customer_email,
          notes: state.notes || undefined,
          payment_method: state.payment_method,
          turnstileToken,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setReservationId(data.data.id)
        setState((s) => ({ ...s, step: 7 }))
      } else {
        if (data.code === "SLOT_TAKEN") {
          setError("Bu saat doldu, lütfen başka bir saat seçin.")
          setState((s) => ({ ...s, step: 4 }))
        } else {
          setError(data.error || "Rezervasyon oluşturulamadı")
        }
      }
    } catch {
      setError("Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (state.step === 1 && services.length === 0) {
      fetchServices()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const goBack = () => {
    setError("")
    setState((s) => ({ ...s, step: Math.max(1, s.step - 1) as BookingState["step"] }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator — mobilde aktif adım etiketi büyük, diğerleri sadece nokta */}
      <div className="mb-6 sm:mb-8">
        {/* Mobile: "Adım X/Y — Başlık" */}
        <div className="flex items-center justify-between mb-2 sm:hidden">
          <span className="text-xs font-semibold text-zinc-500">
            Adım {state.step} / {steps.length}
          </span>
          <span className="text-sm font-semibold text-zinc-900">
            {steps[state.step - 1]}
          </span>
        </div>
        {/* Progress dots / line */}
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 flex-nowrap">
          {steps.map((label, i) => {
            const stepNum = i + 1
            const isActive = state.step === stepNum
            const isDone = state.step > stepNum

            return (
              <div key={label} className="flex items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`
                      w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0
                      ${isActive ? "bg-[var(--color-primary)] text-white" : ""}
                      ${isDone ? "bg-emerald-500 text-white" : ""}
                      ${!isActive && !isDone ? "bg-zinc-200 text-zinc-500" : ""}
                    `}
                  >
                    {isDone ? (
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap hidden sm:block ${
                      isActive ? "text-zinc-900 font-medium" : "text-zinc-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-3 sm:w-8 h-px mx-0.5 shrink-0 ${isDone ? "bg-emerald-500" : "bg-zinc-200"}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step 1 - Service */}
      {state.step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Hizmet Seçin</h2>
          {loading ? (
            <div className="text-center py-8 text-zinc-400">Yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      service_id: service.id,
                      service_name: service.name,
                      service_duration: service.duration_min,
                      step: 2,
                    }))
                    setError("")
                    fetchStaff(service.id)
                  }}
                  className="text-left p-4 rounded-xl border border-zinc-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all"
                >
                  <p className="font-medium text-zinc-900">{service.name}</p>
                  {service.description && (
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{service.description}</p>
                  )}
                  <p className="text-xs text-zinc-400 mt-2">{service.duration_min} dk</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2 - Staff */}
      {state.step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Personel Seçin</h2>
          {loading ? (
            <div className="text-center py-8 text-zinc-400">Yükleniyor...</div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setState((s) => ({ ...s, staff_id: null, staff_name: "Fark Etmez", step: 3 }))
                  setError("")
                }}
                className="w-full text-left p-4 rounded-xl border border-zinc-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all"
              >
                <p className="font-medium text-zinc-900">Fark Etmez</p>
                <p className="text-xs text-zinc-500 mt-1">Müsait herhangi bir personel</p>
              </button>
              {staff.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    setState((s) => ({ ...s, staff_id: member.id, staff_name: member.full_name, step: 3 }))
                    setError("")
                  }}
                  className="w-full text-left p-4 rounded-xl border border-zinc-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all flex items-center gap-4"
                >
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.full_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
                      <span className="font-bold text-zinc-400">{member.full_name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-zinc-900">{member.full_name}</p>
                    {member.title && <p className="text-xs text-zinc-500">{member.title}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button variant="ghost" onClick={goBack}>&larr; Geri</Button>
          </div>
        </div>
      )}

      {/* Step 3 - Date */}
      {state.step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Tarih Seçin</h2>
          <label className="relative block w-full cursor-pointer">
            <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 pr-12 text-sm rounded-xl border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] [color-scheme:light]"
              onChange={(e) => {
                const date = e.target.value
                if (date) {
                  setState((s) => ({ ...s, date, step: 4 }))
                  setError("")
                  fetchSlots(state.service_id!, date, state.staff_id || undefined)
                }
              }}
            />
          </label>
          <div className="mt-4">
            <Button variant="ghost" onClick={goBack}>&larr; Geri</Button>
          </div>
        </div>
      )}

      {/* Step 4 - Time */}
      {state.step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Saat Seçin</h2>
          <p className="text-sm text-zinc-500 mb-4">
            {state.date && new Date(state.date).toLocaleDateString("tr-TR", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
          {loading ? (
            <div className="text-center py-8 text-zinc-400">Müsait saatler yükleniyor...</div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500">Bu tarihte müsait saat bulunmuyor.</p>
              <Button variant="outline" className="mt-4" onClick={goBack}>Başka tarih seç</Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={`${slot.start}-${slot.staff_id}`}
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      start_time: slot.start,
                      end_time: slot.end,
                      staff_id: slot.staff_id || s.staff_id,
                      staff_name: slot.staff_name || s.staff_name,
                      step: 5,
                    }))
                    setError("")
                  }}
                  className="px-3 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all text-zinc-900"
                >
                  {new Date(slot.start).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button variant="ghost" onClick={goBack}>&larr; Geri</Button>
          </div>
        </div>
      )}

      {/* Step 5 - Customer info */}
      {state.step === 5 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Bilgileriniz</h2>
          <div className="space-y-4">
            <Input
              label="Ad Soyad"
              placeholder="Ahmet Yilmaz"
              value={state.customer_name}
              onChange={(e) => setState((s) => ({ ...s, customer_name: e.target.value }))}
              required
            />
            <Input
              label="Telefon"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="05XX XXX XX XX"
              value={state.customer_phone}
              onChange={(e) => setState((s) => ({ ...s, customer_phone: e.target.value.replace(/[^0-9+]/g, "") }))}
              required
            />
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@mail.com"
              value={state.customer_email}
              onChange={(e) => setState((s) => ({ ...s, customer_email: e.target.value }))}
              required
            />
            <Input
              label="Not (Opsiyonel)"
              placeholder="Ek bilgi ekleyebilirsiniz"
              value={state.notes}
              onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
            />
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kvkkAccepted}
                onChange={() => setKvkkAccepted(!kvkkAccepted)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-[var(--color-primary)]"
              />
              <span className="text-xs text-zinc-500">
                <a href="/sozlesmeler/KVKK" target="_blank" className="text-[var(--color-primary)] hover:underline">
                  KVKK Aydınlatma Metni
                </a>
                &apos;ni okudum ve onaylıyorum.
              </span>
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="ghost" onClick={goBack}>&larr; Geri</Button>
            <Button
              fullWidth
              size="lg"
              disabled={!state.customer_name || !state.customer_phone || !state.customer_email || !kvkkAccepted}
              onClick={() => {
                setError("")
                setState((s) => ({ ...s, step: 6 }))
              }}
            >
              Devam Et
            </Button>
          </div>
        </div>
      )}

      {/* Step 6 - Payment method */}
      {state.step === 6 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Ödeme Seçeneği</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Randevunuz işletme tarafından onaylandıktan sonra kesinleşecektir.
          </p>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-zinc-100 mb-6">
            <p className="text-sm font-medium text-zinc-900 mb-2">Rezervasyon Özeti</p>
            <div className="text-xs text-zinc-600 space-y-1">
              <p>Hizmet: {state.service_name}</p>
              <p>Personel: {state.staff_name}</p>
              <p>
                Tarih:{" "}
                {state.date && new Date(state.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p>
                Saat:{" "}
                {state.start_time && new Date(state.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setState((s) => ({ ...s, payment_method: "venue" }))}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                state.payment_method === "venue"
                  ? "border-[var(--color-primary)] bg-blue-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  state.payment_method === "venue" ? "bg-[var(--color-primary)] text-white" : "bg-zinc-100 text-zinc-400"
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-zinc-900 text-sm">Yerinde Öde</p>
                  <p className="text-xs text-zinc-500">Randevuya gittiğinizde ödemenizi yapın</p>
                </div>
              </div>
            </button>

            {/* Online ödeme — şimdilik devre dışı, sadece görünüyor */}
            <div
              aria-disabled="true"
              className="w-full text-left p-4 rounded-xl border-2 border-zinc-200 bg-zinc-50/60 opacity-60 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 text-zinc-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-zinc-700 text-sm">Online Öde</p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Yakında</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">Kartla güvenli ödeme — yakında hizmetinizde.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Turnstile doğrulama */}
          <div className="mt-6 flex justify-center">
            <Turnstile
              onVerify={handleTurnstileVerify}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>

          <div className="mt-4 flex gap-3">
            <Button variant="ghost" onClick={goBack}>&larr; Geri</Button>
            <Button
              fullWidth
              size="lg"
              loading={loading}
              disabled={!state.payment_method || !turnstileToken}
              onClick={handleSubmit}
            >
              Rezervasyon Oluştur
            </Button>
          </div>

          <p className="mt-3 text-xs text-zinc-400 text-center">
            Rezervasyonunuz işletme onayına gönderilecektir. Onaylandığında bildirim alacaksınız.
          </p>
        </div>
      )}

      {/* Step 7 - Confirmation */}
      {state.step === 7 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">
            Rezervasyonunuz Alındı!
          </h2>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
            Randevu talebiniz işletmeye iletildi.
            İşletme onayladığında <strong>e-posta</strong> ve <strong>WhatsApp</strong> ile bildirim alacaksınız.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Onay bekleniyor
          </div>

          <div className="mt-6 p-4 rounded-xl bg-zinc-100 text-left max-w-sm mx-auto">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Hizmet</span>
                <span className="font-medium text-zinc-900">{state.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Personel</span>
                <span className="font-medium text-zinc-900">{state.staff_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tarih</span>
                <span className="font-medium text-zinc-900">
                  {state.date && new Date(state.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Saat</span>
                <span className="font-medium text-zinc-900">
                  {state.start_time && new Date(state.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Ödeme</span>
                <span className="font-medium text-zinc-900">
                  {state.payment_method === "online" ? "Online Ödeme" : "Yerinde Ödeme"}
                </span>
              </div>
            </div>
          </div>

          {reservationId && (
            <div className="mt-6 space-y-3">
              <a
                href={`/randevu/${reservationId}?email=${encodeURIComponent(state.customer_email)}`}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-opacity"
              >
                Rezervasyonumu Görüntüle
              </a>
              <p className="text-xs text-zinc-400">
                Rezervasyon No: {reservationId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
