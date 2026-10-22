// Disabled until the Trade Credit release is approved.
export const ENABLE_TRADE_CREDIT = false

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
