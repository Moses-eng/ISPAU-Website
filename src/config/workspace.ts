import type { Actor, StaffRole } from "@/features/membership/types/workspace"
export const workspaceFlags = {
  tradeCreditEnabled: true,
  publicTradeCreditEnabled: false,
  demonstrationMode: true,
} as const
export const roleLabels: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  membership_admin: "Membership Admin",
  finance_admin: "Finance Admin",
}
export const demoStaff: Actor[] = [
  {
    id: "ispau-super",
    name: "ISPAU Super Admin",
    kind: "staff",
    roles: ["super_admin"],
  },
  {
    id: "ispau-membership",
    name: "ISPAU Membership Admin",
    kind: "staff",
    roles: ["membership_admin"],
  },
  {
    id: "ispau-finance",
    name: "ISPAU Finance Admin",
    kind: "staff",
    roles: ["finance_admin"],
  },
]
export const verificationLabels = [
  "Organisation registration",
  "Representative authority",
  "Applicable regulatory evidence",
]
export const tierOptions = ["Platinum", "Silver", "Associate", "Affiliate"]
export { can } from "./permissions.ts"
export const staffSections = [
  { id: "overview", label: "Overview" },
  { id: "applications", label: "Applications" },
  { id: "members", label: "Members" },
  { id: "billing", label: "Billing" },
  { id: "trade-credit", label: "Trade Credit" },
  { id: "communications", label: "Communications" },
  { id: "membership-activity", label: "Activity history" },
  { id: "finance-activity", label: "Activity history" },
  { id: "reports", label: "Reports" },
  { id: "administration", label: "Administration" },
  { id: "staff-activity", label: "Staff activity" },
] as const

export function staffGroup(section: string) {
  if (
    ["membership", "applications", "members", "membership-activity"].includes(
      section,
    )
  )
    return "membership"
  if (["finance", "billing", "finance-activity"].includes(section))
    return "finance"
  if (section === "communications") return "membership"
  return section
}
export const staffNavigation = [
  { id: "overview", label: "Overview", icon: "chart" },
  { id: "membership", label: "Membership", icon: "building" },
  { id: "finance", label: "Finance", icon: "file" },
  { id: "trade-credit", label: "Trade Credit", icon: "file" },
  { id: "reports", label: "Reports", icon: "chart" },
  { id: "staff-activity", label: "Staff activity", icon: "file" },
  { id: "administration", label: "Administration", icon: "lock" },
]
