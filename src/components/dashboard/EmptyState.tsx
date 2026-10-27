import type { ReactNode } from "react"
import Icon from "@/components/ui/Icon"
export default function EmptyState({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="workspace-empty">
      <Icon name="file" size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
