"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/panel/Sidebar"
import Header from "@/components/panel/Header"

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.includes("/giris") || pathname.includes("/kayit")

  if (isAuthPage) {
    return <>{children}</>
  }

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
