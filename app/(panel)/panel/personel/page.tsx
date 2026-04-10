"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"

// ─── TYPES ──────────────────────────────────────────────────────────────────

type WorkDay = { start: string; end: string }
type WorkHours = Record<string, WorkDay[]>

type Staff = {
  id: string
  full_name: string
  title: string
  phone: string
  email: string
  is_active: boolean
  photo_url?: string
  work_hours: WorkHours
  services: string[]
}

// ─── FAKE DATA ──────────────────────────────────────────────────────────────

const DAY_LABELS: Record<string, string> = {
  mon: "Pazartesi", tue: "Salı", wed: "Çarşamba", thu: "Perşembe",
  fri: "Cuma", sat: "Cumartesi", sun: "Pazar",
}
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
const ALL_SERVICES = ["Saç Kesimi", "Sakal Tıraş", "Saç Boyama", "Cilt Bakımı", "Manikür", "Pedikür"]

const defaultWorkHours: WorkHours = {
  mon: [{ start: "09:00", end: "18:00" }],
  tue: [{ start: "09:00", end: "18:00" }],
  wed: [{ start: "09:00", end: "18:00" }],
  thu: [{ start: "09:00", end: "18:00" }],
  fri: [{ start: "09:00", end: "18:00" }],
  sat: [{ start: "10:00", end: "16:00" }],
  sun: [],
}

const initialStaff: Staff[] = [
  {
    id: "1",
    full_name: "Ahmet Yıldırım",
    title: "Uzman Kuaför",
    phone: "0532 111 22 33",
    email: "ahmet@isletme.com",
    is_active: true,
    work_hours: defaultWorkHours,
    services: ["Saç Kesimi", "Sakal Tıraş"],
  },
  {
    id: "2",
    full_name: "Mehmet Demir",
    title: "Berber",
    phone: "0533 222 33 44",
    email: "mehmet@isletme.com",
    is_active: true,
    work_hours: defaultWorkHours,
    services: ["Saç Kesimi", "Saç Boyama"],
  },
  {
    id: "3",
    full_name: "Zeynep Kaya",
    title: "Güzellik Uzmanı",
    phone: "0534 333 44 55",
    email: "zeynep@isletme.com",
    is_active: true,
    work_hours: { ...defaultWorkHours, sat: [], sun: [] },
    services: ["Cilt Bakımı", "Manikür", "Pedikür"],
  },
  {
    id: "4",
    full_name: "Fatma Şen",
    title: "Stajyer",
    phone: "0535 444 55 66",
    email: "fatma@isletme.com",
    is_active: false,
    work_hours: defaultWorkHours,
    services: ["Saç Kesimi"],
  },
]

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>(initialStaff)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    title: "",
    phone: "",
    email: "",
    services: [] as string[],
    work_hours: { ...defaultWorkHours } as WorkHours,
  })

  const openNew = () => {
    setEditingStaff(null)
    setForm({
      full_name: "",
      title: "",
      phone: "",
      email: "",
      services: [],
      work_hours: JSON.parse(JSON.stringify(defaultWorkHours)),
    })
    setModalOpen(true)
  }

  const openEdit = (staff: Staff) => {
    setEditingStaff(staff)
    setForm({
      full_name: staff.full_name,
      title: staff.title,
      phone: staff.phone,
      email: staff.email,
      services: [...staff.services],
      work_hours: JSON.parse(JSON.stringify(staff.work_hours)),
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.full_name || !form.title) return

    if (editingStaff) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? { ...s, full_name: form.full_name, title: form.title, phone: form.phone, email: form.email, services: form.services, work_hours: form.work_hours }
            : s
        )
      )
    } else {
      const newStaff: Staff = {
        id: `new-${Date.now()}`,
        full_name: form.full_name,
        title: form.title,
        phone: form.phone,
        email: form.email,
        is_active: true,
        work_hours: form.work_hours,
        services: form.services,
      }
      setStaffList((prev) => [...prev, newStaff])
    }
    setModalOpen(false)
  }

  const toggleActive = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    )
  }

  const handleDelete = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id))
    setDeleteConfirm(null)
  }

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }))
  }

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      work_hours: {
        ...prev.work_hours,
        [day]: prev.work_hours[day].length > 0 ? [] : [{ start: "09:00", end: "18:00" }],
      },
    }))
  }

  const updateDayTime = (day: string, field: "start" | "end", value: string) => {
    setForm((prev) => ({
      ...prev,
      work_hours: {
        ...prev.work_hours,
        [day]: prev.work_hours[day].map((wh) => ({ ...wh, [field]: value })),
      },
    }))
  }

  const activeCount = staffList.filter((s) => s.is_active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Personel</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {staffList.length} personel &middot; {activeCount} aktif
          </p>
        </div>
        <Button onClick={openNew}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Personel Ekle
        </Button>
      </div>

      {/* Staff grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {staffList.map((staff) => {
          const workDays = DAY_KEYS.filter((d) => staff.work_hours[d]?.length > 0)
          return (
            <Card key={staff.id} padding="sm" className={`${!staff.is_active ? "opacity-60" : ""}`}>
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2a5cff] to-[#6366f1] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {staff.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{staff.full_name}</p>
                      <p className="text-xs text-zinc-500">{staff.title}</p>
                    </div>
                  </div>
                  <Badge variant={staff.is_active ? "success" : "neutral"}>
                    {staff.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>

                {/* Contact */}
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {staff.phone}
                  </span>
                </div>

                {/* Services */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {staff.services.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Work days */}
                <div className="mt-3 flex gap-1">
                  {DAY_KEYS.map((d) => (
                    <span
                      key={d}
                      className={`w-7 h-7 rounded-md text-[10px] font-medium flex items-center justify-center ${
                        workDays.includes(d) ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-300"
                      }`}
                    >
                      {DAY_LABELS[d].slice(0, 2)}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(staff)} className="flex-1">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Düzenle
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(staff.id)}>
                    {staff.is_active ? "Pasife Al" : "Aktif Et"}
                  </Button>
                  <button
                    onClick={() => setDeleteConfirm(staff.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          )
        })}

        {/* Add new card */}
        <button
          onClick={openNew}
          className="h-full min-h-[200px] rounded-2xl border-2 border-dashed border-zinc-200 hover:border-[#2a5cff] hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-[#2a5cff]"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Yeni Personel Ekle</span>
        </button>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingStaff ? "Personel Düzenle" : "Yeni Personel"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ad Soyad"
              placeholder="Ahmet Yıldırım"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
            <Input
              label="Ünvan"
              placeholder="Uzman Kuaför"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Telefon"
              placeholder="05XX XXX XX XX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="E-posta"
              type="email"
              placeholder="personel@isletme.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Verdiği Hizmetler</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    form.services.includes(s)
                      ? "bg-[#2a5cff] text-white border-[#2a5cff]"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Work hours */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Çalışma Saatleri</label>
            <div className="space-y-2">
              {DAY_KEYS.map((day) => {
                const isActive = form.work_hours[day]?.length > 0
                const hours = form.work_hours[day]?.[0]
                return (
                  <div key={day} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-20 text-left text-xs font-medium py-1.5 px-2 rounded-lg transition-colors ${
                        isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {DAY_LABELS[day].slice(0, 3)}
                    </button>
                    {isActive && hours ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={hours.start}
                          onChange={(e) => updateDayTime(day, "start", e.target.value)}
                          className="px-2 py-1 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#2a5cff]"
                        />
                        <span className="text-zinc-400 text-xs">—</span>
                        <input
                          type="time"
                          value={hours.end}
                          onChange={(e) => updateDayTime(day, "end", e.target.value)}
                          className="px-2 py-1 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#2a5cff]"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">Kapalı</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" fullWidth onClick={() => setModalOpen(false)}>Vazgeç</Button>
            <Button fullWidth onClick={handleSave} disabled={!form.full_name || !form.title}>Kaydet</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Personeli Sil">
        <p className="text-sm text-zinc-600 mb-4">
          Bu personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={() => setDeleteConfirm(null)}>Vazgeç</Button>
          <Button variant="danger" fullWidth onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
