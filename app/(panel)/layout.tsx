import SessionProvider from "@/components/panel/SessionProvider"
import PanelShell from "@/components/panel/PanelShell"

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <PanelShell>{children}</PanelShell>
    </SessionProvider>
  )
}
