import { useState, useSyncExternalStore } from "react"
import type { Actor } from "@/features/membership/types/workspace"
import {
  auditSessions,
  sectionLabels,
  type AuditArea,
  type AuditEvent,
} from "../services/audit"
import { staffAuditService } from "@/services/staffAuditService"
import { roleLabels } from "@/config/workspace"
import { can } from "@/config/permissions"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import EmptyState from "@/components/dashboard/EmptyState"
import Button from "@/components/ui/Button"
import PdfDownload from "@/components/dashboard/PdfDownload"

const timestamp = (date: string) =>
  new Date(date).toLocaleString("en-GB", {
    timeZone: "Africa/Kampala",
    dateStyle: "medium",
    timeStyle: "medium",
  })
const fieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    "invoice.status": "Payment status",
    "invoice.paymentReference": "Payment reference",
    "invoice.paymentDate": "Payment date",
    "invoice.receipt": "Payment receipt",
    "invoice.taxInvoice": "Tax invoice",
    "invoice.confirmedBy": "Payment confirmed by",
    "invoice.confirmedAt": "Payment confirmation time",
    values: "Organisation details",
    profile: "Public profile",
    proposedProfile: "Proposed public profile",
    verifications: "Verification checklist",
    clarifications: "Clarification requests",
    decisions: "Admission decision",
    reviewer: "Assigned reviewer",
  }
  return (
    labels[field] ||
    field
      .replace(/^invoice\./, "Invoice ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (letter) => letter.toUpperCase())
  )
}
export default function StaffActivity({
  actor,
  area,
  embedded = false,
}: {
  actor: Actor
  area?: AuditArea
  embedded?: boolean
}) {
  const events = useSyncExternalStore(staffAuditService.subscribe, () =>
    staffAuditService.snapshot(actor, area),
  )
  const [query, setQuery] = useState(""),
    [person, setPerson] = useState(""),
    [kind, setKind] = useState(""),
    [selectedArea, setArea] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("")
  const authorised = area
    ? staffAuditService.canViewArea(actor, area)
    : can(actor, "audit.global")
  if (!authorised)
    return (
      <EmptyState
        title="Access denied"
        text="Your account cannot view this activity log."
      />
    )
  const rows = events.filter(
    (event) =>
      (!person || event.actorId === person) &&
      (!kind || event.kind === kind) &&
      (!selectedArea || event.area === selectedArea) &&
      (!from ||
        new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kampala" }).format(
          new Date(event.date),
        ) >= from) &&
      (!to ||
        new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kampala" }).format(
          new Date(event.date),
        ) <= to) &&
      `${event.actorName} ${event.summary} ${event.organisation || ""} ${event.recordId || ""} ${event.changedFields?.join(" ") || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const people = [
    ...new Map(
      events.map((event) => [event.actorId, event.actorName]),
    ).entries(),
  ]
  const sessions = auditSessions(events).filter(
    (session) => !person || session.actorId === person,
  )
  const details = (event: AuditEvent) => (
    <>
      <strong>{event.summary}</strong>
      {event.filename && (
        <small>
          {event.filename} · {event.recordCount} record(s)
        </small>
      )}
      {event.organisation && (
        <small>
          {event.organisation} · {event.recordId}
        </small>
      )}
      {event.changedFields?.length ? (
        <small>Changed: {event.changedFields.map(fieldLabel).join(", ")}</small>
      ) : null}
      {event.transitions?.map((item) => (
        <small key={item.field}>
          {item.field}: {item.before} → {item.after}
        </small>
      ))}
    </>
  )
  return (
    <>
      {!embedded && (
        <PageHeader
          title={
            area
              ? `${area === "finance" ? "Finance" : "Membership"} activity`
              : "Staff activity log"
          }
          description={
            area
              ? "Changes and section visits in this work area, including actions by Super Admin."
              : "Review staff sign-ins, sign-outs, sections visited and changes across Membership and Finance."
          }
        />
      )}
      <section className="workspace-panel">
        <PdfDownload
          actor={actor}
          request={{
            kind: "audit",
            area,
            filters: { query, person, kind, area: selectedArea, from, to },
          }}
          label="Download activity PDF"
        />
        <h2>
          {embedded
            ? `${area === "finance" ? "Finance" : "Membership"} activity history`
            : "Activity history"}
        </h2>
        <p className="workspace-help">
          Times shown in East Africa Time (Kampala). Section visits refer to
          this ISPAU dashboard.
        </p>
        <label className="field">
          Search activity
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Staff, organisation, reference or change"
          />
        </label>
        <details className="workspace-filters">
          <summary>Filters · {rows.length} matching events</summary>
          <div className="workspace-filter-grid">
            <label className="field">
              Account
              <select
                value={person}
                onChange={(event) => setPerson(event.target.value)}
              >
                <option value="">All accounts</option>
                {people.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Activity type
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              >
                <option value="">All activities</option>
                {[
                  "login",
                  "logout",
                  "view",
                  "change",
                  "download",
                  "account",
                ].map((value) => (
                  <option key={value} value={value}>
                    {value === "account"
                      ? "Account management"
                      : value === "download"
                        ? "Document download"
                        : value === "view"
                          ? "Section visit"
                          : value === "change"
                            ? "Record change"
                            : value === "login"
                              ? "Sign in"
                              : "Sign out"}
                  </option>
                ))}
              </select>
            </label>
            {!area && (
              <label className="field">
                Work area
                <select
                  value={selectedArea}
                  onChange={(event) => setArea(event.target.value)}
                >
                  <option value="">All areas</option>
                  {[
                    "membership",
                    "finance",
                    "trade-credit",
                    "overview",
                    "reports",
                    "administration",
                    "session",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              From
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="field">
              To
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
            <Button
              kind="secondary"
              onClick={() => {
                setQuery("")
                setPerson("")
                setKind("")
                setArea("")
                setFrom("")
                setTo("")
              }}
            >
              Clear filters
            </Button>
          </div>
        </details>
        <DataTable
          rows={rows}
          label="Staff activity history"
          rowKey={(event) => event.id}
          columns={[
            { label: "Time (EAT)", cell: (event) => timestamp(event.date) },
            {
              label: "Account",
              cell: (event) => (
                <>
                  <strong>{event.actorName}</strong>
                  <small>
                    {event.actorKind === "organisation"
                      ? "ISP Account Manager"
                      : event.roles.map((role) => roleLabels[role]).join(" · ")}
                  </small>
                </>
              ),
              sort: (event) => event.actorName,
            },
            {
              label: "Area",
              cell: (event) =>
                event.area === "session" ? "Account session" : event.area,
              sort: (event) => event.area,
            },
            { label: "Activity", cell: details },
          ]}
        />
      </section>
      {!area && (
        <section className="workspace-panel">
          <h2>Staff login & logout history</h2>
          <p>
            Audit history is read-only. Removing administrator access does not
            remove earlier records.
          </p>
          <p>
            “No logout recorded” means the session has no recorded sign-out. It
            does not confirm that the person is still online. Closing a browser
            is not treated as a confirmed logout.
          </p>
          <DataTable
            rows={sessions}
            label="Staff sessions"
            rowKey={(session) => session.sessionId}
            columns={[
              {
                label: "Staff member",
                cell: (session) => (
                  <>
                    <strong>{session.actorName}</strong>
                    <small>
                      {session.roles
                        .map((role) => roleLabels[role])
                        .join(" · ")}
                    </small>
                  </>
                ),
                sort: (session) => session.actorName,
              },
              {
                label: "Login (EAT)",
                cell: (session) => timestamp(session.date),
              },
              {
                label: "Logout (EAT)",
                cell: (session) =>
                  session.logout ? (
                    <>
                      {timestamp(session.logout.date)}
                      <small>{session.logout.summary}</small>
                    </>
                  ) : (
                    "No logout recorded"
                  ),
              },
              {
                label: "Last recorded section",
                cell: (session) =>
                  session.lastVisit ? (
                    <>
                      {sectionLabels[session.lastVisit.section || ""] ||
                        session.lastVisit.section}
                      <small>{timestamp(session.lastVisit.date)}</small>
                    </>
                  ) : (
                    "No section recorded"
                  ),
              },
            ]}
          />
        </section>
      )}
    </>
  )
}
