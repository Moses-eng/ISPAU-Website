import type { ReactNode } from "react"

export default function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
}) {
  return (
    <span className={`tag tag-${tone}`}>
      <span className="tag-dot" />
      {children}
    </span>
  )
}
