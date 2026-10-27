import { getLocalUrl } from "@/features/membership/services/files"
import { useSyncExternalStore } from "react"
import { membershipService } from "@/services/membershipService"
import { published } from "@/features/membership/services/workflow"
import type { PublicMember } from "@/types/PublicMember"
export default function usePublicDirectory(): PublicMember[] {
  const state = useSyncExternalStore(
    membershipService.subscribe,
    membershipService.getSnapshot,
  )
  return state.applications.filter(published).map((a) => ({
    id: a.memberId!,
    name: a.profile.name,
    initials: a.profile.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 3)
      .join(""),
    identity: "independent",
    logoSrc: getLocalUrl(a.profile.logo),
    description: a.profile.description,
    city: a.profile.coverage.split(",")[0] || "Not provided",
    district: a.profile.coverage.split(",")[0] || "Not provided",
    services: a.profile.services
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    coverage: a.profile.coverage
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    website: a.profile.website.replace(/^https?:\/\//, ""),
    email: a.profile.contact.includes("@") ? a.profile.contact : undefined,
    phone: a.profile.contact.startsWith("+") ? a.profile.contact : undefined,
  }))
}
