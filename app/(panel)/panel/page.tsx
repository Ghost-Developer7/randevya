"use client"

import { useState, useEffect } from "react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

type DashboardData = {
  summary: { today: number; week: number; month: number; total: number }
  daily_chart: { day: string; count: number }[]
  hourly_chart: { hour: string; count: number }[]
  status: { confirmed: number; completed: number; pending: number; cancelled: number; no_show: number }
  top_services: { name: string; count: number }[]
  pending_appointments: {
    id: string; customer_name: string; customer_phone: string
    service_name: string; staff_name: string; start_time: string; notes: string | null
  }[]
  today_confirmed: {
    id: string; customer_name: string; service_name: string
    staff_name: string; start_time: string; status: string
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#22c55e", completed: "#3b82f6", pending: "#f59e0b", cancelled: "#ef4444", no_show: "#9ca3af",
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Onaylandı", completed: "Tamamlandı", pending: "Bekliyor", cancelled: "İptal", no_show: "Gelmedi",
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/panel/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id: string) => {
    await fetch(`/api/panel/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    })
    // Refresh
    const r = await fetch("/api/panel/dashboard")
    const d = await r.json()
    if (d.success) setData(d.data)
  }

  const handleReject = async (id: string) => {
    await fetch(`/api/panel/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    })
    const r = await fetch("/api/panel/dashboard")
    const d = await r.json()
    if (d.success) setData(d.data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-3 border-zinc-200 border-t-[#2a5cff] animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-zinc-400 text-center py-12">Dashboard verisi yüklenemedi</p>
  }

  const pieData = Object.entries(data.status)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABELS[key], value, color: STATUS_COLORS[key] }))

  const maxHourly = Math.max(...data.hourly_chart.map((h) => h.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">İşletmenizin genel görünümü</p>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "BUGÜN", value: data.summary.today, color: "text-[#2a5cff]" },
          { label: "BU HAFTA", value: data.summary.week, color: "text-emerald-600" },
          { label: "BU AY", value: data.summary.month, color: "text-amber-600" },
          { label: "TOPLAM", value: data.summary.total, color: "text-zinc-900" },
        ].map((c) => (
          <div key={c.label} className="p-5 rounded-2xl bg-white border border-zinc-200">
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Haftalık */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900 mb-1">Haftalık Randevular</h2>
          <p className="text-xs text-zinc-400 mb-4">Son 7 gün</p>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <AreaChart data={data.daily_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2a5cff" fill="#2a5cff" fillOpacity={0.1} strokeWidth={2} name="Randevu" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Saatlik */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900 mb-1">Yoğun Saatler</h2>
          <p className="text-xs text-zinc-400 mb-4">Saatlere göre dağılım</p>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={data.hourly_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Randevu" radius={[4, 4, 0, 0]}>
                  {data.hourly_chart.map((entry) => (
                    <Cell key={entry.hour} fill={entry.count > maxHourly * 0.7 ? "#ef4444" : entry.count > maxHourly * 0.4 ? "#f59e0b" : "#22c55e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Durum + Hizmetler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900 mb-4">Randevu Durumları</h2>
          <div className="flex items-center gap-6">
            <div style={{ width: 140, height: 140 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-zinc-600">{d.name}</span>
                  <span className="text-sm font-semibold text-zinc-900 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top hizmetler */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900 mb-4">Popüler Hizmetler</h2>
          {data.top_services.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4">Henüz veri yok</p>
          ) : (
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={data.top_services} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2a5cff" radius={[0, 4, 4, 0]} name="Randevu" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Onay Bekleyen */}
      {data.pending_appointments.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Onay Bekleyen Randevular ({data.pending_appointments.length})
          </h2>
          <div className="space-y-3">
            {data.pending_appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">{a.customer_name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Onay Bekliyor</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{a.service_name} · {a.staff_name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(a.start_time).toLocaleDateString("tr-TR", { day: "numeric", month: "short", weekday: "short" })}{" "}
                    {new Date(a.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}{" "}
                    {a.customer_phone}
                  </p>
                  {a.notes && <p className="text-xs text-zinc-500 mt-1 italic">Not: {a.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleReject(a.id)} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600">Reddet</button>
                  <button onClick={() => handleApprove(a.id)} className="px-4 py-2 text-sm font-semibold text-white bg-[#2a5cff] rounded-xl hover:opacity-90">Onayla</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bugünün Onaylı Randevuları */}
      {data.today_confirmed.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900 mb-4">Bugünün Onaylı Randevuları ({data.today_confirmed.length})</h2>
          <div className="space-y-2">
            {data.today_confirmed.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#2a5cff]">
                    {new Date(a.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{a.customer_name}</p>
                  <p className="text-xs text-zinc-500">{a.service_name} · {a.staff_name}</p>
                </div>
                <span className="text-xs text-emerald-600 font-medium">{a.status === "COMPLETED" ? "Tamamlandı" : "Onaylandı"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
