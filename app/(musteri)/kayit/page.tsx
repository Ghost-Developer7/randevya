"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Logo from "@/components/ui/Logo"

export default function CustomerRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [kvkkAccepted, setKvkkAccepted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor")
      return
    }
    if (!kvkkAccepted) {
      setError("KVKK metnini onaylamanız gerekiyor")
      return
    }

    setLoading(true)

    // TODO: API entegrasyonu yapilacak
    setTimeout(() => {
      setLoading(false)
      router.push("/giris?registered=true")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo />
          <Link
            href="/panel/kayit"
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            İşletme Kaydı &rarr;
          </Link>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Üye Ol</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Ücretsiz hesap oluşturun ve randevu almaya başlayın
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Input
                label="Ad Soyad"
                placeholder="Ahmet Yilmaz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Telefon"
                type="tel"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <Input
                label="E-posta"
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Şifre"
                type="password"
                placeholder="En az 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label="Şifre Tekrar"
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                error={passwordConfirm && password !== passwordConfirm ? "Şifreler eşleşmiyor" : undefined}
                required
              />

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={() => setKvkkAccepted(!kvkkAccepted)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-[#2a5cff] focus:ring-[#2a5cff]"
                />
                <span className="text-xs text-zinc-500">
                  <Link href="/sozlesmeler/KVKK" target="_blank" className="text-[#2a5cff] hover:underline">
                    KVKK Aydınlatma Metni
                  </Link>
                  {" "}ve{" "}
                  <Link href="/sozlesmeler/TERMS_OF_USE" target="_blank" className="text-[#2a5cff] hover:underline">
                    Kullanım Koşulları
                  </Link>
                  &apos;ni okudum ve kabul ediyorum.
                </span>
              </label>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                size="lg"
                disabled={!kvkkAccepted}
              >
                Üye Ol
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Zaten hesabınız var mı?{" "}
              <Link href="/giris" className="text-[#2a5cff] font-medium hover:underline">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
