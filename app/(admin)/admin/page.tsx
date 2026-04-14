"use client"

import { useState, useEffect } from "react"

type Stats = {
  tenants: { total: number; active: number; new_this_month: number }
  appointments: { total: number; this_month: number; last_month: number; growth_pct: number | null }
  subscriptions: { active: number; by_plan: { plan_name: string; count: number }[] }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { if (data.success) setStats(data.data) })
      .catch(() => {})
  }, [])

  const cards = [
    { label: "Toplam İşletme", value: stats?.tenants.total ?? "—", sub: stats ? `${stats.tenants.active} aktif` : "", color: "text-[#2a5cff]" },
    { label: "Aktif Abonelik", value: stats?.subscriptions.active ?? "—", sub: "", color: "text-emerald-600" },
    { label: "Bu Ay Randevu", value: stats?.appointments.this_month ?? "—", sub: stats?.appointments.growth_pct != null ? `${stats.appointments.growth_pct > 0 ? "+" : ""}${stats.appointments.growth_pct}% geçen aya göre` : "", color: "text-amber-600" },
    { label: "Yeni İşletme (Bu Ay)", value: stats?.tenants.new_this_month ?? "—", sub: "", color: "text-violet-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Platform genel görünümü</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="p-5 rounded-2xl bg-white border border-zinc-200">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            {c.sub && <p className="text-xs text-zinc-400 mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Plan dağılımı */}
      {stats?.subscriptions.by_plan && stats.subscriptions.by_plan.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900 mb-3">Plan Dağılımı</h2>
          <div className="space-y-2">
            {stats.subscriptions.by_plan.map((p) => (
              <div key={p.plan_name} className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">{p.plan_name}</span>
                <span className="text-sm font-semibold text-zinc-900">{p.count} abonelik</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
