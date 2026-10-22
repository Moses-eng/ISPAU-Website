import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import type { ReactNode } from "react"
import type { View } from "@/types/View"

export default function PublicShell({
  children,
  go,
}: {
  children: ReactNode
  go: (view: View) => void
}) {
  return (
    <div className="public-site">
      <Header go={go} />
      <main>{children}</main>
      <Footer go={go} />
    </div>
  )
}
