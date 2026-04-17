"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { provinces } from "@/lib/turkey-locations"

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, selector: string) => void
  }
}

type BillingAddress = {
  id: string; type: "BIREYSEL" | "KURUMSAL"; label: string | null
  full_name: string | null; tc_kimlik: string | null
  company_name: string | null; tax_office: string | null; tax_number: string | null
  address: string; city: string; district: string; phone: string
  is_default: boolean
}

type SubscriptionHistory = {
  id: string; plan_name: string; billing_period: string
  net_amount: number | null; total_amount: number | null
  starts_at: string; ends_at: string; status: string; paytr_ref: string | null
  invoices: { id: string; invoice_number: string; status: string; pdf_url: string | null }[]
}

const KDV_RATE = 0.20
const YEARLY_MULTIPLIER = 9

type DbPlan = {
  id: string
  name: string
  price_monthly: number
  max_staff: number
  max_services: number
  whatsapp_enabled: boolean
  custom_domain: boolean
  waitlist_enabled: boolean
  analytics: boolean
  priority_support: boolean
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([])
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<"confirm" | "billing" | "iframe" | null>(null)

  // Billing address
  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [billingTab, setBillingTab] = useState<"saved" | "new">("saved")
  const [addressType, setAddressType] = useState<"BIREYSEL" | "KURUMSAL">("BIREYSEL")
  const [saveAddressCheck, setSaveAddressCheck] = useState(true)
  const [newAddr, setNewAddr] = useState({
    label: "", full_name: "", tc_kimlik: "", company_name: "", tax_office: "", tax_number: "",
    address: "", city: "", district: "", phone: "",
  })

  // Mesafeli satış sözleşmesi onayı
  const [distanceSalesAccepted, setDistanceSalesAccepted] = useState(false)

  // Kupon
  const [couponCode, setCouponCode] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon_id: string; discount_percent: number; code: string } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)

  // PayTR iframe
  const [iframeToken, setIframeToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  // Payment history
  const [history, setHistory] = useState<SubscriptionHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // Current subscription
  const [activeSub, setActiveSub] = useState<{ plan_name: string; billing_period: string; total_amount: number | null; ends_at: string } | null>(null)

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/panel/billing-addresses")
      const data = await res.json()
      if (data.success) {
        setBillingAddresses(data.data.addresses)
        const def = data.data.addresses.find((a: BillingAddress) => a.is_default)
        if (def) setSelectedAddressId(def.id)
      }
    } catch { /* ignore */ }
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/panel/subscription/history")
      const data = await res.json()
      if (data.success) setHistory(data.data.subscriptions)
    } catch { /* ignore */ }
    setHistoryLoading(false)
  }, [])

  const fetchActiveSub = useCallback(async () => {
    try {
      const res = await fetch("/api/panel/subscription")
      const data = await res.json()
      if (data.success && data.data.active) setActiveSub(data.data.subscription)
    } catch { /* ignore */ }
  }, [])

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/panel/plans")
      const data = await res.json()
      if (data.success) {
        setDbPlans(data.data.plans)
        setCurrentPlan(data.data.current_plan_id)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchAddresses(); fetchHistory(); fetchActiveSub(); fetchPlans()
  }, [fetchAddresses, fetchHistory, fetchActiveSub, fetchPlans])

  const tick = (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
  const cross = (
    <svg className="w-4 h-4 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )

  type PlanCard = {
    id: string
    name: string
    desc: string
    netMonthly: number
    isFree: boolean
    highlighted?: boolean
    features: { text: string; has: boolean }[]
  }

  const plans: PlanCard[] = dbPlans.map((p, i, arr) => {
    const paid = arr.filter((x) => x.price_monthly > 0)
    const mostExpensive = paid[paid.length - 1]
    const isHighlighted = mostExpensive?.id === p.id
    const isFree = p.price_monthly === 0
    return {
      id: p.id,
      name: p.name,
      desc: isFree
        ? "Paketi 14 gün ücretsiz deneyin"
        : isHighlighted
          ? "Büyüyen işletmeler için gelişmiş paket"
          : "Küçük işletmeler için temel paket",
      netMonthly: Number(p.price_monthly),
      isFree,
      highlighted: isHighlighted,
      features: isFree
        ? [{ text: "Tüm temel özellikler", has: true }, { text: "14 gün süre limiti", has: true }]
        : [
            { text: p.max_staff >= 999 ? "Sınırsız personel" : `${p.max_staff} personele kadar`, has: true },
            { text: p.max_services >= 999 ? "Sınırsız hizmet" : `${p.max_services} hizmete kadar`, has: true },
            { text: "E-posta bildirimleri", has: true },
            { text: "WhatsApp bildirim", has: p.whatsapp_enabled },
            { text: "Özel alan adı", has: p.custom_domain },
            { text: "Bekleme listesi", has: p.waitlist_enabled },
            { text: "Analitik & rapor", has: p.analytics },
            { text: "Öncelikli destek", has: p.priority_support },
          ],
    }
  })

  const getPricing = (netMonthly: number, period: "monthly" | "yearly") => {
    const net = period === "yearly" ? netMonthly * YEARLY_MULTIPLIER : netMonthly
    const kdv = Math.round(net * KDV_RATE * 100) / 100
    const total = Math.round((net + kdv) * 100) / 100
    return { net, kdv, total }
  }

  const selectedDistricts = provinces.find((p) => p.name === newAddr.city)?.districts ?? []

  const isNewAddressValid = () => {
    if (!newAddr.address || !newAddr.city || !newAddr.district || !newAddr.phone) return false
    if (addressType === "BIREYSEL" && (!newAddr.full_name || !newAddr.tc_kimlik || newAddr.tc_kimlik.length !== 11)) return false
    if (addressType === "KURUMSAL" && (!newAddr.company_name || !newAddr.tax_office || !newAddr.tax_number)) return false
    return true
  }

  const handleValidateCoupon = async (planId: string) => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    setAppliedCoupon(null)
    try {
      const res = await fetch("/api/panel/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), plan_id: planId }),
      })
      const data = await res.json()
      if (data.success && data.data.valid) {
        setAppliedCoupon({ coupon_id: data.data.coupon_id, discount_percent: data.data.discount_percent, code: data.data.code })
      } else {
        setCouponError(data.data?.reason || "Kupon geçersiz")
      }
    } catch {
      setCouponError("Bağlantı hatası")
    }
    setCouponLoading(false)
  }

  const handleStartPayment = async (planId: string) => {
    setTokenLoading(true)
    setTokenError(null)

    let addressId = selectedAddressId

    // Yeni adres sekmesindeyse önce adresi kaydet
    if (billingTab === "new" && saveAddressCheck) {
      try {
        const res = await fetch("/api/panel/billing-addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: addressType, ...newAddr, is_default: billingAddresses.length === 0 }),
        })
        const data = await res.json()
        if (!data.success) { setTokenError(data.error || "Adres kaydedilemedi"); setTokenLoading(false); return }
        addressId = data.data.address.id
        fetchAddresses()
      } catch { setTokenError("Adres kaydedilemedi"); setTokenLoading(false); return }
    } else if (billingTab === "new") {
      try {
        const res = await fetch("/api/panel/billing-addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: addressType, ...newAddr, is_default: false }),
        })
        const data = await res.json()
        if (!data.success) { setTokenError(data.error || "Adres kaydedilemedi"); setTokenLoading(false); return }
        addressId = data.data.address.id
      } catch { setTokenError("Adres kaydedilemedi"); setTokenLoading(false); return }
    }

    if (!addressId) { setTokenError("Lütfen bir fatura adresi seçin"); setTokenLoading(false); return }

    try {
      const res = await fetch("/api/panel/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          billing_period: billing === "yearly" ? "YEARLY" : "MONTHLY",
          billing_address_id: addressId,
          coupon_code: appliedCoupon?.code || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) { setTokenError(data.error || "Ödeme başlatılamadı"); setTokenLoading(false); return }

      // %100 indirim — bedelsiz abonelik
      if (data.data.free) {
        router.push("/panel/odeme-basarili")
        return
      }

      setIframeToken(data.data.token)
      setPaymentStep("iframe")
    } catch {
      setTokenError("Bağlantı hatası")
    }
    setTokenLoading(false)
  }

  const closeModal = () => {
    setConfirmPlan(null)
    setPaymentStep(null)
    setIframeToken(null)
    setTokenError(null)
    setTokenLoading(false)
    setCouponCode("")
    setAppliedCoupon(null)
    setCouponError(null)
    setDistanceSalesAccepted(false)
  }

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff]"
  const selectCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a5cff] bg-white"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Abonelik</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Paketinizi yönetin ve ödeme geçmişinizi görüntüleyin</p>
      </div>

      {/* Abonelik yoksa uyarı banner */}
      {!activeSub && !historyLoading && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-800">Aktif Aboneliğiniz Bulunmuyor</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                {history.some((s) => s.paytr_ref === "TRIAL")
                  ? "Deneme süreniz dolmuştur. Paneli kullanmaya devam etmek için bir paket satın alın."
                  : "Paneli kullanmaya başlamak için aşağıdan bir paket seçin ve ödemenizi tamamlayın."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current plan banner */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[#2a5cff] to-[#6366f1] text-white">
          <div>
            <p className="text-xs text-blue-200 font-medium">Mevcut Planınız</p>
            <p className="text-xl font-bold mt-0.5">
              {activeSub ? `${activeSub.plan_name} — ${Number(activeSub.total_amount ?? 0).toFixed(0)} ₺/${activeSub.billing_period === "YEARLY" ? "yıl" : "ay"}` : "Plan bilgisi yükleniyor..."}
            </p>
            {activeSub && (
              <p className="text-xs text-blue-200 mt-1">
                Sonraki yenileme: {new Date(activeSub.ends_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">{activeSub ? "Aktif" : "—"}</span>
          </div>
        </div>
      </Card>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${billing === "monthly" ? "text-zinc-900" : "text-zinc-400"}`}>Aylık</span>
        <button
          onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
          className={`relative w-14 h-7 rounded-full transition-colors ${billing === "yearly" ? "bg-[#2a5cff]" : "bg-zinc-300"}`}
        >
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${billing === "yearly" ? "translate-x-7" : "translate-x-0.5"}`} />
        </button>
        <span className={`text-sm font-medium ${billing === "yearly" ? "text-zinc-900" : "text-zinc-400"}`}>
          Yıllık
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">3 Ay Hediye</span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const pricing = plan.isFree ? { net: 0, kdv: 0, total: 0 } : getPricing(plan.netMonthly, billing)
          const displayPrice = plan.isFree ? 0 : plan.netMonthly

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-5 transition-all ${
                plan.highlighted ? "border-[#2a5cff] shadow-lg shadow-blue-500/10"
                  : isCurrent ? "border-emerald-300 bg-emerald-50/30" : "border-zinc-200"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2a5cff] text-white text-[10px] font-bold rounded-full uppercase">Önerilen</div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                  {isCurrent && <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">Mevcut</span>}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{plan.desc}</p>
              </div>
              <div className="mb-5">
                {plan.isFree ? (
                  <div><span className="text-3xl font-extrabold text-zinc-900">Ücretsiz</span><p className="text-xs text-zinc-400 mt-0.5">14 gün</p></div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-zinc-900">{displayPrice} ₺</span>
                      <span className="text-sm text-zinc-400">/ay</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">+KDV ({Math.round(displayPrice * KDV_RATE)} ₺) = {Math.round(displayPrice * (1 + KDV_RATE))} ₺</p>
                    {billing === "yearly" && (
                      <>
                        <p className="text-xs text-emerald-600 mt-1 font-medium">3 Ay Hediye! 9 aylık ödeme ile 12 ay</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Yıllık toplam: <strong>{pricing.total.toFixed(0)} ₺</strong> (KDV dahil)</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2.5 mb-5">
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2">
                    {f.has ? tick : cross}
                    <span className={`text-xs ${f.has ? "text-zinc-700" : "text-zinc-400"}`}>{f.text}</span>
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <div className="w-full py-2.5 text-center text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl">Mevcut Planınız</div>
              ) : plan.isFree ? (
                <div className="w-full py-2.5 text-center text-sm font-medium text-zinc-400 bg-zinc-50 rounded-xl">Deneme süresi doldu</div>
              ) : (
                <button
                  onClick={() => { setConfirmPlan(plan.id); setPaymentStep("confirm") }}
                  className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    plan.highlighted ? "bg-[#2a5cff] text-white hover:opacity-90 shadow-md shadow-blue-500/20" : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  {plan.netMonthly > (plans.find((p) => p.id === currentPlan)?.netMonthly || 0) ? "Yükselt" : "Geçiş Yap"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment History */}
      <Card>
        <h2 className="text-sm font-bold text-zinc-900 mb-4">Ödeme Geçmişi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400 uppercase tracking-wide">
                <th className="text-left py-2 font-medium">Tarih</th>
                <th className="text-left py-2 font-medium">Plan</th>
                <th className="text-left py-2 font-medium">Dönem</th>
                <th className="text-right py-2 font-medium">Tutar</th>
                <th className="text-right py-2 font-medium">Durum</th>
                <th className="text-right py-2 font-medium">Fatura</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">Yükleniyor...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">Henüz ödeme bulunmuyor</td></tr>
              ) : history.map((s) => (
                <tr key={s.id} className="border-b border-zinc-50">
                  <td className="py-2.5 text-zinc-900 whitespace-nowrap">{new Date(s.starts_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-2.5 text-zinc-600">{s.plan_name}</td>
                  <td className="py-2.5 text-zinc-400">{s.billing_period === "YEARLY" ? "Yıllık" : "Aylık"}</td>
                  <td className="py-2.5 text-right font-semibold text-zinc-900 whitespace-nowrap">{Number(s.total_amount ?? 0).toFixed(0)} ₺</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600"
                        : s.status === "REFUNDED" ? "bg-red-50 text-red-600"
                        : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {s.status === "ACTIVE" ? "Aktif" : s.status === "REFUNDED" ? "İade" : s.status === "EXPIRED" ? "Süresi Doldu" : s.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {s.invoices.length > 0 ? s.invoices.map((inv) => (
                      <span key={inv.id}>
                        {inv.pdf_url ? (
                          <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2a5cff] hover:underline">{inv.invoice_number}</a>
                        ) : (
                          <span className="text-xs text-amber-600">{inv.status === "FATURA_BEKLIYOR" ? "Bekliyor" : inv.invoice_number}</span>
                        )}
                      </span>
                    )) : <span className="text-xs text-zinc-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Modal */}
      {confirmPlan && (() => {
        const selectedPlan = plans.find((p) => p.id === confirmPlan)
        if (!selectedPlan || selectedPlan.isFree) return null
        const pricing = getPricing(selectedPlan.netMonthly, billing)

        return (
          <Modal open={true} onClose={closeModal} title={
            paymentStep === "iframe" ? "Güvenli Ödeme" :
            paymentStep === "billing" ? "Fatura Bilgileri" :
            "Plan Yükseltme"
          }>
            {/* Step 1: Plan Onayı */}
            {paymentStep === "confirm" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#2a5cff]/5 to-[#6366f1]/5 border border-[#2a5cff]/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-zinc-900">{selectedPlan.name}</h3>
                    <span className="text-lg font-extrabold text-[#2a5cff]">{pricing.total.toFixed(0)} ₺</span>
                  </div>
                  <div className="text-xs text-zinc-500 space-y-0.5">
                    <p>Dönem: <strong className="text-zinc-700">{billing === "yearly" ? "Yıllık" : "Aylık"}</strong></p>
                    <p>Net: <strong className="text-zinc-700">{pricing.net.toFixed(0)} ₺</strong> + KDV: <strong className="text-zinc-700">{pricing.kdv.toFixed(0)} ₺</strong></p>
                    <p>Toplam: <strong className="text-zinc-900">{pricing.total.toFixed(0)} ₺</strong></p>
                    {billing === "yearly" && <p className="text-emerald-600 font-medium">3 Ay Hediye! 9 aylık ödeme ile 12 ay kullanın</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedPlan.features.filter((f) => f.has).slice(0, 5).map((f) => (
                    <div key={f.text} className="flex items-center gap-2 text-xs text-zinc-600">{tick}{f.text}</div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" fullWidth onClick={closeModal}>Vazgeç</Button>
                  <Button fullWidth onClick={() => setPaymentStep("billing")}>Fatura Bilgilerine Geç</Button>
                </div>
              </div>
            )}

            {/* Step 2: Fatura Bilgileri */}
            {paymentStep === "billing" && (
              <div className="space-y-4">
                {/* Kupon Kodu */}
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Kupon Kodu (Opsiyonel)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setAppliedCoupon(null); setCouponError(null) }}
                      placeholder="Kupon kodunuz varsa girin"
                      disabled={!!appliedCoupon}
                      className={`flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#2a5cff] font-mono uppercase ${appliedCoupon ? "border-emerald-300 bg-emerald-50" : "border-zinc-300"}`}
                    />
                    {appliedCoupon ? (
                      <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); setCouponError(null) }} className="px-3 py-2 text-xs font-medium rounded-xl border border-zinc-300 text-zinc-500 hover:bg-zinc-100 shrink-0">Kaldır</button>
                    ) : (
                      <button
                        onClick={() => handleValidateCoupon(confirmPlan)}
                        disabled={!couponCode.trim() || couponLoading}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 shrink-0"
                      >{couponLoading ? "..." : "Uygula"}</button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="mt-1.5 text-xs text-emerald-600 font-medium">Kupon uygulandı: %{appliedCoupon.discount_percent} indirim{appliedCoupon.discount_percent === 100 ? " (Bedelsiz)" : ""}</p>
                  )}
                  {couponError && <p className="mt-1.5 text-xs text-red-500">{couponError}</p>}
                  {appliedCoupon && appliedCoupon.discount_percent < 100 && (
                    <div className="mt-2 text-xs text-zinc-500 space-y-0.5">
                      <p>Orijinal: <span className="line-through">{pricing.total.toFixed(0)} ₺</span></p>
                      <p>İndirim: <span className="text-emerald-600 font-medium">-{Math.round(pricing.total * appliedCoupon.discount_percent / 100)} ₺</span></p>
                      <p>Ödenecek: <strong className="text-zinc-900">{Math.round(pricing.total * (100 - appliedCoupon.discount_percent) / 100)} ₺</strong></p>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-200">
                  <button
                    onClick={() => setBillingTab("saved")}
                    className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${billingTab === "saved" ? "border-[#2a5cff] text-[#2a5cff]" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}
                  >Kayıtlı Adresler</button>
                  <button
                    onClick={() => setBillingTab("new")}
                    className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${billingTab === "new" ? "border-[#2a5cff] text-[#2a5cff]" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}
                  >Yeni Adres</button>
                </div>

                {/* Saved addresses */}
                {billingTab === "saved" && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {billingAddresses.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-zinc-400">Kayıtlı adresiniz bulunmuyor</p>
                        <button onClick={() => setBillingTab("new")} className="mt-2 text-sm text-[#2a5cff] font-medium hover:underline">Yeni adres ekle</button>
                      </div>
                    ) : billingAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddressId === addr.id ? "border-[#2a5cff] bg-blue-50/30" : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="billing_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-[#2a5cff]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${addr.type === "KURUMSAL" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                              {addr.type === "KURUMSAL" ? "Kurumsal" : "Bireysel"}
                            </span>
                            {addr.label && <span className="text-xs text-zinc-500">{addr.label}</span>}
                          </div>
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {addr.type === "KURUMSAL" ? addr.company_name : addr.full_name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">{addr.address}, {addr.district}/{addr.city}</p>
                          <p className="text-xs text-zinc-400">{addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* New address form */}
                {billingTab === "new" && (
                  <div className="space-y-3">
                    {/* Type toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAddressType("BIREYSEL")}
                        className={`flex-1 py-2 text-sm font-medium rounded-xl border-2 transition-all ${addressType === "BIREYSEL" ? "border-[#2a5cff] bg-blue-50 text-[#2a5cff]" : "border-zinc-200 text-zinc-500"}`}
                      >Bireysel</button>
                      <button
                        onClick={() => setAddressType("KURUMSAL")}
                        className={`flex-1 py-2 text-sm font-medium rounded-xl border-2 transition-all ${addressType === "KURUMSAL" ? "border-[#2a5cff] bg-blue-50 text-[#2a5cff]" : "border-zinc-200 text-zinc-500"}`}
                      >Kurumsal</button>
                    </div>

                    {addressType === "BIREYSEL" ? (
                      <>
                        <input className={inputCls} placeholder="Ad Soyad *" value={newAddr.full_name} onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })} />
                        <input className={inputCls} placeholder="TC Kimlik No (11 hane) *" maxLength={11} value={newAddr.tc_kimlik} onChange={(e) => setNewAddr({ ...newAddr, tc_kimlik: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
                      </>
                    ) : (
                      <>
                        <input className={inputCls} placeholder="Firma Adı *" value={newAddr.company_name} onChange={(e) => setNewAddr({ ...newAddr, company_name: e.target.value })} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input className={inputCls} placeholder="Vergi Dairesi *" value={newAddr.tax_office} onChange={(e) => setNewAddr({ ...newAddr, tax_office: e.target.value })} />
                          <input className={inputCls} placeholder="Vergi No *" value={newAddr.tax_number} onChange={(e) => setNewAddr({ ...newAddr, tax_number: e.target.value })} />
                        </div>
                      </>
                    )}

                    <input className={inputCls} placeholder="Adres *" value={newAddr.address} onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select className={selectCls} value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value, district: "" })}>
                        <option value="">İl Seçin *</option>
                        {provinces.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                      </select>
                      <select className={selectCls} value={newAddr.district} onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })} disabled={!newAddr.city}>
                        <option value="">İlçe Seçin *</option>
                        {selectedDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <input className={inputCls} placeholder="Telefon *" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} />
                    <input className={inputCls} placeholder="Adres etiketi (opsiyonel)" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} />

                    <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                      <input type="checkbox" checked={saveAddressCheck} onChange={(e) => setSaveAddressCheck(e.target.checked)} className="accent-[#2a5cff]" />
                      Bu adresi kaydet
                    </label>
                  </div>
                )}

                {/* Mesafeli Satış Sözleşmesi onayı */}
                <label className="flex items-start gap-2 text-xs text-zinc-600 cursor-pointer p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={distanceSalesAccepted}
                    onChange={(e) => setDistanceSalesAccepted(e.target.checked)}
                    className="accent-[#2a5cff] mt-0.5"
                  />
                  <span>
                    <a href="/sozlesmeler/DISTANCE_SALES" target="_blank" rel="noopener noreferrer" className="text-[#2a5cff] font-medium hover:underline">Mesafeli Hizmet Sözleşmesi</a>
                    {" "}ve{" "}
                    <a href="/sozlesmeler/CANCELLATION_POLICY" target="_blank" rel="noopener noreferrer" className="text-[#2a5cff] font-medium hover:underline">İptal/İade Politikası</a>
                    &apos;nı okudum ve kabul ediyorum.
                  </span>
                </label>

                {tokenError && (
                  <div className="p-3 rounded-xl bg-red-50 text-sm text-red-600">{tokenError}</div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" fullWidth onClick={() => setPaymentStep("confirm")}>Geri</Button>
                  <Button
                    fullWidth
                    loading={tokenLoading}
                    disabled={tokenLoading || !distanceSalesAccepted || (billingTab === "saved" ? !selectedAddressId : !isNewAddressValid())}
                    onClick={() => handleStartPayment(confirmPlan)}
                  >
                    {appliedCoupon?.discount_percent === 100
                      ? "Bedelsiz Aktifleştir"
                      : `Ödemeye Geç — ${appliedCoupon
                          ? Math.round(pricing.total * (100 - appliedCoupon.discount_percent) / 100)
                          : pricing.total.toFixed(0)} ₺`}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: PayTR Iframe */}
            {paymentStep === "iframe" && iframeToken && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">Pay</span>
                    </div>
                    <span className="text-xs text-zinc-400">PayTR Güvenli Ödeme</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] text-emerald-600 font-medium">256-bit SSL</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 text-center">Ödeme işleminizi aşağıdaki güvenli formda tamamlayın</p>
                <Script
                  src="https://www.paytr.com/js/iframeResizer.min.js"
                  strategy="afterInteractive"
                  onLoad={() => { if (window.iFrameResize) window.iFrameResize({}, "#paytriframe") }}
                />
                <iframe
                  id="paytriframe"
                  src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                  frameBorder="0"
                  scrolling="no"
                  className="w-full min-h-[300px] md:min-h-[400px] border-0"
                />
                <p className="text-[10px] text-zinc-400 text-center">
                  Ödemeniz PayTR altyapısı ile güvenli şekilde işlenir. Kart bilgileriniz sunucularımızda saklanmaz.
                </p>
              </div>
            )}
          </Modal>
        )
      })()}
    </div>
  )
}
