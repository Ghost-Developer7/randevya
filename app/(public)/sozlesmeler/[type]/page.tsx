import { notFound } from "next/navigation"
import { db } from "@/lib/db"

const VALID_TYPES = ["KVKK", "PRIVACY_POLICY", "TERMS_OF_USE", "COOKIE_POLICY", "DISTANCE_SALES", "CANCELLATION_POLICY"]

export default async function LegalPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const typeUpper = type.toUpperCase()

  if (!VALID_TYPES.includes(typeUpper)) notFound()

  const doc = await db.legalDocument.findFirst({
    where: { type: typeUpper, is_active: true },
    select: { title: true, content: true, version: true },
  })

  if (!doc) notFound()

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">
          {doc.title}
        </h1>
        {doc.version && (
          <p className="text-xs text-zinc-400 mb-8">Versiyon: {doc.version}</p>
        )}
        <div
          className="prose prose-zinc max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: doc.content }}
        />
      </div>
    </div>
  )
}
