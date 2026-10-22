import type { ReactNode } from "react"

export default function FormCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="form-card">
      <h3>{title}</h3>
      {children}
    </div>
  )
}
