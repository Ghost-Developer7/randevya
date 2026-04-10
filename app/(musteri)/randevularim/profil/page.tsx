"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Card from "@/components/ui/Card"

export default function CustomerProfilePage() {
  // Mock data — API entegrasyonunda degisecek
  const [fullName, setFullName] = useState("Ahmet Yilmaz")
  const [phone, setPhone] = useState("0532 123 45 67")
  const [email, setEmail] = useState("ahmet@mail.com")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setSaved(false)
    // TODO: API
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
    }, 800)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Profilim</h1>
      <p className="text-sm text-zinc-500 mb-6">Kişisel bilgilerinizi güncelleyin</p>

      <Card>
        <div className="space-y-4">
          <Input
            label="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Telefon"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="E-posta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="pt-2 flex items-center gap-3">
            <Button loading={saving} onClick={handleSave}>
              Kaydet
            </Button>
            {saved && (
              <span className="text-sm text-emerald-600">Kaydedildi!</span>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Şifre Değiştir</h3>
        <div className="space-y-4">
          <Input
            label="Mevcut Şifre"
            type="password"
            placeholder="Mevcut şifreniz"
          />
          <Input
            label="Yeni Şifre"
            type="password"
            placeholder="En az 8 karakter"
          />
          <Input
            label="Yeni Şifre Tekrar"
            type="password"
            placeholder="Yeni şifrenizi tekrar girin"
          />
          <Button variant="outline">Şifreyi Değiştir</Button>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Bildirim Tercihleri</h3>
        <div className="space-y-3">
          {[
            { label: "E-posta bildirimleri", desc: "Randevu onay ve hatırlatmalar" },
            { label: "WhatsApp bildirimleri", desc: "WhatsApp üzerinden bildirim" },
          ].map((item) => (
            <label key={item.label} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-[#2a5cff] focus:ring-[#2a5cff]"
              />
              <div>
                <p className="text-sm font-medium text-zinc-700">{item.label}</p>
                <p className="text-xs text-zinc-400">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>
    </div>
  )
}
