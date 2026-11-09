// Shared UI-preview contract. Production must derive the actor and eligibility from the session.
export type CreditActor = {
  id: string
  name: string
  kind: string
  roles: string[]
  organisationId?: string
}
export type Evidence = {
  id: string
  name: string
  size: number
  type: string
  category: string
}
export type Complaint = {
  id: string
  organisationId: string
  customer: string
  contract: string
  invoices: string
  history: string
  balance: number
  currency: string
  reminders: string
  evidence: Evidence[]
  status:
    | "under verification"
    | "verified overdue"
    | "disputed"
    | "repayment arrangement"
    | "settled"
  approved: boolean
  updatedAt: string
  verification?: string
  verifiedBy?: string
  reviewOutcome?: "Approved" | "Clarification needed" | "Declined"
  activity: { id: string; actor: string; date: string; text: string }[]
}
export type ComplaintInput = Pick<
  Complaint,
  | "customer"
  | "contract"
  | "invoices"
  | "history"
  | "balance"
  | "currency"
  | "reminders"
  | "evidence"
>
export type ReferenceResult = Pick<
  Complaint,
  "id" | "customer" | "status" | "balance" | "currency" | "updatedAt"
>
export type ReferenceQuery = {
  id: string
  organisationId: string
  customer: string
  purpose: string
  date: string
  matches: string[]
}
export type ComplaintStore = {
  records: Complaint[]
  searches: ReferenceQuery[]
}
export type Review = {
  outcome: "Approved" | "Clarification needed" | "Declined"
  note: string
  identity: boolean
  invoices: boolean
  balance: boolean
  notice: boolean
  expectedUpdatedAt: string
}
export const canReviewComplaints = (actor: CreditActor) =>
  actor.kind === "staff" &&
  actor.roles.some((r) => ["super_admin", "membership_admin"].includes(r))
export function requireParticipant(actor: CreditActor, eligible: boolean) {
  if (actor.kind !== "organisation" || !actor.organisationId || !eligible)
    throw Error("An active, verified ISP subscription is required.")
}
export function visibleComplaints(
  store: ComplaintStore,
  actor: CreditActor,
  eligible: boolean,
) {
  if (canReviewComplaints(actor)) return store.records
  requireParticipant(actor, eligible)
  return store.records.filter((r) => r.organisationId === actor.organisationId)
}
export function submitComplaint(
  store: ComplaintStore,
  actor: CreditActor,
  eligible: boolean,
  input: ComplaintInput,
) {
  requireParticipant(actor, eligible)
  for (const key of [
    "customer",
    "contract",
    "invoices",
    "history",
    "reminders",
  ] as const)
    if (typeof input[key] !== "string" || !input[key].trim())
      throw Error(`${key} is required.`)
  if (!Number.isFinite(input.balance) || input.balance <= 0)
    throw Error("Outstanding balance must be greater than zero.")
  if (!/^[A-Z]{3}$/.test(input.currency))
    throw Error("Choose a valid currency.")
  if (
    !Array.isArray(input.evidence) ||
    !input.evidence.length ||
    input.evidence.length > 10
  )
    throw Error("Attach between one and ten supporting files.")
  for (const f of input.evidence)
    if (
      !f.id ||
      !/\.(pdf|jpe?g|png)$/i.test(f.name) ||
      !["application/pdf", "image/jpeg", "image/png"].includes(f.type) ||
      f.size <= 0 ||
      f.size > 10485760
    )
      throw Error("Evidence must be PDF, JPG or PNG up to 10 MB each.")
  const date = new Date().toISOString()
  const record: Complaint = {
    id: `TC-${crypto.randomUUID()}`,
    organisationId: actor.organisationId!,
    customer: input.customer.trim(),
    contract: input.contract.trim(),
    invoices: input.invoices.trim(),
    history: input.history.trim(),
    balance: input.balance,
    currency: input.currency,
    reminders: input.reminders.trim(),
    evidence: structuredClone(input.evidence),
    status: "under verification",
    approved: false,
    updatedAt: date,
    activity: [
      {
        id: crypto.randomUUID(),
        actor: actor.name,
        date,
        text: "Complaint submitted privately for ISPAU verification.",
      },
    ],
  }
  store.records.unshift(record)
  return record
}
export function reviewComplaint(
  store: ComplaintStore,
  actor: CreditActor,
  id: string,
  review: Review,
) {
  if (!canReviewComplaints(actor))
    throw Error("Super Admin or Membership Admin access is required.")
  const r = store.records.find((r) => r.id === id)
  if (!r) throw Error("Complaint unavailable.")
  if (r.updatedAt !== review.expectedUpdatedAt)
    throw Error("This complaint changed. Refresh it before reviewing.")
  if (r.approved || r.reviewOutcome === "Declined")
    throw Error("This complaint has already been reviewed.")
  if (
    !["Approved", "Clarification needed", "Declined"].includes(
      review.outcome,
    ) ||
    !review.note?.trim()
  )
    throw Error("Choose an outcome and enter review findings.")
  if (
    review.outcome === "Approved" &&
    (review.identity !== true ||
      review.invoices !== true ||
      review.balance !== true ||
      review.notice !== true ||
      !r.evidence.length ||
      r.status === "disputed")
  )
    throw Error(
      "Check the customer, evidence, outstanding balance and customer notice before approval. Disputed claims need independent review.",
    )
  if (
    review.outcome === "Approved" &&
    (!Number.isFinite(r.balance) || r.balance <= 0)
  )
    throw Error(
      "An overdue reference requires a positive verified outstanding balance.",
    )
  r.approved = review.outcome === "Approved"
  r.status = r.approved ? "verified overdue" : r.status
  r.reviewOutcome = review.outcome
  r.verification = review.note.trim()
  r.verifiedBy = actor.name
  r.updatedAt = new Date().toISOString()
  r.activity.unshift({
    id: crypto.randomUUID(),
    actor: actor.name,
    date: r.updatedAt,
    text: `${review.outcome}: ${r.verification}`,
  })
  return r
}
export function requestReference(
  store: ComplaintStore,
  actor: CreditActor,
  eligible: boolean,
  input: { customer: string; purpose: string; authorised: boolean },
) {
  requireParticipant(actor, eligible)
  if (
    !input.customer?.trim() ||
    !input.purpose?.trim() ||
    input.authorised !== true
  )
    throw Error(
      "Enter the exact customer name, purpose and your authorisation.",
    )
  const results: ReferenceResult[] = store.records
    .filter(
      (r) =>
        r.approved &&
        r.status !== "under verification" &&
        r.customer.trim().toLowerCase() === input.customer.trim().toLowerCase(),
    )
    .map(({ id, customer, status, balance, currency, updatedAt }) => ({
      id,
      customer,
      status,
      balance,
      currency,
      updatedAt,
    }))
  const query: ReferenceQuery = {
    id: `REF-${crypto.randomUUID()}`,
    organisationId: actor.organisationId!,
    customer: input.customer.trim(),
    purpose: input.purpose.trim(),
    date: new Date().toISOString(),
    matches: results.map((r) => r.id),
  }
  store.searches.unshift(query)
  return { query, results }
}
