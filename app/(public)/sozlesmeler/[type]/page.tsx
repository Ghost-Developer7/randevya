import { notFound } from "next/navigation"

async function getLegalDocument(type: string) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3003"}/api/legal/${type}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch {
    return null
  }
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const doc = await getLegalDocument(type)

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
