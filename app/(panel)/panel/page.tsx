"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

// ─── FAKE DATA ──────────────────────────────────────────────────────────────

const fakeDailyData = [
  { day: "Pzt", count: 8 },
  { day: "Sal", count: 12 },
  { day: "Çar", count: 6 },
  { day: "Per", count: 15 },
  { day: "Cum", count: 19 },
  { day: "Cmt", count: 22 },
  { day: "Paz", count: 4 },
]

const fakeHourlyData = [
  { hour: "09", count: 3 },
  { hour: "10", count: 7 },
  { hour: "11", count: 12 },
  { hour: "12", count: 5 },
  { hour: "13", count: 8 },
  { hour: "14", count: 15 },
  { hour: "15", count: 11 },
  { hour: "16", count: 9 },
  { hour: "17", count: 6 },
  { hour: "18", count: 2 },
]

const fakeTopServices = [
  { name: "Saç Kesimi", count: 48, percent: 100 },
  { name: "Sakal Tıraş", count: 32, percent: 67 },
  { name: "Saç Boyama", count: 24, percent: 50 },
  { name: "Cilt Bakımı", count: 18, percent: 38 },
  { name: "Manikür", count: 12, percent: 25 },
]

const fakeStatusBreakdown = {
  CONFIRMED: 42,
  COMPLETED: 86,
  PENDING: 7,
  CANCELLED: 11,
  NO_SHOW: 3,
}

const fakeAppointments = [
  {
    id: "1",
    customer_name: "Elif Demir",
    customer_phone: "0532 111 22 33",
    customer_email: "elif@mail.com",
    start_time: new Date(Date.now() + 2 * 3600000).toISOString(),
    status: "PENDING",
    payment_method: "venue",
    service: { name: "Saç Kesimi" },
    staff: { full_name: "Ahmet Usta" },
  },
  {
    id: "2",
    customer_name: "Mehmet Kaya",
    customer_phone: "0533 222 33 44",
    customer_email: "mehmet@mail.com",
    start_time: new Date(Date.now() + 3 * 3600000).toISOString(),
    status: "PENDING",
    payment_method: "online",
    notes: "Kısa kesim istiyorum",
    service: { name: "Saç Kesimi" },
    staff: { full_name: "Mehmet Usta" },
  },
  {
    id: "3",
    customer_name: "Ayşe Yılmaz",
    customer_phone: "0534 333 44 55",
    customer_email: "ayse@mail.com",
    start_time: new Date(Date.now() + 4 * 3600000).toISOString(),
    status: "PENDING",
    payment_method: "venue",
    service: { name: "Cilt Bakımı" },
    staff: { full_name: "Zeynep Hanım" },
  },
  {
    id: "4",
    customer_name: "Ali Öztürk",
    customer_phone: "0535 444 55 66",
    customer_email: "ali@mail.com",
    start_time: new Date(Date.now() + 1 * 3600000).toISOString(),
    status: "CONFIRMED",
    payment_method: "online",
    service: { name: "Sakal Tıraş" },
    staff: { full_name: "Ahmet Usta" },
  },
  {
    id: "5",
    customer_name: "Fatma Şen",
    customer_phone: "0536 555 66 77",
    customer_email: "fatma@mail.com",
    start_time: new Date(Date.now() + 5 * 3600000).toISOString(),
    status: "CONFIRMED",
    payment_method: "venue",
    service: { name: "Saç Boyama" },
    staff: { full_name: "Zeynep Hanım" },
  },
  {
    id: "6",
    customer_name: "Hasan Çelik",
    customer_phone: "0537 666 77 88",
    customer_email: "hasan@mail.com",
    start_time: new Date(Date.now() + 6 * 3600000).toISOString(),
    status: "CONFIRMED",
    payment_method: "online",
    service: { name: "Saç Kesimi" },
    staff: { full_name: "Mehmet Usta" },
  },
  {
    id: "7",
    customer_name: "Zehra Arslan",
    customer_phone: "0538 777 88 99",
    customer_email: "zehra@mail.com",
    start_time: new Date(Date.now() + 7 * 3600000).toISOString(),
    status: "CONFIRMED",
    payment_method: "venue",
    service: { name: "Manikür" },
    staff: { full_name: "Zeynep Hanım" },
  },
]

// ─── STATUS CONFIG ──────────────────────────────────────────────────────────

const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  CONFIRMED: { label: "Onaylandı", variant: "success" },
  PENDING: { label: "Onay Bekliyor", variant: "warning" },
  CANCELLED: { label: "İptal", variant: "danger" },
  COMPLETED: { label: "Tamamlandı", variant: "info" },
  NO_SHOW: { label: "Gelmedi", variant: "neutral" },
}

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-emerald-500",
  COMPLETED: "bg-blue-500",
  PENDING: "bg-amber-500",
  CANCELLED: "bg-red-500",
  NO_SHOW: "bg-zinc-400",
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a1a1aa"]
const fakePieData = [
  { name: "Onaylandı", value: 42 },
  { name: "Tamamlandı", value: 86 },
  { name: "Bekliyor", value: 7 },
  { name: "İptal", value: 11 },
  { name: "Gelmedi", value: 3 },
]

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [appointments, setAppointments] = useState(fakeAppointments)

  const handleAction = (id: string, action: "confirm" | "reject") => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: action === "confirm" ? "CONFIRMED" : "CANCELLED" }
          : a
      )
    )
  }

  const pending = appointments.filter((a) => a.status === "PENDING")
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">İşletmenizin genel görünümü</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Bugün", value: 8, change: "+3", up: true, color: "text-[#2a5cff]", icon: "📅" },
          { label: "Bu Hafta", value: 86, change: "+12", up: true, color: "text-emerald-600", icon: "📊" },
          { label: "Bu Ay", value: 149, change: "+23%", up: true, color: "text-amber-600", icon: "📈" },
          { label: "Toplam", value: 1247, change: "", up: true, color: "text-zinc-900", icon: "🏆" },
        ].map((stat) => (
          <Card key={stat.label} padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                {stat.change && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {stat.change} bu hafta
                  </p>
                )}
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Area Chart */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">Haftalık Randevular</h3>
          <p className="text-xs text-zinc-400 mb-4">Son 7 gün</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fakeDailyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2a5cff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2a5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: any) => [`${value} randevu`, "Randevu"]}
                />
                <Area type="monotone" dataKey="count" stroke="#2a5cff" strokeWidth={2.5} fill="url(#colorCount)" dot={{ r: 4, fill: "#2a5cff", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Hourly Bar Chart */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">Yoğun Saatler</h3>
          <p className="text-xs text-zinc-400 mb-4">Saatlere göre dağılım</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fakeHourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}:00`} />
                <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                  formatter={(value: any) => [`${value} randevu`, "Randevu"]}
                  labelFormatter={(v) => `Saat ${v}:00`}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {fakeHourlyData.map((entry) => (
                    <Cell
                      key={entry.hour}
                      fill={entry.count >= 12 ? "#ef4444" : entry.count >= 8 ? "#f59e0b" : "#10b981"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sakin</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Normal</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Yoğun</span>
          </div>
        </Card>
      </div>

      {/* Status + Top Services row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut Chart */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Randevu Durumları</h3>
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fakePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {fakePieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                    formatter={(value: any, name: any) => [`${value}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 flex-1">
              {fakePieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-zinc-600">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                    {item.name}
                  </span>
                  <span className="text-sm font-bold text-zinc-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top services horizontal bar */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Popüler Hizmetler</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fakeTopServices} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#52525b" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                  formatter={(value: any) => [`${value} randevu`, "Randevu"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#6366f1" barSize={20} background={false}>
                  {fakeTopServices.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#2a5cff" : i === 1 ? "#6366f1" : i === 2 ? "#818cf8" : i === 3 ? "#a5b4fc" : "#c7d2fe"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-zinc-900">
              Onay Bekleyen Randevular ({pending.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pending.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900 text-sm">{apt.customer_name}</p>
                      <Badge variant="warning">Onay Bekliyor</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {apt.service.name} &middot; {apt.staff.full_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-xs text-zinc-600">
                        {new Date(apt.start_time).toLocaleDateString("tr-TR", {
                          day: "numeric", month: "short", weekday: "short",
                        })}
                        {" "}
                        {new Date(apt.start_time).toLocaleTimeString("tr-TR", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs text-zinc-400">{apt.customer_phone}</span>
                      <span className="text-xs text-zinc-400">
                        {apt.payment_method === "online" ? "Online ödeme" : "Yerinde ödeme"}
                      </span>
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-zinc-500 mt-2 italic">Not: {apt.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="danger" onClick={() => handleAction(apt.id, "reject")}>
                      Reddet
                    </Button>
                    <Button size="sm" onClick={() => handleAction(apt.id, "confirm")}>
                      Onayla
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Confirmed appointments */}
      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">
          Bugünün Onaylı Randevuları ({confirmed.length})
        </h3>
        {confirmed.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4">Onaylanmış randevu bulunmuyor.</p>
        ) : (
          <div className="space-y-2">
            {confirmed.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[3.5rem] py-1 px-2 rounded-lg bg-[#2a5cff]/10">
                    <p className="text-base font-bold text-[#2a5cff]">
                      {new Date(apt.start_time).toLocaleTimeString("tr-TR", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{apt.customer_name}</p>
                    <p className="text-xs text-zinc-500">
                      {apt.service.name} &middot; {apt.staff.full_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">
                    {apt.payment_method === "online" ? "Online" : "Yerinde"}
                  </span>
                  <Badge variant="success">Onaylandı</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
