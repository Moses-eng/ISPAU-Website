export const stages = [
  "Draft",
  "Submitted",
  "Under review",
  "Clarification needed",
  "Decision pending",
  "Approved awaiting payment",
  "Active",
  "Deferred",
  "Declined",
] as const
export type Stage = (typeof stages)[number]
export type StaffRole = "membership" | "decision" | "accounts" | "secretariat"
export type Actor = {
  id: string
  name: string
  kind: "staff" | "organisation"
  roles: StaffRole[]
  organisationId?: string
}
export type Values = Record<string, string | boolean>
export type FileRecord = {
  id: string
  name: string
  size: number
  type: string
  category: string
}
export type PublicProfile = {
  name: string
  description: string
  services: string
  coverage: string
  website: string
  contact: string
  logo?: string
}
export type Activity = { id: string; date: string; actor: string; text: string }
export type Clarification = {
  id: string
  items: string[]
  requestedBy: string
  date: string
  response?: string
  respondedAt?: string
}
export type Verification = {
  label: string
  result: "Verified" | "Clarification needed" | "Not applicable"
  reviewer: string
  date: string
  note: string
}
export type Application = {
  id: string
  organisationId: string
  organisation: string
  requestedTier: string
  confirmedTier?: string
  stage: Stage
  submittedAt?: string
  updatedAt: string
  reviewer: string
  values: Values
  evidence: FileRecord[]
  verifications: Verification[]
  clarifications: Clarification[]
  decisions: {
    outcome: string
    reason: string
    tier?: string
    actor: string
    date: string
  }[]
  activity: Activity[]
  eligible: boolean
  profileApproved: boolean
  consent: boolean
  profile: PublicProfile
  proposedProfile?: PublicProfile
  standing: "Current" | "Review required"
  tradeCreditAccess?: {
    enabled: boolean
    actor: string
    date: string
    reason: string
  }
  portalAccess: boolean
  memberId?: string
  periodStart: string
  periodEnd: string
  renewalConfirmedAt?: string
}
export type Invoice = {
  id: string
  applicationId: string
  amount: number
  currency: string
  periodStart: string
  periodEnd: string
  status: "Awaiting payment" | "Receipt submitted" | "Confirmed"
  paymentReference?: string
  paymentDate?: string
  receipt?: FileRecord
  confirmedBy?: string
  taxInvoice?: FileRecord
}
export type Notice = {
  id: string
  applicationId: string
  template: string
  body: string
  actor: string
  date: string
}
export type WorkspaceState = {
  version: 1
  applications: Application[]
  invoices: Invoice[]
  notices: Notice[]
  nextMemberNumber: number
}
export type Command =
  | { type: "trade-access"; id: string; enabled: boolean; reason: string }
  | { type: "start-review"; id: string }
  | { type: "verify"; id: string; results: Verification[] }
  | { type: "clarify"; id: string; items: string[] }
  | { type: "respond"; id: string; response: string }
  | { type: "send-decision"; id: string }
  | {
      type: "decide"
      id: string
      outcome: "Approve" | "Defer" | "Decline"
      reason: string
      tier: string
      amount?: number
      currency?: string
    }
  | {
      type: "payment"
      id: string
      reference: string
      date: string
      receipt?: FileRecord
    }
  | { type: "confirm-payment"; id: string }
  | { type: "tax-invoice"; id: string; file: FileRecord }
  | { type: "activate"; id: string }
  | { type: "profile"; id: string; profile: PublicProfile; consent: boolean }
  | { type: "staff-profile"; id: string; profile: PublicProfile }
  | { type: "approve-profile"; id: string; eligible: boolean }
  | { type: "withdraw"; id: string }
  | { type: "details"; id: string; values: Values }
  | { type: "renew"; id: string }
  | {
      type: "save-draft" | "submit"
      id: string
      values: Values
      evidence: FileRecord[]
    }
  | { type: "send-notice"; id: string; template: string; body: string }
  | { type: "reviewer"; id: string; reviewer: string }
