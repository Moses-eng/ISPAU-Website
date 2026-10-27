import { workspaceFlags } from "@/config/workspace"
// Legacy public promotion remains hidden; private workspaces have their own enabled flag.
export const ENABLE_TRADE_CREDIT = workspaceFlags.publicTradeCreditEnabled

export const TRADE_CREDIT_ROUTES = new Set([
  "trade",
  "tc-dashboard",
  "tc-submit",
  "tc-case",
  "tc-verify",
  "reference",
  "reference-result",
  "record-request",
  "dispute",
  "reviewer",
])

export const TRADE_CREDIT_STATUSES = [
  "Under verification",
  "Verified overdue",
  "Disputed",
  "Repayment arrangement",
  "Settled",
] as const
