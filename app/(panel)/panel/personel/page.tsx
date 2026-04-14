"use client"

import { useState, useEffect, useCallback } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"

type Service = { id: string; name: string }
type Staff = {
  id: string; full_name: string; title: string | null; photo_url: string | null
  is_active: boolean; work_hours: Record<string, { start: string; end: string }[]>
  services: Service[]
}

const DAY_LABELS: Record<string, string> = {
  mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt", sun: "Paz",
}
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

const defaultWorkHours: Record<string, { start: string; end: string }[]> = {
  mon: [{ start: "09:00", end: "18:00" }], tue: [{ start: "09:00", end: "18:00" }],
  wed: [{ start: "09:00", end: "18:00" }], thu: [{ start: "09:00", end: "18:00" }],
  fri: [{ start: "09:00", end: "18:00" }], sat: [{ start: "10:00", end: "16:00" }], sun: [],
}

export default function PersonelPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({ full_name: "", title: "" })
  const [formHours, setFormHours] = useState(defaultWorkHours)
  const [formServices, setFormServices] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const [staffRes, svcRes] = await Promise.all([
        fetch("/api/panel/staff"), fetch("/api/panel/services"),
      ])
      const staffData = await staffRes.json()
      const svcData = await svcRes.json()
      if (staffData.success) setStaff(staffData.data)
      if (svcData.success) setServices(svcData.data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const openNew = () => {
    setIsNew(true); setEditStaff({} as Staff); setMsg(null)
    setForm({ full_name: "", title: "" })
    setFormHours(defaultWorkHours)
    setFormServices([])
  }

  const openEdit = (s: Staff) => {
    setIsNew(false); setEditStaff(s); setMsg(null)
    setForm({ full_name: s.full_name, title: s.title ?? "" })
    setFormHours(s.work_hours)
    setFormServices(s.services.map((sv) => sv.id))
  }

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    try {
      if (isNew) {
        const res = await fetch("/api/panel/staff", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: form.full_name, title: form.title || null, work_hours: formHours }),
        })
        const data = await res.json()
        if (!data.success) { setMsg({ type: "err", text: data.error }); setSaving(false); return }
        // Hizmet ataması
        if (formServices.length > 0) {
          await fetch(`/api/panel/staff/${data.data.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service_ids: formServices }),
          })
        }
      } else {
        await fetch(`/api/panel/staff/${editStaff!.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: form.full_name, title: form.title || null, work_hours: formHours }),
        })
        await fetch(`/api/panel/staff/${editStaff!.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service_ids: formServices }),
        })
      }
      setMsg({ type: "ok", text: isNew ? "Personel eklendi" : "Personel güncellendi" })
      fetchStaff()
      setTimeout(() => { setEditStaff(null); setMsg(null) }, 800)
    } catch {
      setMsg({ type: "err", text: "Bir hata oluştu" })
    }
    setSaving(false)
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm("Bu personeli pasife almak istediğinize emin misiniz?")) return
    const res = await fetch(`/api/panel/staff/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!data.success) alert(data.error)
    fetchStaff()
  }

  const handleActivate = async (id: string) => {
    await fetch(`/api/panel/staff/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    })
    fetchStaff()
  }

  const toggleDayHours = (day: string) => {
    setFormHours((prev) => ({
      ...prev,
      [day]: prev[day]?.length ? [] : [{ start: "09:00", end: "18:00" }],
    }))
  }

  const updateDayTime = (day: string, field: "start" | "end", value: string) => {
    setFormHours((prev) => ({
      ...prev,
      [day]: prev[day]?.length ? [{ ...prev[day][0], [field]: value }] : [{ start: "09:00", end: "18:00", [field]: value }],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Personel</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Personel listesini yönetin</p>
        </div>
        <Button onClick={openNew}>Personel Ekle</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 rounded-full border-3 border-zinc-200 border-t-[#2a5cff] animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm">Henüz personel eklenmemiş</p>
          <Button onClick={openNew} className="mt-4">İlk Personeli Ekle</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s.id} className={`rounded-2xl bg-white border border-zinc-200 overflow-hidden ${!s.is_active ? "opacity-60" : ""}`}>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-lg font-bold text-zinc-400">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.full_name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      s.full_name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 truncate">{s.full_name}</h3>
                      <Badge variant={s.is_active ? "success" : "neutral"}>{s.is_active ? "Aktif" : "Pasif"}</Badge>
                    </div>
                    {s.title && <p className="text-xs text-zinc-500 mt-0.5">{s.title}</p>}
                  </div>
                </div>

                {/* Hizmetler */}
                {s.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.services.map((sv) => (
                      <span key={sv.id} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{sv.name}</span>
                    ))}
                  </div>
                )}

                {/* Çalışma saatleri özeti */}
                <div className="flex gap-1 mt-3">
                  {DAY_KEYS.map((day) => {
                    const has = s.work_hours[day]?.length > 0
                    return (
                      <span key={day} className={`text-[10px] font-medium w-7 h-6 flex items-center justify-center rounded ${has ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 text-zinc-300"}`}>
                        {DAY_LABELS[day]}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-zinc-100 p-3 flex gap-2">
                <button onClick={() => openEdit(s)} className="flex-1 py-2 text-xs font-medium text-[#2a5cff] hover:bg-blue-50 rounded-lg transition-colors">Düzenle</button>
                {s.is_active ? (
                  <button onClick={() => handleDeactivate(s.id)} className="flex-1 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">Pasife Al</button>
                ) : (
                  <button onClick={() => handleActivate(s.id)} className="flex-1 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">Aktife Al</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {editStaff && (
        <Modal open={true} onClose={() => setEditStaff(null)} title={isNew ? "Personel Ekle" : "Personel Düzenle"}>
          <div className="space-y-4">
            <Input label="Ad Soyad" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ahmet Yıldırım" required />
            <Input label="Ünvan (Opsiyonel)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Uzman Kuaför" />

            {/* Hizmet Ataması */}
            {services.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Verdiği Hizmetler</label>
                <div className="flex flex-wrap gap-2">
                  {services.map((sv) => (
                    <label key={sv.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${
                      formServices.includes(sv.id) ? "border-[#2a5cff] bg-blue-50 text-[#2a5cff]" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                    }`}>
                      <input type="checkbox" checked={formServices.includes(sv.id)} onChange={(e) => {
                        setFormServices(e.target.checked ? [...formServices, sv.id] : formServices.filter((id) => id !== sv.id))
                      }} className="hidden" />
                      {sv.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Çalışma Saatleri */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Çalışma Saatleri</label>
              <div className="space-y-2">
                {DAY_KEYS.map((day) => {
                  const active = formHours[day]?.length > 0
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 w-20 cursor-pointer">
                        <input type="checkbox" checked={active} onChange={() => toggleDayHours(day)} className="accent-[#2a5cff]" />
                        <span className={`text-xs font-medium ${active ? "text-zinc-900" : "text-zinc-400"}`}>{DAY_LABELS[day]}</span>
                      </label>
                      {active ? (
                        <div className="flex items-center gap-2">
                          <input type="time" value={formHours[day][0]?.start ?? "09:00"} onChange={(e) => updateDayTime(day, "start", e.target.value)} className="px-2 py-1 text-xs rounded-lg border border-zinc-300 focus:ring-1 focus:ring-[#2a5cff]" />
                          <span className="text-xs text-zinc-400">—</span>
                          <input type="time" value={formHours[day][0]?.end ?? "18:00"} onChange={(e) => updateDayTime(day, "end", e.target.value)} className="px-2 py-1 text-xs rounded-lg border border-zinc-300 focus:ring-1 focus:ring-[#2a5cff]" />
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-300">Kapalı</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {msg && (
              <p className={`text-xs p-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{msg.text}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" fullWidth onClick={() => setEditStaff(null)}>Vazgeç</Button>
              <Button fullWidth loading={saving} disabled={!form.full_name.trim()} onClick={handleSave}>
                {isNew ? "Ekle" : "Kaydet"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
