"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Service = {
  id: string
  name: string
  description: string
  duration_min: number
  price: number
  is_active: boolean
  staff: string[]
  category: string
  appointment_count: number
}

// ─── FAKE DATA ──────────────────────────────────────────────────────────────

const CATEGORIES = ["Saç", "Sakal", "Bakım", "Tırnak"]
const ALL_STAFF = ["Ahmet Yıldırım", "Mehmet Demir", "Zeynep Kaya", "Fatma Şen"]
const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120]

const initialServices: Service[] = [
  {
    id: "1",
    name: "Saç Kesimi",
    description: "Yıkama dahil erkek/kadın saç kesimi",
    duration_min: 45,
    price: 250,
    is_active: true,
    staff: ["Ahmet Yıldırım", "Mehmet Demir"],
    category: "Saç",
    appointment_count: 48,
  },
  {
    id: "2",
    name: "Sakal Tıraş",
    description: "Klasik ustura ile sakal tıraşı ve şekillendirme",
    duration_min: 30,
    price: 150,
    is_active: true,
    staff: ["Ahmet Yıldırım"],
    category: "Sakal",
    appointment_count: 32,
  },
  {
    id: "3",
    name: "Saç Boyama",
    description: "Tek renk veya röfle saç boyama işlemi",
    duration_min: 90,
    price: 500,
    is_active: true,
    staff: ["Mehmet Demir", "Zeynep Kaya"],
    category: "Saç",
    appointment_count: 24,
  },
  {
    id: "4",
    name: "Cilt Bakımı",
    description: "Derin temizlik, peeling ve nemlendirme",
    duration_min: 60,
    price: 400,
    is_active: true,
    staff: ["Zeynep Kaya"],
    category: "Bakım",
    appointment_count: 18,
  },
  {
    id: "5",
    name: "Manikür",
    description: "El bakımı, tırnak şekillendirme ve oje",
    duration_min: 45,
    price: 200,
    is_active: true,
    staff: ["Zeynep Kaya"],
    category: "Tırnak",
    appointment_count: 12,
  },
  {
    id: "6",
    name: "Pedikür",
    description: "Ayak bakımı, nasır alma ve oje",
    duration_min: 60,
    price: 250,
    is_active: false,
    staff: ["Zeynep Kaya"],
    category: "Tırnak",
    appointment_count: 5,
  },
]

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("all")

  // Form
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_min: 45,
    price: 0,
    category: "Saç",
    staff: [] as string[],
  })

  const openNew = () => {
    setEditingService(null)
    setForm({ name: "", description: "", duration_min: 45, price: 0, category: "Saç", staff: [] })
    setModalOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditingService(s)
    setForm({
      name: s.name,
      description: s.description,
      duration_min: s.duration_min,
      price: s.price,
      category: s.category,
      staff: [...s.staff],
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name) return
    if (editingService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? { ...s, name: form.name, description: form.description, duration_min: form.duration_min, price: form.price, category: form.category, staff: form.staff }
            : s
        )
      )
    } else {
      setServices((prev) => [
        ...prev,
        {
          id: `new-${Date.now()}`,
          name: form.name,
          description: form.description,
          duration_min: form.duration_min,
          price: form.price,
          is_active: true,
          staff: form.staff,
          category: form.category,
          appointment_count: 0,
        },
      ])
    }
    setModalOpen(false)
  }

  const toggleActive = (id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s)))
  }

  const handleDelete = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id))
    setDeleteConfirm(null)
  }

  const toggleStaff = (name: string) => {
    setForm((prev) => ({
      ...prev,
      staff: prev.staff.includes(name) ? prev.staff.filter((s) => s !== name) : [...prev.staff, name],
    }))
  }

  const filtered = filterCategory === "all" ? services : services.filter((s) => s.category === filterCategory)
  const activeCount = services.filter((s) => s.is_active).length

  const categoryIcons: Record<string, string> = { "Saç": "✂️", "Sakal": "🪒", "Bakım": "💆", "Tırnak": "💅" }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Hizmetler</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {services.length} hizmet &middot; {activeCount} aktif
          </p>
        </div>
        <Button onClick={openNew}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Hizmet Ekle
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterCategory === c
                ? "bg-[#2a5cff] text-white"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            {c === "all" ? "Tümü" : `${categoryIcons[c] || ""} ${c}`}
          </button>
        ))}
      </div>

      {/* Services table/list */}
      <Card padding="sm">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide border-b border-zinc-100">
          <div className="col-span-4">Hizmet</div>
          <div className="col-span-2">Süre / Ücret</div>
          <div className="col-span-3">Personel</div>
          <div className="col-span-1 text-center">Randevu</div>
          <div className="col-span-1 text-center">Durum</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-50">
          {filtered.map((service) => (
            <div
              key={service.id}
              className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3 sm:items-center hover:bg-zinc-50 transition-colors ${
                !service.is_active ? "opacity-50" : ""
              }`}
            >
              {/* Name + desc */}
              <div className="sm:col-span-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{categoryIcons[service.category] || "📋"}</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{service.name}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">{service.description}</p>
                  </div>
                </div>
              </div>

              {/* Duration + Price */}
              <div className="sm:col-span-2 flex items-center gap-3 sm:block">
                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {service.duration_min} dk
                </div>
                <p className="text-sm font-bold text-zinc-900 sm:mt-0.5">{service.price} ₺</p>
              </div>

              {/* Staff */}
              <div className="sm:col-span-3">
                <div className="flex flex-wrap gap-1">
                  {service.staff.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-700 rounded-full">
                      {s.split(" ")[0]}
                    </span>
                  ))}
                  {service.staff.length === 0 && <span className="text-xs text-zinc-300">Atanmamış</span>}
                </div>
              </div>

              {/* Count */}
              <div className="sm:col-span-1 text-center hidden sm:block">
                <span className="text-sm font-bold text-zinc-700">{service.appointment_count}</span>
              </div>

              {/* Status */}
              <div className="sm:col-span-1 text-center hidden sm:block">
                <Badge variant={service.is_active ? "success" : "neutral"}>
                  {service.is_active ? "Aktif" : "Pasif"}
                </Badge>
              </div>

              {/* Actions */}
              <div className="sm:col-span-1 flex items-center justify-end gap-1">
                <button
                  onClick={() => openEdit(service)}
                  className="p-1.5 text-zinc-400 hover:text-[#2a5cff] rounded-lg hover:bg-blue-50 transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleActive(service.id)}
                  className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-colors"
                  title={service.is_active ? "Pasife al" : "Aktif et"}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {service.is_active ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteConfirm(service.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Sil"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-400 text-sm">Bu kategoride hizmet bulunmuyor.</div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingService ? "Hizmet Düzenle" : "Yeni Hizmet"}>
        <div className="space-y-4">
          <Input
            label="Hizmet Adı"
            placeholder="Saç Kesimi"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Açıklama"
            placeholder="Hizmet hakkında kısa bilgi"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Süre</label>
              <select
                value={form.duration_min}
                onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} dk</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ücret (₺)</label>
              <input
                type="number"
                min={0}
                step={10}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff assignment */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Bu Hizmeti Verecek Personel</label>
            <div className="flex flex-wrap gap-2">
              {ALL_STAFF.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStaff(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    form.staff.includes(s)
                      ? "bg-violet-500 text-white border-violet-500"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" fullWidth onClick={() => setModalOpen(false)}>Vazgeç</Button>
            <Button fullWidth onClick={handleSave} disabled={!form.name}>Kaydet</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hizmeti Sil">
        <p className="text-sm text-zinc-600 mb-4">
          Bu hizmeti silmek istediğinize emin misiniz? Mevcut randevular etkilenmez.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={() => setDeleteConfirm(null)}>Vazgeç</Button>
          <Button variant="danger" fullWidth onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Sil</Button>
        </div>
      </Modal>
    </div>
  )
}
