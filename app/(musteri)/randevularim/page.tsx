"use client"

import { useState } from "react"
import Link from "next/link"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"

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

export default function MyAppointmentsPage() {
  const [tab, setTab] = useState<Tab>("upcoming")

  const now = new Date()
  const upcoming = mockAppointments.filter(
    (a) => new Date(a.date) >= now && a.status !== "CANCELLED"
  )
  const past = mockAppointments.filter(
    (a) => new Date(a.date) < now || a.status === "CANCELLED" || a.status === "COMPLETED"
  )
  const list = tab === "upcoming" ? upcoming : past

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Randevularım</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Tüm randevularınızı buradan takip edin</p>
        </div>
        <Link href="/">
          <Button size="sm" className="w-full sm:w-auto">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Randevu
          </Button>
        </Link>
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
            <Link href="/">
              <Button size="sm" className="mt-4">Randevu Al</Button>
            </Link>
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
                      <div className="flex items-center gap-3 mt-2">
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
    </div>
  )
}
