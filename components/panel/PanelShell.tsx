"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Sidebar from "@/components/panel/Sidebar"
import Header from "@/components/panel/Header"

const AUTH_PAGES = ["/panel/giris", "/panel/kayit", "/panel/sifremi-unuttum", "/panel/sifre-sifirla"]
const SUB_FREE_PAGES = ["/panel/abonelik", "/panel/odeme-basarili", "/panel/odeme-basarisiz"]

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
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3 shrink-0">
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

function SubscriptionExpiredBanner() {
  return (
    <div className="bg-red-500 text-white px-4 py-2.5 text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-center">Aboneliğiniz sona erdi. Panel özelliklerini kullanmak için ödeme yapın.</span>
      </div>
      <Link
        href="/panel/abonelik"
        className="px-3 py-1 text-xs font-semibold rounded-lg bg-white text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
      >
        Abonelik sayfasına git →
      </Link>
    </div>
  )
}

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [subActive, setSubActive] = useState<boolean | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAuthPage = AUTH_PAGES.some((p) => pathname?.startsWith(p))
  const isSubFree = SUB_FREE_PAGES.some((p) => pathname?.startsWith(p))
  const isSubscriptionPage = pathname?.startsWith("/panel/abonelik")

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
      router.replace("/panel/abonelik")
    }
  }, [subActive, isAuthPage, isSubFree, router])

  // Auth sayfaları — shell yok
  if (isAuthPage) {
    return <>{children}</>
  }

  // Yükleniyor
  if (status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 rounded-full border-3 border-zinc-200 border-t-[#2a5cff] animate-spin" />
      </div>
    )
  }

  // Session yoksa (yönlendirme olacak, boş göster)
  if (!session) {
    return null
  }

  const showExpiredBanner = subActive === false && !isSubscriptionPage

  // Normal panel — sidebar + header
  return (
    <div className="tenant-panel flex flex-col h-dvh overflow-hidden bg-zinc-50">
      <AdminPreviewBanner />
      {showExpiredBanner && <SubscriptionExpiredBanner />}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
