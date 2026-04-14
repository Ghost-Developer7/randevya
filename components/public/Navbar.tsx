"use client"

import Link from "next/link"
import Logo from "@/components/ui/Logo"

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          <div className="flex items-center gap-3 sm:gap-6">
            {/* Nav links — desktop only */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#nasil-calisir" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                Nasıl Çalışır?
              </a>
              <a href="#sektorler" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                Sektörler
              </a>
              <a href="#fiyatlandirma" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                Fiyatlandırma
              </a>
              <a href="/iletisim" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                İletişim
              </a>
              <div className="h-5 w-px bg-zinc-200" />
            </div>

            {/* Giriş Yap */}
            <Link
              href="/panel/giris"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
            >
              Giriş Yap
            </Link>

            {/* İşletme Kaydı */}
            <Link
              href="/panel/kayit"
              className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-white bg-[#2a5cff] rounded-xl hover:opacity-90 transition-opacity"
            >
              İşletmemi Ekle
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
