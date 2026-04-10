"use client"

import { useSearchParams, useParams } from "next/navigation"
import { useEffect, useState } from "react"
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
  service: { name: string; duration_min: number }
  staff: { full_name: string }
}

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

  useEffect(() => {
    if (!params.id || !email) return
    fetch(`/api/appointments/${params.id}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setApt(data.data)
        else setError(data.error || "Randevu bulunamadi")
      })
      .catch(() => setError("Bir hata olustu"))
      .finally(() => setLoading(false))
  }, [params.id, email])

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
      } else {
        setError(data.error || "İptal yapilamadi")
      }
    } catch {
      setError("Bir hata olustu")
    } finally {
      setCancelling(false)
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
        <div className="text-center">
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!apt) return null

  const status = statusMap[apt.status] || { label: apt.status, variant: "neutral" as const }
  const canCancel =
    (apt.status === "CONFIRMED" || apt.status === "PENDING") &&
    new Date(apt.start_time).getTime() - Date.now() > 2 * 60 * 60 * 1000

  return (
    <div className="min-h-screen bg-zinc-50 py-8 sm:py-12">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">
          Randevu Detayi
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Durum</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Hizmet</span>
            <span className="text-sm font-medium text-zinc-900">{apt.service.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Personel</span>
            <span className="text-sm font-medium text-zinc-900">{apt.staff.full_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Tarih</span>
            <span className="text-sm font-medium text-zinc-900">
              {new Date(apt.start_time).toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Saat</span>
            <span className="text-sm font-medium text-zinc-900">
              {new Date(apt.start_time).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" - "}
              {new Date(apt.end_time).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {apt.notes && (
            <div className="pt-2 border-t border-zinc-200">
              <span className="text-sm text-zinc-500">Not:</span>
              <p className="text-sm text-zinc-700 mt-1">{apt.notes}</p>
            </div>
          )}
        </div>

        {canCancel && (
          <div className="mt-6">
            <Button
              variant="danger"
              fullWidth
              loading={cancelling}
              onClick={handleCancel}
            >
              Randevuyu İptal Et
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
