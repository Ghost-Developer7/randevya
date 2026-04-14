"use client"

import Link from "next/link"
import Button from "@/components/ui/Button"

export default function PaymentFailurePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 mt-6">Ödeme Başarısız</h1>
        <p className="text-sm text-zinc-500 mt-2">
          Ödemeniz işlenemedi. Lütfen tekrar deneyin veya farklı bir kart kullanın.
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-700">
            Kartınızın bakiyesini kontrol edin, 3D Secure doğrulamasının aktif olduğundan emin olun.
            Sorun devam ederse bankanızla iletişime geçin.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/panel/ayarlar" className="flex-1">
            <Button fullWidth>Tekrar Dene</Button>
          </Link>
          <Link href="/panel/destek" className="flex-1">
            <Button variant="outline" fullWidth>Destek</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
