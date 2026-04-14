"use client"

import { useState, useCallback } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Logo from "@/components/ui/Logo"
import Turnstile from "@/components/ui/Turnstile"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), [])
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(null), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!turnstileToken) {
      setError("Lütfen güvenlik doğrulamasını tamamlayın")
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
        const session = await getSession()
        if (session?.user?.role === "TENANT_OWNER" || session?.user?.role === "PLATFORM_ADMIN") {
          router.push("/panel")
        } else {
          setError("Geçersiz hesap türü")
        }
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
    <div className="min-h-screen flex">
      {/* Left - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#2a5cff] relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Logo size="lg" invertText />
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Randevu yönetiminizi
              <br />
              kolaylaştırın
            </h2>
            <p className="mt-4 text-blue-100 text-lg max-w-md">
              Müşterileriniz online randevu alsın, siz işletmenize odaklanın.
            </p>
          </div>
          <p className="text-sm text-blue-200">
            &copy; 2026 Randevya. Tüm hakları saklıdır.
          </p>
        </div>
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-white/5" />
      </div>

      {/* Right - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold text-zinc-900">Giriş Yap</h1>
          <p className="mt-2 text-sm text-zinc-600">İşletme panelinize erişim için giriş yapın</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
            )}

            <Input label="E-posta" type="email" placeholder="ornek@isletme.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Şifre" type="password" placeholder="Şifrenizi girin" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />

            <Turnstile onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} />

            <Button type="submit" fullWidth loading={loading} size="lg" disabled={!turnstileToken}>
              Giriş Yap
            </Button>

            <div className="text-right mt-2">
              <Link href="/panel/sifremi-unuttum" className="text-xs text-zinc-500 hover:text-[#2a5cff] transition-colors">Şifremi Unuttum</Link>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600">
              Hesabınız yok mu?{" "}
              <Link href="/panel/kayit" className="text-[#2a5cff] font-medium hover:underline">Ücretsiz Kayıt Ol</Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">&larr; Ana sayfaya dön</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
