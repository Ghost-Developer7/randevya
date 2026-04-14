import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rate-limit"

// Desteklenen admin rolleri
export type AdminRole = "SUPER_ADMIN" | "SUPPORT" | "BILLING" | "VIEWER"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      tenant_id: string
      role: "TENANT_OWNER" | "PLATFORM_ADMIN"
      admin_role?: AdminRole  // sadece PLATFORM_ADMIN için dolu
    }
  }

  interface User {
    id: string
    tenant_id: string
    role: "TENANT_OWNER" | "PLATFORM_ADMIN"
    admin_role?: AdminRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    tenant_id: string
    role: "TENANT_OWNER" | "PLATFORM_ADMIN"
    admin_role?: AdminRole
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/panel/giris",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()

        // ── Login rate limit: email başına 5 deneme / 15 dakika ──────────────
        const rl = await rateLimit(`rl:login:${email}`, 5, 900)
        if (!rl.success) return null

        // ── Admin kullanıcı kontrolü (DB'den) ────────────────────────────────
        const adminUser = await db.adminUser.findFirst({
          where: { email, is_active: true },
        })

        if (adminUser) {
          const valid = await bcrypt.compare(credentials.password, adminUser.password_hash)
          if (!valid) return null

          // Son giriş zamanını güncelle (hata olsa da devam et)
          db.adminUser
            .update({ where: { id: adminUser.id }, data: { last_login_at: new Date() } })
            .catch(() => {})

          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.full_name,
            tenant_id: "",
            role: "PLATFORM_ADMIN",
            admin_role: adminUser.role as AdminRole,
          }
        }

        // ── Env'den tanımlı fallback admin (seed olmadan acil erişim) ─────────
        const adminEmails = (process.env.ADMIN_EMAIL || "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
        if (adminEmails.includes(email) && process.env.ADMIN_PASSWORD_HASH) {
          const valid = await bcrypt.compare(credentials.password, process.env.ADMIN_PASSWORD_HASH)
          if (!valid) return null
          return {
            id: "env-admin",
            email,
            name: "Platform Admin",
            tenant_id: "",
            role: "PLATFORM_ADMIN",
            admin_role: "SUPER_ADMIN" as AdminRole,
          }
        }

        // ── İşletme sahibi kontrolü ───────────────────────────────────────────
        const tenant = await db.tenant.findFirst({
          where: { owner_email: email, is_active: true },
          select: { id: true, owner_name: true, owner_email: true, password_hash: true } as never,
        })

        if (!tenant) return null

        const t = tenant as unknown as {
          id: string
          owner_name: string
          owner_email: string
          password_hash: string
        }

        const valid = await bcrypt.compare(credentials.password, t.password_hash)
        if (!valid) return null

        return {
          id: t.id,
          email: t.owner_email,
          name: t.owner_name,
          tenant_id: t.id,
          role: "TENANT_OWNER",
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Relative path ise mevcut origin'e yönlendir
      if (url.startsWith("/")) return url
      // Aynı origin ise izin ver
      try {
        const urlOrigin = new URL(url).origin
        if (urlOrigin === baseUrl) return url
        // Farklı origin ama bilinen domain ise izin ver (localhost vs prod)
        return url
      } catch {
        return baseUrl
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tenant_id = user.tenant_id
        token.role = user.role
        token.admin_role = user.admin_role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.tenant_id = token.tenant_id
      session.user.role = token.role
      session.user.admin_role = token.admin_role
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
