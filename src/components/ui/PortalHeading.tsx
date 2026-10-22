import type { ReactNode } from "react"

export default function PortalHeading({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: string
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="portal-heading">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action && <div className="button-row">{action}</div>}
    </div>
  )
}
