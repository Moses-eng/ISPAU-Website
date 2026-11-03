import { can, workspaceForActor } from "../../../config/permissions.ts"
import { stages, type Actor, type WorkspaceState } from "../types/workspace.ts"

export type ReportSection = {
  id: string
  title: string
  columns: string[]
  rows: string[][]
  note?: string
}
export type PdfDocument = {
  id: string
  title: string
  description: string
  sections: ReportSection[]
  landscape?: boolean
}
export function buildStaffReport(
  state: WorkspaceState,
  actor: Actor,
  sectionId?: string,
  now = new Date(),
): PdfDocument {
  if (!can(actor, "reports.membership") && !can(actor, "reports.finance"))
    throw Error("You cannot download staff reports.")
  const view = workspaceForActor(state, actor),
    apps = view.applications,
    active = apps.filter((a) => a.stage === "Active")
  const sections: ReportSection[] = []
  if (can(actor, "reports.membership")) {
    sections.push({
      id: "stages",
      title: "Applications by stage",
      columns: ["Application stage", "Number of applications"],
      rows: stages
        .filter((stage) => stage !== "Draft")
        .map((stage) => [
          stage,
          String(apps.filter((a) => a.stage === stage).length),
        ]),
      note: `${apps.length} submitted applications in total. Private drafts are excluded.`,
    })
    sections.push({
      id: "tiers",
      title: "Active members by tier",
      columns: ["Membership tier", "Number of active members"],
      rows: [...new Set(active.map((a) => a.confirmedTier || a.requestedTier))]
        .sort()
        .map((tier) => [
          tier,
          String(
            active.filter((a) => (a.confirmedTier || a.requestedTier) === tier)
              .length,
          ),
        ]),
      note: `${active.length} active members in total.`,
    })
    const dates = [
      ...new Set(
        apps.flatMap((a) =>
          a.submittedAt ? [a.submittedAt.slice(0, 10)] : [],
        ),
      ),
    ].sort()
    sections.push({
      id: "submissions",
      title: "Applications received by date",
      columns: ["Submission date", "Number of applications"],
      rows: dates.map((date) => [
        date,
        String(apps.filter((a) => a.submittedAt?.startsWith(date)).length),
      ]),
    })
    const upcoming = active.filter((a) => {
      const days =
        (Date.parse(a.periodEnd) - Date.parse(now.toISOString().slice(0, 10))) /
        86400000
      return days >= 0 && days <= 90
    })
    sections.push({
      id: "renewals",
      title: "Upcoming renewals",
      columns: ["Organisation", "Member ID", "Tier", "Period ends"],
      rows: upcoming.map((a) => [
        a.organisation,
        a.memberId || "Not issued",
        a.confirmedTier || a.requestedTier,
        a.periodEnd,
      ]),
      note: "Membership periods ending in the next 90 days. This does not automatically renew or expire membership.",
    })
  }
  if (can(actor, "reports.finance"))
    sections.push({
      id: "finance",
      title: "Invoices and payment status",
      columns: [
        "Organisation",
        "Invoice reference",
        "Amount",
        "Payment status",
        "Confirmed by",
        "Period ends",
      ],
      rows: view.invoices.map((i) => [
        apps.find((a) => a.id === i.applicationId)?.organisation ||
          "Not available",
        i.id,
        `${i.currency} ${i.amount.toLocaleString("en-GB")}`,
        i.status,
        i.confirmedBy || "Not confirmed",
        i.periodEnd,
      ]),
      note: "Amounts remain in their original currency. A receipt does not confirm payment.",
    })
  const selected = sectionId
    ? sections.filter((section) => section.id === sectionId)
    : sections
  if (!selected.length)
    throw Error("This report is not available to your account.")
  return {
    id: `ispau-report-${sectionId || "all"}`,
    title: sectionId ? selected[0].title : "ISPAU operational report",
    description:
      "Current membership records and authorised financial information.",
    sections: selected,
    landscape: true,
  }
}

export type RecordDocumentKind =
  | "application-summary"
  | "membership-summary"
  | "billing-statement"
  | "proforma"
  | "tax-invoice"
  | "receipt"
export function recordDocumentDownload(
  state: WorkspaceState,
  actor: Actor,
  id: string,
  kind: RecordDocumentKind,
  filename: string,
  date = new Date().toISOString(),
) {
  assertRecordDownload(state, actor, id, kind)
  const next = structuredClone(state)
  next.applications
    .find((a) => a.id === id)!
    .activity.unshift({
      id: crypto.randomUUID(),
      actor: actor.name,
      date,
      text: `Download requested: ${filename}`,
      scope: [
        "proforma",
        "billing-statement",
        "tax-invoice",
        "receipt",
      ].includes(kind)
        ? "billing"
        : "membership",
    })
  return next
}
export function assertRecordDownload(
  state: WorkspaceState,
  actor: Actor,
  applicationId: string,
  kind: RecordDocumentKind,
) {
  const a = state.applications.find((a) => a.id === applicationId)
  const owner =
    a &&
    actor.kind === "organisation" &&
    actor.organisationId === a.organisationId &&
    a.portalAccess
  const permission =
    kind === "application-summary"
      ? "applications.review"
      : kind === "membership-summary"
        ? "members.manage"
        : "billing.manage"
  if (!a || !(owner || (a.stage !== "Draft" && can(actor, permission))))
    throw Error("You do not have permission to download this document.")
  if (kind === "membership-summary" && a.stage !== "Active")
    throw Error("A membership summary is available after activation.")
  return a
}
export function buildRecordDocument(
  state: WorkspaceState,
  actor: Actor,
  applicationId: string,
  kind: RecordDocumentKind,
  invoiceId?: string,
): PdfDocument {
  const a = assertRecordDownload(state, actor, applicationId, kind)
  const invoices = state.invoices.filter((i) => i.applicationId === a.id)
  const title =
    kind === "membership-summary"
      ? "Membership summary"
      : kind === "application-summary"
        ? "Application summary"
        : kind === "proforma"
          ? "Non-tax proforma - preview"
          : "Invoice statement"
  const rows = [
    ["Organisation", a.organisation],
    ["Application reference", a.id],
    ["Application status", a.stage],
    ["Membership tier", a.confirmedTier || a.requestedTier],
    ["Member ID", a.memberId || "Not issued"],
    ["Membership period", `${a.periodStart} to ${a.periodEnd}`],
  ]
  const sections: ReportSection[] = [
    {
      id: "record",
      title: a.organisation,
      columns: ["Detail", "Recorded information"],
      rows,
    },
  ]
  if (kind === "proforma") {
    const i = invoices.find((i) => i.id === invoiceId)
    if (!i) throw Error("Invoice not found for this organisation.")
    sections.push({
      id: "proforma",
      title: i.id,
      columns: ["Detail", "Recorded information"],
      rows: [
        ["Approved fee", `${i.currency} ${i.amount.toLocaleString("en-GB")}`],
        ["Membership period", `${i.periodStart} to ${i.periodEnd}`],
        ["Payment status", i.status],
      ],
      note: "NON-TAX PROFORMA - PREVIEW. This is not a tax invoice or proof of payment. Contact ISPAU for approved payment instructions.",
    })
  } else if (kind === "billing-statement" || kind === "membership-summary") {
    sections.push({
      id: "invoices",
      title: "Invoices",
      columns: [
        "Invoice reference",
        "Amount",
        "Payment status",
        "Membership period",
      ],
      rows: invoices.map((i) => [
        i.id,
        `${i.currency} ${i.amount.toLocaleString("en-GB")}`,
        i.status,
        `${i.periodStart} to ${i.periodEnd}`,
      ]),
    })
  } else if (kind === "application-summary") {
    sections.push({
      id: "contact",
      title: "Organisation contact details",
      columns: ["Detail", "Recorded information"],
      rows: [
        [
          "Registered address",
          String(a.values.registeredAddress || "Not provided"),
        ],
        ["Business email", String(a.values.businessEmail || "Not provided")],
        [
          "Representative",
          String(a.values.representativeName || "Not provided"),
        ],
      ],
      note: "This summary is not an admission decision or membership certificate. Internal verification notes and supporting documents are excluded.",
    })
  } else
    throw Error(
      "Uploaded documents must be downloaded as their original files.",
    )
  return {
    id: `${invoiceId || a.id}-${kind}`,
    title,
    description:
      "A dated copy of the current ISPAU record. Amounts are shown in their recorded currency.",
    sections,
  }
}
