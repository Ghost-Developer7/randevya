"use client"

import { signOut, useSession } from "next-auth/react"

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-sm font-medium text-zinc-900">
          {session?.user?.name || "İşletme Paneli"}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500">
          {session?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/panel/giriş" })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 hover:text-red-600 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış
        </button>
      </div>
    </header>
  )
}
