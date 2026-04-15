"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Sidebar from "@/components/panel/Sidebar"
import Header from "@/components/panel/Header"

const AUTH_PAGES = ["/panel/giris", "/panel/kayit", "/panel/sifremi-unuttum", "/panel/sifre-sifirla"]
const SUB_FREE_PAGES = ["/panel/ayarlar", "/panel/odeme-basarili", "/panel/odeme-basarisiz"]

function AdminPreviewBanner() {
  const [previewTenant, setPreviewTenant] = useState<string | null>(null)

  useEffect(() => {
    // Cookie'den preview tenant bilgisini oku
    const match = document.cookie.match(/(?:^|;\s*)admin_preview_tenant=([^;]+)/)
    if (match) setPreviewTenant(match[1])
  }, [])

  if (!previewTenant) return null

  const exitPreview = async () => {
    await fetch("/api/admin/tenant-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    })
    window.close()
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3">
      <span>Admin onizleme modu</span>
      <button
        onClick={exitPreview}
        className="px-3 py-1 text-xs font-semibold rounded-lg bg-white text-amber-600 hover:bg-amber-50 transition-colors"
      >
        Onizlemeden Cik
      </button>
    </div>
  )
}

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
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50">
      <AdminPreviewBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
