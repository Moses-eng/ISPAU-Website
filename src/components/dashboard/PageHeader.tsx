import type { ReactNode } from "react"
export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="workspace-heading">
      <div>
        <p className="eyebrow">ISPAU / Membership services</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}
