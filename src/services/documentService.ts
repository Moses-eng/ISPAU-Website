import {
  buildStaffReport,
  buildRecordDocument,
  assertRecordDownload,
  type PdfDocument,
  type RecordDocumentKind,
} from "@/features/membership/services/reports"
import type { Actor } from "@/features/membership/types/workspace"
import { membershipService } from "./membershipService"
import { staffAuditService } from "./staffAuditService"
import { sessionService } from "./sessionService"
import { getLocalFile } from "@/features/membership/services/files"
import type { AuditArea } from "@/features/staff/services/audit"
import { can } from "@/config/permissions"

export type DocumentRequest =
  | { kind: "report"; sectionId?: string }
  | { kind: RecordDocumentKind; applicationId: string; invoiceId?: string }
  | { kind: "member-register"; query?: string }
  | {
      kind: "audit"
      area?: AuditArea
      filters: {
        query: string
        person: string
        kind: string
        area: string
        from: string
        to: string
      }
    }

let assets: Promise<{ font: string; logo: string }> | undefined
function base64(buffer: ArrayBuffer) {
  let result = ""
  for (const byte of new Uint8Array(buffer)) result += String.fromCharCode(byte)
  return btoa(result)
}
function loadAssets() {
  return (assets ??= Promise.all(
    ["/fonts/DejaVuSans.ttf", "/ispau-logo.png"].map(async (path) => {
      const response = await fetch(path)
      if (!response.ok)
        throw Error("The PDF assets could not be loaded. Please try again.")
      return base64(await response.arrayBuffer())
    }),
  )
    .then(([font, logo]) => ({ font, logo: `data:image/png;base64,${logo}` }))
    .catch((error) => {
      assets = undefined
      throw error
    }))
}
export async function downloadDocument(actor: Actor, request: DocumentRequest) {
  const state = membershipService.getSnapshot()
  let document: PdfDocument
  let area: AuditArea = "membership"
  let recordId: string | undefined
  if (request.kind === "report") {
    document = buildStaffReport(state, actor, request.sectionId)
    area =
      request.sectionId === "finance" || !can(actor, "reports.membership")
        ? "finance"
        : request.sectionId || !can(actor, "reports.finance")
          ? "membership"
          : "reports"
  } else if (request.kind === "member-register") {
    if (!can(actor, "members.manage"))
      throw Error("You cannot export the member register.")
    const rows = state.applications.filter(
      (a) =>
        a.stage === "Active" &&
        `${a.organisation} ${a.memberId}`
          .toLowerCase()
          .includes((request.query || "").toLowerCase()),
    )
    document = {
      id: "ispau-member-register",
      title: "Member register",
      description: `Current active members${request.query ? ` matching: ${request.query}` : ""}. Private evidence and representatives are excluded.`,
      landscape: true,
      sections: [
        {
          id: "members",
          title: "Active members",
          columns: [
            "Member ID",
            "Organisation",
            "Tier",
            "Membership period",
            "Standing",
          ],
          rows: rows.map((a) => [
            a.memberId || "Not issued",
            a.organisation,
            a.confirmedTier || a.requestedTier,
            `${a.periodStart} to ${a.periodEnd}`,
            a.standing,
          ]),
        },
      ],
    }
  } else if (request.kind === "audit") {
    if (
      request.area
        ? !staffAuditService.canViewArea(actor, request.area)
        : !can(actor, "audit.global")
    )
      throw Error("You cannot export this activity log.")
    const f = request.filters
    const rows = staffAuditService
      .snapshot(actor, request.area)
      .filter((event) => {
        const date = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Africa/Kampala",
        }).format(new Date(event.date))
        return (
          (!f.person || event.actorId === f.person) &&
          (!f.kind || event.kind === f.kind) &&
          (!f.area || event.area === f.area) &&
          (!f.from || date >= f.from) &&
          (!f.to || date <= f.to) &&
          `${event.actorName} ${event.summary} ${event.organisation || ""} ${event.recordId || ""} ${event.changedFields?.join(" ") || ""}`
            .toLowerCase()
            .includes(f.query.toLowerCase())
        )
      })
    area = request.area || "administration"
    document = {
      id: `ispau-${request.area || "staff"}-activity`,
      title: `${request.area || "Staff"} activity log`,
      description:
        "Activity matching the selected filters. Times are in East Africa Time (Kampala).",
      landscape: true,
      sections: [
        {
          id: "activity",
          title: "Activity history",
          columns: [
            "Time (EAT)",
            "Account",
            "Area",
            "Activity",
            "Record / file",
          ],
          rows: rows.map((event) => [
            new Date(event.date).toLocaleString("en-GB", {
              timeZone: "Africa/Kampala",
            }),
            event.actorName,
            event.area,
            event.summary,
            [event.recordId, event.filename].filter(Boolean).join(" / "),
          ]),
        },
      ],
    }
  } else {
    const a = assertRecordDownload(
      state,
      actor,
      request.applicationId,
      request.kind,
    )
    recordId = a.id
    area = ["proforma", "billing-statement", "tax-invoice", "receipt"].includes(
      request.kind,
    )
      ? "finance"
      : "membership"
    if (["tax-invoice", "receipt"].includes(request.kind)) {
      const invoice = state.invoices.find(
        (i) => i.id === request.invoiceId && i.applicationId === a.id,
      )
      const metadata =
        request.kind === "tax-invoice" ? invoice?.taxInvoice : invoice?.receipt
      const file = metadata && getLocalFile(metadata.id)
      if (!file)
        throw Error(
          "The original file is unavailable in this session. Ask ISPAU for a copy or upload it again.",
        )
      assertIdentity(actor)
      triggerDownload(file, file.name)
      membershipService.recordDownload(actor, a.id, request.kind, file.name)
      staffAuditService.recordDownload(
        actor,
        area,
        request.kind === "tax-invoice"
          ? "Tax invoice (original)"
          : "Payment receipt (original)",
        file.name,
        1,
        a.id,
      )
      return
    }
    document = buildRecordDocument(
      state,
      actor,
      a.id,
      request.kind,
      request.invoiceId,
    )
  }
  const [{ renderPdf }, pdfAssets] = await Promise.all([
    import("./pdfRenderer"),
    loadAssets(),
  ])
  assertIdentity(actor)
  const bytes = renderPdf(document, actor.name, pdfAssets)
  const filename = `${document.id.replace(/[^a-zA-Z0-9-]/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`
  triggerDownload(new Blob([bytes], { type: "application/pdf" }), filename)
  if ("applicationId" in request)
    membershipService.recordDownload(
      actor,
      request.applicationId,
      request.kind,
      filename,
    )
  staffAuditService.recordDownload(
    actor,
    area,
    document.title,
    filename,
    document.sections.reduce((sum, section) => sum + section.rows.length, 0),
    recordId,
  )
}
function assertIdentity(actor: Actor) {
  const current = sessionService.getSnapshot()
  if (
    !current ||
    current.id !== actor.id ||
    current.kind !== actor.kind ||
    current.organisationId !== actor.organisationId ||
    current.roles.join() !== actor.roles.join()
  )
    throw Error("Your account changed. Please request the download again.")
}
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
