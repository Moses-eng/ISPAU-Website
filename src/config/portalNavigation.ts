import type { View } from "@/types/View"

export const portalNavigation: Record<string, [string, View][]> = {
  Applicant: [
    ["My application", "applicant"],
    ["Clarifications", "clarification"],
    ["Invoices", "applicant-invoices"],
  ],
  "Member user": [
    ["Membership", "member"],
    ["Public profile", "profile"],
    ["Invoices", "member-invoices"],
    ["Renewal", "renewal"],
  ],
  "ISP member user": [
    ["Membership", "member"],
    ["Public profile", "profile"],
    ["Invoices", "member-invoices"],
    ["Renewal", "renewal"],
  ],
  "Membership coordinator": [
    ["Applications", "staff"],
    ["Activation", "activation"],
    ["Member register", "member-register"],
  ],
  "Decision maker": [["Awaiting decision", "decision"]],
  "Accounts staff": [["Membership payments", "accounts"]],
  "Secretariat / Administrator": [
    ["Administration", "admin"],
    ["Member register", "member-register"],
    ["Directory administration", "directory-admin"],
    ["Email templates", "email-templates"],
    ["Design notes", "system"],
  ],
}
