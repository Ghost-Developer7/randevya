/**
 * Admin şifresi için bcrypt hash üretir.
 * Kullanım: npx tsx scripts/generate-admin-hash.ts <şifre>
 *
 * Çıktıyı .env.local içine ADMIN_PASSWORD_HASH= olarak yapıştır.
 */
import bcrypt from "bcryptjs"

const password = process.argv[2]

if (!password) {
  console.error("Kullanım: npx tsx scripts/generate-admin-hash.ts <şifre>")
  process.exit(1)
}

if (password.length < 8) {
  console.error("Şifre en az 8 karakter olmalı")
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)

console.log("\n✅ Hash üretildi:")
console.log(`\nADMIN_PASSWORD_HASH=${hash}\n`)
console.log("Bu satırı .env.local dosyasına ekle.")
