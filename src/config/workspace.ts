import type { Actor, StaffRole } from "@/features/membership/types/workspace"
export const workspaceFlags = {
  tradeCreditEnabled: true,
  publicTradeCreditEnabled: false,
  demonstrationMode: true,
} as const
export const roleLabels: Record<StaffRole, string> = {
  membership: "Membership team",
  decision: "Authorised decision maker",
  accounts: "Accounts",
  secretariat: "Secretariat / administrator",
}
export const demoStaff: Actor[] = [
  {
    id: "ispau-admin",
    name: "ISPAU Admin",
    kind: "staff",
    roles: ["membership", "decision", "accounts", "secretariat"],
  },
]
export const verificationLabels = [
  "Organisation registration",
  "Representative authority",
  "Applicable regulatory evidence",
]
export const tierOptions = ["Platinum", "Silver", "Associate", "Affiliate"]
export const staffSections = [
  {
    id: "overview",
    label: "Overview",
    icon: "chart",
    roles: ["membership", "decision", "accounts", "secretariat"],
  },
  {
    id: "applications",
    label: "Applications",
    icon: "file",
    roles: ["membership", "decision", "secretariat"],
  },
  {
    id: "members",
    label: "Members",
    icon: "building",
    roles: ["membership", "secretariat"],
  },
  {
    id: "billing",
    label: "Billing",
    icon: "file",
    roles: ["accounts", "membership", "secretariat"],
  },
  {
    id: "communications",
    label: "Communications",
    icon: "mail",
    roles: ["membership", "secretariat"],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "chart",
    roles: ["membership", "secretariat", "accounts"],
  },
  {
    id: "trade-credit",
    label: "Trade Credit",
    icon: "shield",
    roles: ["secretariat"],
  },
  {
    id: "administration",
    label: "Administration",
    icon: "shield",
    roles: ["secretariat"],
  },
] as const
export const can = (actor: Actor, ...roles: StaffRole[]) =>
  actor.kind === "staff" && actor.roles.some((role) => roles.includes(role))

export function staffGroup(section: string) {
  if (["membership", "applications", "members", "billing"].includes(section))
    return "membership"
  if (["communications", "administration"].includes(section))
    return "administration"
  return section
}
export function memberGroup(section: string) {
  if (
    ["company", "organisation", "representatives", "profile"].includes(section)
  )
    return "company"
  if (["membership", "invoices", "renewal"].includes(section))
    return "membership"
  return section
}
export const staffNavigation = [
  { id: "overview", label: "Overview", icon: "chart" },
  { id: "membership", label: "Membership", icon: "building" },
  { id: "trade-credit", label: "Trade Credit", icon: "shield" },
  { id: "reports", label: "Reports", icon: "chart" },
  { id: "administration", label: "Administration", icon: "lock" },
]
export const memberNavigation = [
  { id: "overview", label: "Overview", icon: "chart" },
  { id: "company", label: "Company", icon: "building" },
  { id: "membership", label: "Membership", icon: "file" },
  { id: "trade-credit", label: "Trade Credit", icon: "shield" },
  { id: "account", label: "Account", icon: "lock" },
]
export const demoMemberOrganisationId = "org-5"
