import Link from "next/link"
import Image from "next/image"
import Logo from "@/components/ui/Logo"

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Logo size="sm" invertText />
            </div>
            <p className="text-sm leading-relaxed">
              Online randevu platformu. Kolay, hızlı ve güvenli.
              <br />Müşterileriniz artık sizden online randevu alabilecek.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <Link href="/panel/kayit" className="block hover:text-white transition-colors">Ücretsiz Dene</Link>
              <Link href="/panel/giris" className="block hover:text-white transition-colors">Giriş Yap</Link>
              <Link href="/#fiyatlandirma" className="block hover:text-white transition-colors">Fiyatlandırma</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Yasal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sozlesmeler/PRIVACY_POLICY" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/sozlesmeler/TERMS_OF_USE" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
              <li><Link href="/sozlesmeler/KVKK" className="hover:text-white transition-colors">KVKK Aydınlatma</Link></li>
              <li><Link href="/sozlesmeler/COOKIE_POLICY" className="hover:text-white transition-colors">Çerez Politikası</Link></li>
              <li><Link href="/sozlesmeler/DISTANCE_SALES" className="hover:text-white transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link href="/sozlesmeler/CANCELLATION_POLICY" className="hover:text-white transition-colors">İptal ve İade Politikası</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">İletişim</h4>
            <ul className="space-y-2 text-sm">
              <li className="leading-relaxed">Antalya Teknokent, Akdeniz Ünv. K:3 No:B116, Konyaaltı/Antalya</li>
              <li><a href="tel:05528658832" className="hover:text-white transition-colors">0552 865 88 32</a></li>
              <li><a href="mailto:info@randevya.com" className="hover:text-white transition-colors">info@randevya.com</a></li>
              <li><Link href="/iletisim" className="text-[#2a5cff] hover:text-blue-400 transition-colors font-medium">İletişim Formu &rarr;</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col items-center gap-4 text-sm">
          <Image
            src="/paytr-logo.png"
            alt="PayTR güvenli ödeme"
            width={120}
            height={20}
            className="opacity-70"
          />
          <span>&copy; 2026 Randevya. Tüm hakları saklıdır.</span>
        </div>
      </div>
    </footer>
  )
}
