"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Logo from "@/components/ui/Logo"

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<"login" | "register" | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const toggle = (menu: "login" | "register") => {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop + Mobile — shared ref container */}
          <div ref={menuRef} className="flex items-center gap-3 sm:gap-6">
            {/* Nav links — desktop only */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#nasil-calisir" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                Nasıl Çalışır?
              </a>
              <a href="#sektorler" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                Sektörler
              </a>
              <div className="h-5 w-px bg-zinc-200" />
            </div>

            {/* Giriş Yap */}
            <div className="relative">
              <button
                onClick={() => toggle("login")}
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors flex items-center gap-1"
              >
                <span className="hidden sm:inline">Giriş Yap</span>
                <span className="sm:hidden">Giriş</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === "login" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMenu === "login" && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-200/60 overflow-hidden animate-fade-in-scale">
                  <div className="p-1.5">
                    <Link
                      href="/giris"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-[#2a5cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Bireysel Giriş</p>
                        <p className="text-xs text-zinc-400">Randevu almak için</p>
                      </div>
                    </Link>
                    <Link
                      href="/panel/giris"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">İşletme Girişi</p>
                        <p className="text-xs text-zinc-400">İşletme paneline erişim</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Üye Ol */}
            <div className="relative">
              <button
                onClick={() => toggle("register")}
                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-white bg-[#2a5cff] rounded-xl hover:opacity-90 transition-opacity gap-1"
              >
                Üye Ol
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === "register" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMenu === "register" && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-200/60 overflow-hidden animate-fade-in-scale">
                  <div className="p-1.5">
                    <Link
                      href="/kayit"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-[#2a5cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Bireysel Kayıt</p>
                        <p className="text-xs text-zinc-400">Ücretsiz üye ol</p>
                      </div>
                    </Link>
                    <Link
                      href="/panel/kayit"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                        <svg className="w-4.5 h-4.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">İşletme Kaydı</p>
                        <p className="text-xs text-zinc-400">İşletmenizi ekleyin</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
