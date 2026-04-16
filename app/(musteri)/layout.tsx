import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Randevya - Hesabım",
    template: "%s | Randevya",
  },
}

export default function MusteriLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#2a5cff] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-base sm:text-lg font-bold text-zinc-900">Randevya</span>
          </a>
          <nav className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <a
              href="/randevularim"
              className="text-zinc-600 hover:text-zinc-900 transition-colors whitespace-nowrap"
            >
              Randevularım
            </a>
            <a
              href="/randevularim/profil"
              className="text-zinc-600 hover:text-zinc-900 transition-colors whitespace-nowrap"
            >
              Profil
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
