"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Sidebar from "@/components/panel/Sidebar"
import Header from "@/components/panel/Header"

const AUTH_PAGES = ["/panel/giris", "/panel/kayit", "/panel/sifremi-unuttum", "/panel/sifre-sifirla"]
const SUB_FREE_PAGES = ["/panel/ayarlar", "/panel/odeme-basarili", "/panel/odeme-basarisiz"]

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [subActive, setSubActive] = useState<boolean | null>(null)

  const isAuthPage = AUTH_PAGES.some((p) => pathname?.startsWith(p))
  const isSubFree = SUB_FREE_PAGES.some((p) => pathname?.startsWith(p))

  // Auth kontrolü — giriş yapmamışsa ve auth sayfasında değilse yönlendir
  useEffect(() => {
    if (status === "loading") return
    if (!session && !isAuthPage) {
      router.replace("/panel/giris")
    }
  }, [status, session, isAuthPage, router])

  // Abonelik kontrolü — tenant kullanıcı için
  useEffect(() => {
    if (status !== "authenticated" || !session) return
    if (session.user.role !== "TENANT_OWNER") { setSubActive(true); return }

    fetch("/api/panel/subscription")
      .then((r) => r.json())
      .then((data) => setSubActive(data.success && data.data.active))
      .catch(() => setSubActive(false))
  }, [status, session])

  // Abonelik yoksa izinsiz sayfada ise yönlendir
  useEffect(() => {
    if (subActive === false && !isAuthPage && !isSubFree) {
      router.replace("/panel/ayarlar")
    }
  }, [subActive, isAuthPage, isSubFree, router])

  // Auth sayfaları — shell yok
  if (isAuthPage) {
    return <>{children}</>
  }

  // Yükleniyor
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 rounded-full border-3 border-zinc-200 border-t-[#2a5cff] animate-spin" />
      </div>
    )
  }

  // Session yoksa (yönlendirme olacak, boş göster)
  if (!session) {
    return null
  }

  // Normal panel — sidebar + header
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
