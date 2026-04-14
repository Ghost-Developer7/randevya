"use client"

import { useState, useEffect, useCallback } from "react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"

type ServiceData = {
  id: string; name: string; description: string | null; duration_min: number; is_active: boolean
}
type StaffData = { id: string; full_name: string; services: { id: string }[] }

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120]

export default function HizmetlerPage() {
  const [services, setServices] = useState<ServiceData[]>([])
  const [staffList, setStaffList] = useState<StaffData[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [editService, setEditService] = useState<ServiceData | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", duration_min: 45 })
  const [formStaff, setFormStaff] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [svcRes, staffRes] = await Promise.all([
        fetch("/api/panel/services"), fetch("/api/panel/staff"),
      ])
      const svcData = await svcRes.json()
      const staffData = await staffRes.json()
      if (svcData.success) setServices(svcData.data)
      if (staffData.success) setStaffList(staffData.data.map((s: StaffData & { services: { id: string; name: string }[] }) => ({
        id: s.id, full_name: s.full_name, services: s.services.map((sv: { id: string }) => ({ id: sv.id })),
      })))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Hangi personel bu hizmeti veriyor
  const getStaffForService = (serviceId: string) =>
    staffList.filter((s) => s.services.some((sv) => sv.id === serviceId))

  const openNew = () => {
    setIsNew(true); setEditService({} as ServiceData); setMsg(null)
    setForm({ name: "", description: "", duration_min: 45 })
    setFormStaff([])
  }

  const openEdit = (s: ServiceData) => {
    setIsNew(false); setEditService(s); setMsg(null)
    setForm({ name: s.name, description: s.description ?? "", duration_min: s.duration_min })
    setFormStaff(staffList.filter((st) => st.services.some((sv) => sv.id === s.id)).map((st) => st.id))
  }

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    try {
      if (isNew) {
        const res = await fetch("/api/panel/services", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, description: form.description || null, duration_min: form.duration_min }),
        })
        const data = await res.json()
        if (!data.success) { setMsg({ type: "err", text: data.error }); setSaving(false); return }
        // Personel ataması
        for (const staffId of formStaff) {
          const staff = staffList.find((s) => s.id === staffId)
          if (staff) {
            const currentIds = staff.services.map((sv) => sv.id)
            await fetch(`/api/panel/staff/${staffId}`, {
              method: "PUT", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ service_ids: [...currentIds, data.data.id] }),
            })
          }
        }
      } else {
        const res = await fetch(`/api/panel/services/${editService!.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, description: form.description || null, duration_min: form.duration_min }),
        })
        const data = await res.json()
        if (!data.success) { setMsg({ type: "err", text: data.error }); setSaving(false); return }
        // Personel ataması güncelle
        for (const st of staffList) {
          const currentIds = st.services.map((sv) => sv.id).filter((id) => id !== editService!.id)
          const shouldHave = formStaff.includes(st.id)
          const newIds = shouldHave ? [...currentIds, editService!.id] : currentIds
          await fetch(`/api/panel/staff/${st.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service_ids: newIds }),
          })
        }
      }
      setMsg({ type: "ok", text: isNew ? "Hizmet eklendi" : "Hizmet güncellendi" })
      fetchData()
      setTimeout(() => { setEditService(null); setMsg(null) }, 800)
    } catch {
      setMsg({ type: "err", text: "Bir hata oluştu" })
    }
    setSaving(false)
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm("Bu hizmeti pasife almak istediğinize emin misiniz?")) return
    const res = await fetch(`/api/panel/services/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!data.success) alert(data.error)
    fetchData()
  }

  const handleActivate = async (id: string) => {
    await fetch(`/api/panel/services/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    })
    fetchData()
  }

  const activeCount = services.filter((s) => s.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Hizmetler</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{services.length} hizmet · {activeCount} aktif</p>
        </div>
        <Button onClick={openNew}>+ Hizmet Ekle</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 rounded-full border-3 border-zinc-200 border-t-[#2a5cff] animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm">Henüz hizmet eklenmemiş</p>
          <Button onClick={openNew} className="mt-4">İlk Hizmeti Ekle</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-xs text-zinc-400 uppercase tracking-wide">
                <th className="text-left py-3 px-5 font-medium">Hizmet</th>
                <th className="text-left py-3 px-5 font-medium">Süre</th>
                <th className="text-left py-3 px-5 font-medium">Personel</th>
                <th className="text-center py-3 px-5 font-medium">Durum</th>
                <th className="text-right py-3 px-5 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const assignedStaff = getStaffForService(s.id)
                return (
                  <tr key={s.id} className={`border-b border-zinc-50 hover:bg-zinc-50/50 ${!s.is_active ? "opacity-50" : ""}`}>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-zinc-900">{s.name}</p>
                      {s.description && <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-600">{s.duration_min} dk</td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1">
                        {assignedStaff.length > 0 ? assignedStaff.map((st) => (
                          <span key={st.id} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{st.full_name}</span>
                        )) : <span className="text-xs text-zinc-300">—</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <Badge variant={s.is_active ? "success" : "neutral"}>{s.is_active ? "Aktif" : "Pasif"}</Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="text-xs text-[#2a5cff] font-medium hover:underline">Düzenle</button>
                        {s.is_active ? (
                          <button onClick={() => handleDeactivate(s.id)} className="text-xs text-red-500 font-medium hover:underline">Pasif</button>
                        ) : (
                          <button onClick={() => handleActivate(s.id)} className="text-xs text-emerald-600 font-medium hover:underline">Aktif</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {editService && (
        <Modal open={true} onClose={() => setEditService(null)} title={isNew ? "Yeni Hizmet" : "Hizmet Düzenle"}>
          <div className="space-y-4">
            <Input label="Hizmet Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Saç Kesimi" required />
            <Input label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Hizmet hakkında kısa bilgi" />

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Süre</label>
              <select
                value={form.duration_min}
                onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} dakika</option>
                ))}
              </select>
            </div>

            {/* Personel Ataması */}
            {staffList.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Bu Hizmeti Verecek Personel</label>
                <div className="flex flex-wrap gap-2">
                  {staffList.map((st) => (
                    <label key={st.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${
                      formStaff.includes(st.id) ? "border-[#2a5cff] bg-blue-50 text-[#2a5cff]" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                    }`}>
                      <input type="checkbox" checked={formStaff.includes(st.id)} onChange={(e) => {
                        setFormStaff(e.target.checked ? [...formStaff, st.id] : formStaff.filter((id) => id !== st.id))
                      }} className="hidden" />
                      {st.full_name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {msg && (
              <p className={`text-xs p-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{msg.text}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" fullWidth onClick={() => setEditService(null)}>Vazgeç</Button>
              <Button fullWidth loading={saving} disabled={!form.name.trim()} onClick={handleSave}>
                {isNew ? "Ekle" : "Kaydet"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
