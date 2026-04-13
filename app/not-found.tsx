import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-zinc-200 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-zinc-400">404</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Sayfa Bulunamadı
        </h1>
        <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
