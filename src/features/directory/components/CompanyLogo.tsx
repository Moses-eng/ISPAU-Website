import { useState } from "react"
import type { PublicMember } from "@/types/PublicMember"

export interface CompanyLogoProps {
  member: PublicMember
  className?: string
}

export default function CompanyLogo({ member, className = "" }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false)

  // Resolve logo URL (supports logo_url)
  const src = member.logo_url
  const isImage = Boolean(src)

  // Generate initials if not already provided
  const initials =
    member.initials ||
    (member.name || member.legal_name || "IS")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()

  if (isImage && !hasError && src) {
    return (
      <img
        src={src}
        alt={`${member.name} logo`}
        className={className}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <span
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--burgundy-tint, #f7f0f2)",
        color: "var(--burgundy-primary, #650b23)",
        fontWeight: 700,
        fontSize: "1.1rem",
        borderRadius: "inherit",
        letterSpacing: "0.05em",
        userSelect: "none",
      }}
    >
      {initials}
    </span>
  )
}
