import type {
  Actor,
  Application,
  FileRecord,
} from "../../membership/types/workspace.ts"
export const creditStatuses = [
  "under verification",
  "verified overdue",
  "disputed",
  "repayment arrangement",
  "settled",
] as const
export type CreditStatus = (typeof creditStatuses)[number]
export type CreditRecord = {
  id: string
  organisationId: string
  customer: string
  contract: string
  invoices: string
  history: string
  balance: number
  currency: string
  reminders: string
  evidence: FileRecord[]
  status: CreditStatus
  updatedAt: string
  verifiedBy?: string
  verification?: string
  noticeAt?: string
  noticeText?: string
  reviewer?: string
  conflictDeclaration?: string
  appealReason?: string
  outcome?: string
  approved?: boolean
  activity: { id: string; actor: string; date: string; text: string }[]
}
export type Reference = {
  id: string
  organisationId: string
  customer: string
  summary: string
  date: string
}
export type CreditState = {
  records: CreditRecord[]
  references: Reference[]
  enrolments: {
    organisationId: string
    officer: string
    contact: string
    acceptedAt: string
  }[]
  searches: {
    id: string
    organisationId: string
    customer: string
    purpose: string
    date: string
    matches: string[]
  }[]
  requests: {
    id: string
    kind: "Request my record" | "Dispute or appeal"
    recordId?: string
    name: string
    contact: string
    reason: string
    status: "Received" | "Identity verification needed" | "Responded"
    response?: string
  }[]
}
export type CreditCommand =
  | { type: "enrol"; officer: string; contact: string; accepted: boolean }
  | {
      type: "submit"
      customer: string
      contract: string
      invoices: string
      history: string
      balance: number
      currency: string
      reminders: string
      evidence: FileRecord[]
    }
  | { type: "reference"; customer: string; summary: string }
  | { type: "search"; customer: string; purpose: string; authorised: boolean }
  | { type: "notice"; id: string; text: string }
  | {
      type: "verify"
      id: string
      note: string
      checks: boolean
      status:
        "verified overdue" | "disputed" | "repayment arrangement" | "settled"
    }
  | {
      type: "update"
      id: string
      history: string
      balance: number
      requestedStatus: CreditStatus
    }
  | { type: "dispute"; id: string; reason: string }
  | {
      type: "assign"
      id: string
      reviewer: string
      declaration: string
      independent: boolean
    }
  | {
      type: "resolve"
      id: string
      outcome: string
      status: "verified overdue" | "repayment arrangement" | "settled"
      confirmedIndependent: boolean
    }
  | {
      type: "request-status"
      id: string
      status: "Identity verification needed" | "Responded"
      response: string
    }
export function createCreditState(): CreditState {
  return {
    records: [
      {
        id: "TC-DEMO-001",
        organisationId: "org-5",
        customer: "Example Warehouse Ltd (sample)",
        contract: "DEMO-CONTRACT-01",
        invoices: "DEMO-INV-01; due 2026-09-30",
        history: "Sample invoice awaiting payment verification.",
        balance: 1200,
        currency: "USD",
        reminders: "Sample reminder dated 2026-10-10; response pending.",
        evidence: [],
        status: "under verification",
        updatedAt: "2026-10-20T09:00:00Z",
        activity: [],
      },
    ],
    references: [],
    enrolments: [],
    searches: [],
    requests: [],
  }
}
const requireText = (text: string, label: string) => {
  if (!text.trim()) throw new Error(`${label} is required.`)
}
export function canParticipate(actor: Actor, applications: Application[]) {
  return (
    actor.kind === "organisation" &&
    applications.some(
      (a) =>
        a.organisationId === actor.organisationId &&
        a.stage === "Active" &&
        a.portalAccess &&
        a.standing === "Current" &&
        a.tradeCreditAccess?.enabled === true,
    )
  )
}
export function applyCreditCommand(
  previous: CreditState,
  actor: Actor,
  command: CreditCommand,
  applications: Application[],
  date = new Date().toISOString(),
): CreditState {
  const s = structuredClone(previous)
  const admin = actor.kind === "staff" && actor.roles.includes("secretariat")
  const member = canParticipate(actor, applications)
  if (!admin && !member)
    throw new Error(
      "Trade Credit requires an active, authorised ISP account or ISPAU administrator.",
    )
  const needsAdmin = [
    "notice",
    "verify",
    "assign",
    "resolve",
    "request-status",
  ].includes(command.type)
  if (needsAdmin && !admin)
    throw new Error("ISPAU administrator access is required.")
  if (
    ["enrol", "submit", "reference", "search", "update", "dispute"].includes(
      command.type,
    ) &&
    !member
  )
    throw new Error(
      "Use an authorised ISP organisation account for this action.",
    )
  const enrolled = s.enrolments.some(
    (e) => e.organisationId === actor.organisationId,
  )
  if (
    ["submit", "reference", "search", "update", "dispute"].includes(
      command.type,
    ) &&
    !enrolled
  )
    throw new Error(
      "Appoint an accountable officer and accept the participation rules first.",
    )
  const id = () => `TC-${crypto.randomUUID()}`
  if (command.type === "enrol") {
    requireText(command.officer, "Accountable officer")
    requireText(command.contact, "Officer contact")
    if (!command.accepted)
      throw new Error("Participation rules must be accepted.")
    s.enrolments = s.enrolments.filter(
      (e) => e.organisationId !== actor.organisationId,
    )
    s.enrolments.push({
      organisationId: actor.organisationId!,
      officer: command.officer,
      contact: command.contact,
      acceptedAt: date,
    })
    return s
  }
  if (command.type === "submit") {
    for (const [label, value] of Object.entries({
      Customer: command.customer,
      Contract: command.contract,
      Invoices: command.invoices,
      "Payment history": command.history,
      Reminders: command.reminders,
      Currency: command.currency,
    }))
      requireText(value, label)
    if (!Number.isFinite(command.balance) || command.balance <= 0)
      throw new Error("Outstanding balance must be greater than zero.")
    if (!/^[A-Z]{3}$/.test(command.currency))
      throw new Error("Use a three-letter currency code.")
    if (!command.evidence.length)
      throw new Error("Add supporting evidence before submitting.")
    for (const f of command.evidence)
      if (
        f.size > 10485760 ||
        !["application/pdf", "image/jpeg", "image/png"].includes(f.type)
      )
        throw new Error("Evidence must be PDF, JPG or PNG up to 10 MB.")
    s.records.push({
      ...command,
      id: id(),
      organisationId: actor.organisationId!,
      status: "under verification",
      updatedAt: date,
      approved: false,
      activity: [
        {
          id: id(),
          date,
          actor: actor.name,
          text: "Submitted for ISPAU verification; unavailable to other ISPs.",
        },
      ],
    })
    return s
  }
  if (command.type === "reference") {
    requireText(command.customer, "Customer")
    requireText(command.summary, "Satisfactory payment history")
    s.references.push({
      id: id(),
      organisationId: actor.organisationId!,
      customer: command.customer,
      summary: command.summary,
      date,
    })
    return s
  }
  if (command.type === "search") {
    requireText(command.customer, "Exact customer name")
    requireText(command.purpose, "Legitimate credit decision purpose")
    if (!command.authorised)
      throw new Error("Confirm authority for this reference request.")
    const matches = s.records
      .filter(
        (r) =>
          r.approved &&
          r.status !== "under verification" &&
          r.customer.trim().toLowerCase() ===
            command.customer.trim().toLowerCase(),
      )
      .map((r) => r.id)
    s.searches.push({
      id: id(),
      organisationId: actor.organisationId!,
      customer: command.customer,
      purpose: command.purpose,
      date,
      matches,
    })
    return s
  }
  if (command.type === "request-status") {
    const request = s.requests.find((r) => r.id === command.id)
    if (!request) throw new Error("Request unavailable.")
    requireText(command.response, "Response or verification instructions")
    request.status = command.status
    request.response = command.response
    return s
  }
  const r = s.records.find((r) => r.id === command.id)
  if (!r || (!admin && r.organisationId !== actor.organisationId))
    throw new Error("This organisation cannot access that case.")
  let text = ""
  if (command.type === "notice") {
    requireText(command.text, "Customer notice")
    r.noticeAt = date
    r.noticeText = command.text
    text =
      "Customer notice prepared; delivery pending. Early resolution is available."
  }
  if (command.type === "verify") {
    requireText(command.note, "Verification findings")
    if (!command.checks || !r.noticeAt)
      throw new Error(
        "Check identity, completeness and payment position, and record customer notice before approval.",
      )
    if (r.status === "disputed")
      throw new Error(
        "A disputed claim requires independent review before its status can change.",
      )
    r.verifiedBy = actor.name
    r.verification = command.note
    r.status = command.status
    r.approved = true
    text = `ISPAU verified evidence and recorded ${command.status}.`
  }
  if (command.type === "update") {
    requireText(command.history, "Payment update")
    if (!Number.isFinite(command.balance) || command.balance < 0)
      throw new Error("Balance cannot be negative.")
    r.history = command.history
    r.balance = command.balance
    // Member updates require fresh verification. A disputed claim retains its warning.
    r.status = r.status === "disputed" ? "disputed" : "under verification"
    r.approved = false
    r.verification = undefined
    r.verifiedBy = undefined
    text = `Member reported ${command.requestedStatus}; awaits ISPAU verification.`
  }
  if (command.type === "dispute") {
    requireText(command.reason, "Dispute reason")
    r.status = "disputed"
    r.appealReason = command.reason
    r.reviewer = undefined
    r.conflictDeclaration = undefined
    r.outcome = undefined
    text = "Dispute opened; claim is contested and not a confirmed default."
  }
  if (command.type === "assign") {
    if (r.status !== "disputed")
      throw new Error("Independent review is for disputed cases.")
    requireText(command.reviewer, "Independent reviewer")
    requireText(command.declaration, "Conflict-of-interest declaration")
    if (
      !command.independent ||
      command.reviewer.trim().toLowerCase() === actor.name.trim().toLowerCase()
    )
      throw new Error(
        "An independent reviewer must be separate from the administrator and reporting ISP.",
      )
    r.reviewer = command.reviewer
    r.conflictDeclaration = command.declaration
    text = `Independent review assigned to ${command.reviewer}; declaration recorded.`
  }
  if (command.type === "resolve") {
    if (
      r.status !== "disputed" ||
      !r.reviewer ||
      !r.conflictDeclaration ||
      !command.confirmedIndependent ||
      !r.noticeAt
    )
      throw new Error(
        "Record customer notice and an independent review with a conflict declaration before an outcome.",
      )
    requireText(command.outcome, "Independent outcome")
    if (command.status === "settled" && r.balance !== 0)
      throw new Error("Record zero outstanding balance before settlement.")
    r.outcome = command.outcome
    r.status = command.status
    r.approved = true
    r.verifiedBy = actor.name
    text = `Independent outcome recorded on behalf of ${r.reviewer}: ${command.outcome}`
  }
  if (
    command.type === "verify" &&
    command.status === "settled" &&
    r.balance !== 0
  )
    throw new Error("Record zero outstanding balance before settlement.")
  r.updatedAt = date
  r.activity.unshift({ id: id(), actor: actor.name, date, text })
  return s
}
export function referenceResults(
  s: CreditState,
  actor: Actor,
  searchId: string,
) {
  const search = s.searches.find(
    (x) => x.id === searchId && x.organisationId === actor.organisationId,
  )
  if (actor.kind !== "organisation" || !search)
    throw new Error(
      "A logged reference request for this organisation is required.",
    )
  return s.records
    .filter(
      (r) =>
        search.matches.includes(r.id) &&
        r.approved &&
        r.status !== "under verification",
    )
    .map((r) => ({
      id: r.id,
      customer: r.customer,
      status: r.status,
      balance: r.balance,
      currency: r.currency,
      updatedAt: r.updatedAt,
    }))
}
export function addCustomerRequest(
  previous: CreditState,
  request: Omit<CreditState["requests"][number], "id" | "status">,
): CreditState {
  requireText(request.name, "Business customer name")
  requireText(request.contact, "Reply contact")
  requireText(request.reason, "Request details")
  const s = structuredClone(previous)
  s.requests.push({
    ...request,
    id: `REQ-${crypto.randomUUID()}`,
    status: "Received",
  })
  if (request.kind === "Dispute or appeal" && request.recordId) {
    const r = s.records.find((r) => r.id === request.recordId)
    if (r) {
      r.status = "disputed"
      r.appealReason =
        "Customer dispute received; identity and details require staff verification."
      r.reviewer = undefined
      r.conflictDeclaration = undefined
      r.outcome = undefined
      r.updatedAt = new Date().toISOString()
      r.activity.unshift({
        id: crypto.randomUUID(),
        actor: "Customer request intake",
        date: r.updatedAt,
        text: "Dispute received; requester identity and claim require verification.",
      })
    }
  }
  return s
}

export function memberNotices(state: CreditState) {
  return state.records
    .filter((r) => r.approved && r.status !== "under verification")
    .map((r) => ({ id: r.id, status: r.status, updatedAt: r.updatedAt }))
}
