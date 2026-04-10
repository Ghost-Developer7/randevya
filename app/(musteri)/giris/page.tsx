"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Logo from "@/components/ui/Logo"

export default function CustomerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("E-posta ve şifre gereklidir")
      return
    }

    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        // Giriş başarılı — ama bu bir işletme hesabı mı kontrol et
        const session = await getSession()

        if (session?.user?.role === "TENANT_OWNER") {
          // Bu bir işletme hesabı — müşteri girişinden giremez
          setError("Bu bir işletme hesabıdır. Lütfen İşletme Girişi sayfasını kullanın.")
          // Session'ı temizle
          await signIn("credentials", { redirect: false, email: "", password: "" })
          setLoading(false)
          return
        }

        if (session?.user?.role === "PLATFORM_ADMIN") {
          setError("Admin hesabıyla bireysel giriş yapılamaz.")
          await signIn("credentials", { redirect: false, email: "", password: "" })
          setLoading(false)
          return
        }

        // Müşteri hesabı — devam et
        router.push("/randevularim")
      } else {
        setError("E-posta veya şifre hatalı")
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo />
          <Link
            href="/panel/giris"
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            İşletme Girişi &rarr;
          </Link>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Hoş Geldiniz</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Randevularınızı yönetmek için giriş yapın
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
                label="E-posta"
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Şifre"
                type="password"
                placeholder="Şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <Button type="submit" fullWidth loading={loading} size="lg">
                Giriş Yap
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button className="text-sm text-[#2a5cff] hover:underline">
                Şifremi Unuttum
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Hesabınız yok mu?{" "}
              <Link href="/kayit" className="text-[#2a5cff] font-medium hover:underline">
                Ücretsiz Üye Ol
              </Link>
            </p>
          </div>

          {/* Info */}
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-600 text-center">
              Bu sayfa bireysel müşteri girişi içindir. İşletme hesabınız varsa{" "}
              <Link href="/panel/giris" className="font-semibold underline">İşletme Girişi</Link> sayfasını kullanın.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
