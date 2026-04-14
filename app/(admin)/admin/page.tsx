import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PLATFORM_ADMIN") {
    redirect("/panel/giris")
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900">
          Admin Panel
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Platform yönetim paneli - yakın zamanda aktif olacak.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "İşletmeler", desc: "Tüm işletmeleri yönet", href: "/admin/tenants" },
            { label: "Ödemeler & Faturalar", desc: "Ödemeleri takip et, fatura yükle", href: "/admin/odemeler" },
            { label: "Kuponlar", desc: "İndirim kuponlarını yönet", href: "/admin/kuponlar" },
            { label: "Planlar", desc: "Abonelik planlarını düzenle", href: "/admin/plans" },
            { label: "E-Posta Ayarları", desc: "SMTP yapılandırması", href: "/admin/email-ayarlari" },
            { label: "Destek", desc: "Destek taleplerini gör", href: "/admin/support" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold text-zinc-900">
                {item.label}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
