"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Button from "@/components/ui/Button"

export default function PaymentSuccessPage() {
  const [sub, setSub] = useState<{
    plan_name: string; billing_period: string; total_amount: number | null; ends_at: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await fetch("/api/panel/subscription")
        const data = await res.json()
        if (data.success && data.data.active) {
          setSub(data.data.subscription)
          setLoading(false)
        } else if (retries < 10) {
          // Webhook henüz gelmemiş olabilir, 2sn sonra tekrar dene
          setTimeout(() => setRetries((r) => r + 1), 2000)
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }
    fetchSub()
  }, [retries])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        {loading ? (
          <div>
            <div className="w-14 h-14 rounded-full border-4 border-zinc-200 border-t-emerald-500 animate-spin mx-auto" />
            <p className="mt-4 text-sm font-medium text-zinc-900">Ödemeniz doğrulanıyor...</p>
            <p className="text-xs text-zinc-400 mt-1">Lütfen bekleyin</p>
          </div>
        ) : (
          <div>
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-zinc-900 mt-6">Ödeme Başarılı!</h1>
            <p className="text-sm text-zinc-500 mt-2">Ödemeniz başarıyla işlendi. Aboneliğiniz aktif edilmiştir.</p>

            {sub && (
              <div className="mt-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Plan</span>
                  <span className="font-semibold text-zinc-900">{sub.plan_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Dönem</span>
                  <span className="font-semibold text-zinc-900">{sub.billing_period === "YEARLY" ? "Yıllık" : "Aylık"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Toplam</span>
                  <span className="font-semibold text-zinc-900">{Number(sub.total_amount ?? 0).toFixed(0)} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Sonraki Yenileme</span>
                  <span className="font-semibold text-zinc-900">{new Date(sub.ends_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link href="/panel">
                <Button fullWidth>Panele Dön</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
