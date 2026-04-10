"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Logo from "@/components/ui/Logo"

export default function CustomerPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleLogout = () => {
    // TODO: API entegrasyonu — session temizleme
    router.push("/giris")
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link
              href="/randevularim"
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Randevularım
            </Link>
            <Link
              href="/randevularim/profil"
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Profilim
            </Link>
            <div className="h-4 w-px bg-zinc-200 mx-0.5 sm:mx-1" />
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Çıkış
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
