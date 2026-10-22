import type { PublicMember } from "@/types/PublicMember"

export default function CompanyLogo({ member }: { member: PublicMember }) {
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
