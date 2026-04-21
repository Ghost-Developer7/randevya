import Link from "next/link"
import { headers } from "next/headers"
import type { Metadata } from "next"
import Navbar from "@/components/public/Navbar"
import Footer from "@/components/public/Footer"
import TenantHome from "@/components/public/TenantHome"
import { db } from "@/lib/db"
import { resolveTenantByRawId } from "@/lib/tenant"

// ─── Dinamik metadata: tenant varsa tenant adı, yoksa Randevya ──────────────
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return {
      title: "Randevya — İşletmeniz İçin Online Randevu Sistemi",
      description:
        "Müşterileriniz 7/24 online randevu alsın, siz otomatik bildirim alın. Kuaför, klinik, güzellik salonu ve daha fazlası için kolay randevu yönetimi. 14 gün ücretsiz deneyin, kredi kartı gerekmez.",
      keywords: [
        "online randevu sistemi",
        "randevu yönetim programı",
        "işletme randevu uygulaması",
        "kuaför randevu sistemi",
        "klinik randevu programı",
        "online rezervasyon sistemi",
        "randevu alma programı",
        "müşteri randevu takibi",
      ],
    }
  }

  const tenant = await resolveTenantByRawId(tenantId)
  if (tenant) {
    return {
      title: `${tenant.company_name} — Online Randevu`,
      description: `${tenant.company_name} ile online randevu alın. Hızlı, kolay ve ücretsiz.`,
      openGraph: {
        title: `${tenant.company_name} — Online Randevu`,
        description: `${tenant.company_name} ile online randevu alın.`,
        ...(tenant.logo_url ? { images: [tenant.logo_url] } : {}),
      },
    }
  }

  return {
    title: "Online Randevu",
    description: "Online randevu sistemi",
  }
}

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "7/24 Online Randevu",
    desc: "Çalışma saatlerinden bağımsız olarak müşterileriniz istediği zaman randevu alır. Kaçan her çağrı, kaçan bir gelirdir; artık olmayacak.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Otomatik Hatırlatmalar",
    desc: "Randevu onayı, 24 saat öncesi hatırlatma ve iptal bildirimleri müşteriye otomatik gider. WhatsApp ve e-posta desteği dahil.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Akıllı Panel",
    desc: "Tüm randevularınızı, personellerinizi ve hizmetlerinizi tek ekrandan yönetin. Günlük, haftalık ve aylık görünümler elinizin altında.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Personel Yönetimi",
    desc: "Her personel için ayrı takvim, çalışma saatleri ve hizmet ataması yapın. Takım büyüdükçe sistem sizinle büyür.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Bekleme Listesi",
    desc: "İptal olan randevularda bekleme listesindeki müşteriler anında bilgilendirilir. Boş slot bırakmadan doluluk oranınızı artırın.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    title: "Analitik & Raporlar",
    desc: "En çok tercih edilen hizmetler, yoğun saatler ve müşteri istatistikleri. Veriye dayalı kararlarla işletmenizi büyütün.",
  },
]

const sectors = [
  { name: "Kuaför & Berber", icon: "✂️" },
  { name: "Güzellik Salonu", icon: "💅" },
  { name: "Diş Kliniği", icon: "🦷" },
  { name: "Sağlık & Klinik", icon: "🏥" },
  { name: "Fizyoterapi", icon: "🧘" },
  { name: "Veteriner", icon: "🐾" },
  { name: "Danışmanlık", icon: "📋" },
  { name: "Spor & Fitness", icon: "🏋️" },
]

export default async function HomePage() {
  // ─── Tenant kontrolü: custom domain'den geliyorsa tenant sayfası göster ────
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (tenantId) {
    return <TenantHome tenantId={tenantId} />
  }

  // ─── Planları DB'den çek ────────────────────────────────────────────────────
  const dbPlans = await db.plan.findMany({ orderBy: { price_monthly: "asc" } })

  // ─── Ana domain: Randevya pazarlama sayfası ────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
        {/* Decorative background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-100/30 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2a5cff] text-xs font-semibold mb-6 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2a5cff] animate-pulse" />
              İşletmeniz İçin Online Randevu Sistemi
            </div>

            {/* Main heading */}
            <h1 className="animate-fade-in-up text-[2.5rem] sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              <span className="text-zinc-900">Müşterileriniz</span>
              <br />
              <span className="bg-gradient-to-r from-[#2a5cff] to-[#6366f1] bg-clip-text text-transparent">
                7/24 online randevu
              </span>
              <br />
              <span className="text-zinc-900">alsın</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up-delay-1 mt-7 text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              Telefon trafiğine son verin.{" "}
              <strong className="text-zinc-700 font-medium">Randevya</strong> ile işletmenize dakikalar içinde online randevu sistemi kurun. Otomatik bildirimler, kolay yönetim paneli ve WhatsApp entegrasyonu dahil.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up-delay-2 mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/panel/kayit"
                className="group inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-[#2a5cff] rounded-full hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                14 Gün Ücretsiz Deneyin
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#nasil-calisir"
                className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 hover:text-zinc-900 hover:-translate-y-0.5 transition-all duration-200"
              >
                Nasıl çalışır?
              </Link>
            </div>

            {/* Trust signals */}
            <div className="animate-fade-in-up-delay-3 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-400">
              {[
                "14 gün ücretsiz deneme",
                "5 dakikada kurulum",
                "Teknik bilgi şart değil",
                "Müşteriler için tamamen ücretsiz",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <a href="#nasil-calisir" className="animate-scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2">
          <svg className="w-10 h-10 text-[#2a5cff]/30 hover:text-[#2a5cff]/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3l5 5 5-5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 9l5 5 5-5" />
          </svg>
        </a>
      </section>

      {/* How it works */}
      <section id="nasil-calisir" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
              5 dakikada hayata geçirin
            </h2>
            <p className="mt-3 text-lg text-zinc-500">Teknik bilgi gerektirmez, kurulum adımları bu kadar basit.</p>
          </div>
          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:gap-3">
            {[
              {
                title: "Ücretsiz Kaydolun",
                desc: "E-posta ve işletme adınızla 2 dakikada hesap oluşturun. Taahhüt olmadan, hemen başlayın.",
                gradient: "from-blue-500 to-blue-600",
                bg: "bg-blue-50",
                hoverBg: "hover:bg-blue-500",
                borderHover: "hover:border-blue-400",
                iconColor: "text-blue-600 group-hover:text-white",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                ),
              },
              {
                title: "Hizmetleri Tanımlayın",
                desc: "Sunduğunuz hizmetleri, personellerinizi ve çalışma saatlerinizi birkaç tıkla ekleyin.",
                gradient: "from-violet-500 to-violet-600",
                bg: "bg-violet-50",
                hoverBg: "hover:bg-violet-500",
                borderHover: "hover:border-violet-400",
                iconColor: "text-violet-600 group-hover:text-white",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
              },
              {
                title: "Linkinizi Paylaşın",
                desc: "Size özel randevu linkinizi Instagram, WhatsApp veya web sitenize ekleyin. Müşterileriniz artık sizi arayarak randevu almak zorunda kalmaz.",
                gradient: "from-amber-500 to-amber-600",
                bg: "bg-amber-50",
                hoverBg: "hover:bg-amber-500",
                borderHover: "hover:border-amber-400",
                iconColor: "text-amber-600 group-hover:text-white",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                ),
              },
              {
                title: "Randevuları Yönetin",
                desc: "Gelen randevuları tek tıkla onaylayabilir ya da reddedebilirsiniz. Tüm bildirimler otomatik olarak gönderilir; siz sadece işinize odaklanın.",
                gradient: "from-emerald-500 to-emerald-600",
                bg: "bg-emerald-50",
                hoverBg: "hover:bg-emerald-500",
                borderHover: "hover:border-emerald-400",
                iconColor: "text-emerald-600 group-hover:text-white",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((s, i, arr) => (
              <div key={s.title} className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`group w-full px-5 py-7 rounded-2xl bg-white border-2 border-zinc-100 text-center ${s.hoverBg} ${s.borderHover} hover:shadow-2xl hover:shadow-zinc-200/50 hover:-translate-y-1 transition-all duration-300 cursor-default`}>
                  <div className={`w-14 h-14 rounded-2xl ${s.bg} ${s.iconColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-white/20 transition-all duration-300`}>
                    {s.icon}
                  </div>
                  <div className={`w-10 h-1 rounded-full bg-gradient-to-r ${s.gradient} mx-auto mb-4 group-hover:w-14 group-hover:bg-white/60 transition-all duration-300`} />
                  <h3 className="text-base font-bold text-zinc-900 group-hover:text-white mb-1.5 transition-colors duration-300">
                    {s.title}
                  </h3>
                  <p className="text-xs text-zinc-500 group-hover:text-white/80 leading-relaxed transition-colors duration-300">
                    {s.desc}
                  </p>
                </div>

                {i < arr.length - 1 && (
                  <div className="hidden lg:flex shrink-0 text-zinc-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="ozellikler" className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
              İşletmenizin ihtiyacı olan her şey
            </h2>
            <p className="mt-3 text-lg text-zinc-500 max-w-xl mx-auto">
              Randevya, telefon bağımlılığını sona erdirip müşteri memnuniyetini artırmak için tasarlandı.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-white border border-zinc-200 hover:border-[#2a5cff]/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2a5cff] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-zinc-900 mb-1.5">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section id="sektorler" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
              Her sektöre uygun randevu çözümü
            </h2>
            <p className="mt-3 text-lg text-zinc-500">
              Kuaförden kliniğe, veterinerden danışmanlığa; Randevya her sektör için çalışır.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {sectors.map((s) => (
              <div
                key={s.name}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-zinc-200 hover:border-[#2a5cff]/30 hover:shadow-md transition-all cursor-default"
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-sm font-medium text-zinc-700 text-center">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="fiyatlandirma" className="py-24 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">Şeffaf fiyatlandırma</h2>
            <p className="mt-3 text-lg text-zinc-500">
              İşletme büyüklüğünüze uygun paketi seçin. Gizli ücret yok.
            </p>
            <p className="mt-1 text-sm text-zinc-400">Tüm fiyatlar aylık net tutardır, +%20 KDV uygulanır</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm font-medium text-emerald-700">14 gün boyunca tüm özellikleri ücretsiz deneyin</span>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-6 max-w-5xl mx-auto ${dbPlans.filter(p => Number(p.price_monthly) > 0).length <= 2 ? "md:grid-cols-2 max-w-3xl" : "md:grid-cols-3"}`}>
            {dbPlans.map((plan, i) => {
              const price = Number(plan.price_monthly)
              if (price === 0) return null
              const kdv = Math.round(price * 0.2)
              const total = price + kdv
              const yearly = Math.round(price * 9 * 1.2)
              const isHighlighted = i === dbPlans.length - 1

              const planFeatures: { text: string; has: boolean }[] = [
                { text: plan.max_staff >= 999 ? "Sınırsız personel" : `${plan.max_staff} personele kadar`, has: true },
                { text: plan.max_services >= 999 ? "Sınırsız hizmet" : `${plan.max_services} hizmete kadar`, has: true },
                { text: "E-posta bildirimleri", has: true },
                { text: "WhatsApp bildirim", has: plan.whatsapp_enabled },
                { text: "Özel alan adı", has: plan.custom_domain },
                { text: "Bekleme listesi", has: plan.waitlist_enabled },
                { text: "Analitik & rapor", has: plan.analytics },
                { text: "Öncelikli destek", has: plan.priority_support },
              ]

              return (
                <div key={plan.id} className={`relative rounded-2xl border-2 bg-white p-7 ${isHighlighted ? "border-[#2a5cff] shadow-lg shadow-blue-500/10" : "border-zinc-200"}`}>
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2a5cff] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">En Popüler</div>
                  )}
                  <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {isHighlighted ? "Büyüyen işletmeler için gelişmiş özellikler" : "Küçük ve orta ölçekli işletmeler için ideal"}
                  </p>
                  <div className="mt-5 mb-1">
                    <span className="text-4xl font-extrabold text-zinc-900">{price} ₺</span>
                    <span className="text-sm text-zinc-400">/ay</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-6">
                    +KDV ({kdv} ₺) = {total} ₺/ay · Yıllık: {yearly.toLocaleString("tr-TR")} ₺ <span className="text-emerald-600 font-medium">(3 ay ücretsiz)</span>
                  </p>
                  <ul className="space-y-2.5 mb-6">
                    {planFeatures.map((f) => (
                      <li key={f.text} className={`flex items-center gap-2 text-sm ${f.has ? "text-zinc-600" : "text-zinc-400"}`}>
                        {f.has ? (
                          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  <Link href="/panel/kayit" className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition-all ${
                    isHighlighted ? "text-white bg-[#2a5cff] hover:opacity-90 shadow-md shadow-blue-500/20" : "text-white bg-zinc-900 hover:bg-zinc-800"
                  }`}>
                    Ücretsiz Deneyin
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="text-center text-xs text-zinc-400 mt-8">
            Yıllık ödemede 12 ay kullanım, 9 ay ücret.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary CTA */}
            <div className="p-8 rounded-2xl bg-[#2a5cff] text-white">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Hemen başlayın, 14 gün ücretsiz</h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                Kayıt olmak 5 dakika sürer, taahhüt yok.
                Sistemi kurun, müşterilerinize linki gönderin. İlk randevu bugün gelebilir.
              </p>
              <Link
                href="/panel/kayit"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-white text-[#2a5cff] rounded-xl hover:bg-blue-50 transition-colors"
              >
                Ücretsiz Hesap Oluşturun
              </Link>
            </div>

            {/* Secondary CTA */}
            <div className="p-8 rounded-2xl bg-white border-2 border-zinc-200">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Zaten üye misiniz?</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                İşletme panelinize giriş yapın, günlük randevularınızı görün,
                müşterilerinize bildirim gönderin ve işletmenizi büyütün.
              </p>
              <Link
                href="/panel/giris"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Panele Giriş Yapın
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
