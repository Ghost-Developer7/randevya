import Link from "next/link"
import { headers } from "next/headers"
import type { Metadata } from "next"
import Logo from "@/components/ui/Logo"
import Navbar from "@/components/public/Navbar"
import TenantHome from "@/components/public/TenantHome"

// ─── Dinamik metadata: tenant varsa tenant adı, yoksa Randevya ──────────────
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const tenantId = headersList.get("x-tenant-id")

  if (!tenantId) {
    return {
      title: "Randevya - Online Randevu Yönetim Platformu",
      description:
        "İşletmeniz için online randevu sistemi. Kolay yönetim, otomatik bildirimler, müşteri takibi.",
      keywords: ["randevu", "online randevu", "randevu sistemi", "kuaför randevu", "klinik randevu"],
    }
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3003"
    const res = await fetch(`${baseUrl}/api/tenant`, {
      headers: { "x-tenant-id": tenantId },
      next: { revalidate: 300 },
    })
    if (res.ok) {
      const data = await res.json()
      const tenant = data.data
      return {
        title: `${tenant.company_name} - Online Randevu`,
        description: `${tenant.company_name} online randevu sistemi. Hemen randevu alın.`,
        openGraph: {
          title: `${tenant.company_name} - Online Randevu`,
          description: `${tenant.company_name} online randevu sistemi.`,
          ...(tenant.logo_url ? { images: [tenant.logo_url] } : {}),
        },
      }
    }
  } catch {
    // Metadata alınamazsa default
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
    title: "Kolay Randevu",
    desc: "İstediğiniz işletmeden saniyeler içinde online randevu alın. Telefon aramaya gerek yok.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Onay Sistemi",
    desc: "Randevunuz işletme tarafından onaylanınca anında bildirim alın. WhatsApp veya e-posta ile.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "Esnek Ödeme",
    desc: "İsterseniz online ödeyin, isterseniz randevuya gittiğinizde ödemeni yapın. Seçim sizin.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Anlık Bildirimler",
    desc: "Randevu durumunuz değiştiğinde anında haberdar olun. Hiçbir şeyi kaçırmayın.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Randevu Takibi",
    desc: "Tüm randevularınızı tek yerden takip edin. Geçmiş ve gelecek randevular elinizin altında.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "İşletme Keşfet",
    desc: "Kuaför, klinik, güzellik salonu ve daha fazlasını keşfedip hemen randevu alın.",
  },
]

const sectors = [
  { name: "Kuaför & Berber", icon: "✂️" },
  { name: "Güzellik Salonu", icon: "💅" },
  { name: "Diş Kliniği", icon: "🦷" },
  { name: "Sağlık & Klinik", icon: "🏥" },
  { name: "Fizyoterapi", icon: "💪" },
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
            {/* Main heading */}
            <h1 className="animate-fade-in-up text-[2.5rem] sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-[#2a5cff] to-[#6366f1] bg-clip-text text-transparent">
                Randevunuz
              </span>
              <br />
              <span className="text-zinc-900">bir tık uzağınızda</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up-delay-1 mt-7 text-base sm:text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed font-light">
              İşletmenizi yönetin, müşterileriniz sizi bulsun.
              <br className="hidden sm:block" />
              Tek platform, sıfır karmaşa.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up-delay-2 mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/kayit"
                className="group inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-[#2a5cff] rounded-full hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                Randevu Al
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/panel/kayit"
                className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 hover:text-zinc-900 hover:-translate-y-0.5 transition-all duration-200"
              >
                İşletmemi Ekle
              </Link>
            </div>

            {/* Trust line */}
            <div className="animate-fade-in-up-delay-3 mt-8 flex items-center justify-center gap-6 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Müşteriler için ücretsiz
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                14 gün ücretsiz deneme
              </span>
            </div>
          </div>
        </div>

        {/* Scroll hint — bottom of hero */}
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
              Nasıl çalışır?
            </h2>
            <p className="mt-3 text-lg text-zinc-500">4 basit adımda randevunuzu alın</p>
          </div>
          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:gap-3">
            {[
              {
                title: "Üye Ol",
                desc: "Adı, e-posta ve telefon numaranızla ücretsiz kayıt olun.",
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
                title: "İşletme Seç",
                desc: "İstediğiniz işletmeyi bulun, hizmet ve personel seçin.",
                gradient: "from-violet-500 to-violet-600",
                bg: "bg-violet-50",
                hoverBg: "hover:bg-violet-500",
                borderHover: "hover:border-violet-400",
                iconColor: "text-violet-600 group-hover:text-white",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                title: "Rezerve Et",
                desc: "Tarih ve saat seçip randevu talebinizi gönderin.",
                gradient: "from-amber-500 to-amber-600",
                bg: "bg-amber-50",
                hoverBg: "hover:bg-amber-500",
                borderHover: "hover:border-amber-400",
                iconColor: "text-amber-600 group-hover:text-white",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: "Onay Al",
                desc: "İşletme onayladığında bildirim alın. İster online ödeyin ister yerinde.",
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
                {/* Card */}
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

                {/* Arrow between cards — desktop only, not after last */}
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
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
              Neden Randevya?
            </h2>
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
              Hangi sektörlerden randevu alabilirsiniz?
            </h2>
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

      {/* Dual CTA */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer CTA */}
            <div className="p-8 rounded-2xl bg-[#2a5cff] text-white">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Müşteri misiniz?</h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                Ücretsiz üye olun, istediğiniz işletmeden kolayca randevu alın.
                Onay bildirimi alın, ister online ödeyin ister yerinde.
              </p>
              <Link
                href="/kayit"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-white text-[#2a5cff] rounded-xl hover:bg-blue-50 transition-colors"
              >
                Ücretsiz Üye Ol
              </Link>
            </div>

            {/* Business CTA */}
            <div className="p-8 rounded-2xl bg-white border-2 border-zinc-200">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">İşletme sahibi misiniz?</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                İşletmenizi Randevya'ya ekleyin, online randevu kabul edin.
                Randevuları yönetin, müşterilerinize bildirim gönderin.
              </p>
              <Link
                href="/panel/kayit"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
              >
                İşletme Kaydı
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <Logo size="sm" invertText />
              </div>
              <p className="text-sm leading-relaxed">
                Online randevu platformu. Kolay, hızlı ve güvenli.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Müşteriler</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/kayit" className="hover:text-white transition-colors">Üye Ol</Link></li>
                <li><Link href="/giris" className="hover:text-white transition-colors">Giriş Yap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">İşletmeler</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/panel/kayit" className="hover:text-white transition-colors">İşletme Kaydı</Link></li>
                <li><Link href="/panel/giris" className="hover:text-white transition-colors">İşletme Girişi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Yasal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sozlesmeler/PRIVACY_POLICY" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                <li><Link href="/sozlesmeler/TERMS_OF_USE" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                <li><Link href="/sozlesmeler/KVKK" className="hover:text-white transition-colors">KVKK</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-sm">
            &copy; 2026 Randevya. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  )
}
