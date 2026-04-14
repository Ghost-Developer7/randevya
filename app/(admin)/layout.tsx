"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import SessionProvider from "@/components/panel/SessionProvider"
import Logo from "@/components/ui/Logo"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "İşletmeler", href: "/admin/tenants", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { label: "Ödemeler", href: "/admin/odemeler", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { label: "Kuponlar", href: "/admin/kuponlar", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { label: "Planlar", href: "/admin/plans", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "E-Posta", href: "/admin/email-ayarlari", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { label: "Giriş Limitleri", href: "/admin/rate-limit", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { label: "Destek", href: "/admin/support", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
]

function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "PLATFORM_ADMIN") {
      router.replace("/panel/giris")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 rounded-full border-3 border-zinc-200 border-t-[#2a5cff] animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-zinc-100">
          <Logo size="sm" />
          <p className="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wider">Admin Panel</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#2a5cff]/10 text-[#2a5cff]"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-zinc-100">
          <Link href="/panel" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:bg-zinc-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            Panele Dön
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-sm font-semibold text-zinc-900">
            {NAV_ITEMS.find((i) => i.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(i.href))?.label ?? "Admin"}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500">{session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/panel/giris" })}
              className="text-xs text-zinc-500 hover:text-red-600 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  )
}
