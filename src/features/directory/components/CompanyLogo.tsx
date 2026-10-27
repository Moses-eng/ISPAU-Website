import type { PublicMember } from "@/types/PublicMember"

export default function CompanyLogo({ member }: { member: PublicMember }) {
  if (!member.logoSrc)
    return (
      <span
        className="inline-flex h-20 w-28 items-center justify-center rounded-2xl bg-brand-tint text-2xl font-semibold text-brand"
        aria-label={`${member.name} logo placeholder`}
      >
        {member.initials}
      </span>
    )
  return (
    <span className="inline-flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden bg-white">
      <img
        src={member.logoSrc}
        alt={`${member.name} logo`}
        className="h-full w-full object-contain"
        width={144}
        height={96}
        loading="lazy"
        decoding="async"
      />
    </span>
  )
}
