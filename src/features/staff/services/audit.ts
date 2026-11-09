import type {
  Actor,
  Command,
  StaffRole,
  WorkspaceState,
} from "../../membership/types/workspace.ts"
import { can, canAccessSection } from "../../../config/permissions.ts"

export type AuditArea =
  | "trade-credit"
  | "membership"
  | "finance"
  | "overview"
  | "reports"
  | "administration"
  | "session"
export type AuditEvent = {
  id: string
  sessionId: string
  actorId: string
  actorName: string
  roles: StaffRole[]
  date: string
  kind: "login" | "logout" | "view" | "change" | "download" | "account"
  actorKind?: Actor["kind"]
  organisationId?: string
  filename?: string
  recordCount?: number
  area: AuditArea
  summary: string
  section?: string
  recordId?: string
  organisation?: string
  changedFields?: string[]
  transitions?: { field: string; before: string; after: string }[]
}

export const sectionLabels: Record<string, string> = {
  "trade-credit": "Trade Credit",
  overview: "Overview",
  membership: "Membership",
  finance: "Finance",
  applications: "Applications",
  members: "Members",
  billing: "Billing",
  communications: "Email templates",
  reports: "Reports",
  administration: "Administration",
  "staff-activity": "Staff activity",
  "membership-activity": "Membership activity",
  "finance-activity": "Finance activity",
}
function auditArea(section: string): AuditArea {
  if (section === "trade-credit") return "trade-credit"
  if (["billing", "finance", "finance-activity"].includes(section))
    return "finance"
  if (
    [
      "membership",
      "applications",
      "members",
      "communications",
      "membership-activity",
    ].includes(section)
  )
    return "membership"
  if (section === "reports") return "reports"
  if (["administration", "staff-activity"].includes(section))
    return "administration"
  return "overview"
}

export function visibleAudit(
  events: AuditEvent[],
  actor: Actor,
  area?: AuditArea,
): AuditEvent[] {
  if (actor.kind !== "staff") return []
  if (!area && !can(actor, "audit.global")) return []
  if (area === "membership" && !can(actor, "applications.review")) return []
  if (area === "finance" && !can(actor, "billing.manage")) return []
  if (area === "trade-credit" && !can(actor, "trade-credit.review")) return []
  if (
    area &&
    !["membership", "finance", "trade-credit"].includes(area) &&
    !can(actor, "audit.global")
  )
    return []
  return events.filter((event) => !area || event.area === area)
}

export function sessionEvent(
  actor: Actor,
  sessionId: string,
  kind: "login" | "logout",
  date: string,
  reason?: string,
): AuditEvent {
  return {
    id: crypto.randomUUID(),
    sessionId,
    actorId: actor.id,
    actorName: actor.name,
    actorKind: actor.kind,
    roles: [...actor.roles],
    date,
    kind,
    area: "session",
    summary:
      kind === "login"
        ? "Signed in"
        : `Signed out${reason ? ` · ${reason}` : ""}`,
  }
}

export function downloadEvent(
  actor: Actor,
  sessionId: string,
  area: AuditArea,
  title: string,
  filename: string,
  recordCount: number,
  date: string,
  recordId?: string,
): AuditEvent {
  return {
    ...sessionEvent(actor, sessionId, "login", date),
    kind: "download",
    area,
    organisationId: actor.organisationId,
    summary: `Download requested: ${title}`,
    filename,
    recordCount,
    recordId,
  }
}

export function visitEvent(
  actor: Actor,
  sessionId: string,
  route: string,
  date: string,
): AuditEvent | null {
  const [section, recordId] = route.split("/")
  if (!canAccessSection(actor, section)) return null
  return {
    ...sessionEvent(actor, sessionId, "login", date),
    kind: "view",
    area: auditArea(section),
    section,
    recordId,
    summary: `Opened ${sectionLabels[section] || section}${recordId ? ` · ${recordId}` : ""}`,
  }
}

export function changeEvent(
  previous: WorkspaceState,
  next: WorkspaceState,
  actor: Actor,
  command: Command,
  sessionId: string,
): AuditEvent | null {
  if (actor.kind !== "staff") return null
  const before = previous.applications.find((a) => a.id === command.id)!
  const after = next.applications.find((a) => a.id === command.id)!
  const activity = after.activity[0]
  const oldInvoice = previous.invoices.find(
    (i) => i.applicationId === command.id,
  )
  const newInvoice = next.invoices.find((i) => i.applicationId === command.id)
  const transitions = [
    { field: "Application stage", before: before.stage, after: after.stage },
    {
      field: "Payment status",
      before: oldInvoice?.status || "Not invoiced",
      after: newInvoice?.status || "Not invoiced",
    },
    {
      field: "Confirmed tier",
      before: before.confirmedTier || "Not confirmed",
      after: after.confirmedTier || "Not confirmed",
    },
  ].filter((item) => item.before !== item.after)
  const changedFields = Object.keys(after).filter(
    (key) =>
      JSON.stringify(before[key as keyof typeof before]) !==
        JSON.stringify(after[key as keyof typeof after]) &&
      !["activity", "updatedAt"].includes(key),
  )
  if (command.type === "details")
    changedFields.push(
      ...Object.keys(command.values).filter(
        (key) => before.values[key] !== after.values[key],
      ),
    )
  if (command.type === "staff-profile")
    changedFields.push(
      ...Object.keys(command.profile).filter(
        (key) =>
          before.profile[key as keyof typeof before.profile] !==
          after.profile[key as keyof typeof after.profile],
      ),
    )
  if (oldInvoice || newInvoice)
    changedFields.push(
      ...Object.keys(newInvoice || {})
        .filter(
          (key) =>
            JSON.stringify(oldInvoice?.[key as keyof typeof oldInvoice]) !==
            JSON.stringify(newInvoice?.[key as keyof typeof newInvoice]),
        )
        .map((key) => `invoice.${key}`),
    )
  return {
    ...sessionEvent(actor, sessionId, "login", activity.date),
    kind: "change",
    area: activity.scope === "billing" ? "finance" : "membership",
    recordId: after.id,
    organisation: after.organisation,
    summary: activity.text,
    changedFields,
    transitions,
  }
}

export function auditSessions(events: AuditEvent[]) {
  return events
    .filter((event) => event.kind === "login")
    .map((login) => {
      const related = events
        .filter((event) => event.sessionId === login.sessionId)
        .sort((a, b) => b.date.localeCompare(a.date))
      return {
        ...login,
        logout: related.find((event) => event.kind === "logout"),
        lastVisit: related.find((event) => event.kind === "view"),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}
