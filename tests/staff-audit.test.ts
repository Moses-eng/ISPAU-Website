import test from "node:test"
import assert from "node:assert/strict"
import {
  auditSessions,
  changeEvent,
  sessionEvent,
  visibleAudit,
  visitEvent,
} from "../src/features/staff/services/audit.ts"
import { canAccessSection } from "../src/config/permissions.ts"
import { demoStaff, staffNavigation } from "../src/config/workspace.ts"
import { createDemoState } from "../src/mocks/membership.ts"
import { applyCommand } from "../src/features/membership/services/workflow.ts"

const [superAdmin, membership, finance] = demoStaff
const date = "2026-11-03T08:00:00.000Z"

test("staff sessions record identity, role, login, logout and last visited section", () => {
  const login = sessionEvent(membership, "session-1", "login", date)
  const visit = visitEvent(
    membership,
    "session-1",
    "applications/APP-2026-0101",
    "2026-11-03T08:05:00.000Z",
  )!
  const logout = sessionEvent(
    membership,
    "session-1",
    "logout",
    "2026-11-03T09:00:00.000Z",
    "Workspace account changed",
  )
  const events = [logout, visit, login]
  const [session] = auditSessions(events)
  assert.equal(session.actorId, membership.id)
  assert.deepEqual(session.roles, ["membership_admin"])
  assert.equal(session.date, date)
  assert.equal(session.logout?.date, "2026-11-03T09:00:00.000Z")
  assert.equal(session.lastVisit?.section, "applications")
  assert.equal(session.lastVisit?.recordId, "APP-2026-0101")
  assert.match(session.logout!.summary, /account changed/)
  assert.equal(auditSessions([login, visit])[0].logout, undefined)
  assert.equal(
    visitEvent(finance, "session-2", "applications/private-id", date),
    null,
  )
  assert.equal(visitEvent(finance, "session-2", "staff-activity", date), null)
})

test("Super Admin sees both work areas and the global log; other roles only their authorised logs", () => {
  for (const section of [
    "membership",
    "finance",
    "staff-activity",
    "membership-activity",
    "finance-activity",
  ])
    assert.equal(canAccessSection(superAdmin, section), true)
  assert.ok(staffNavigation.some((item) => item.id === "finance"))
  assert.ok(staffNavigation.some((item) => item.id === "membership"))
  assert.equal(canAccessSection(finance, "membership"), false)
  assert.equal(canAccessSection(membership, "staff-activity"), false)
  assert.equal(canAccessSection(finance, "staff-activity"), false)
  const events = [
    sessionEvent(finance, "finance-session", "login", date),
    visitEvent(membership, "membership-session", "applications", date)!,
    visitEvent(superAdmin, "super-session", "billing", date)!,
  ]
  assert.equal(visibleAudit(events, superAdmin).length, 3)
  assert.equal(visibleAudit(events, finance).length, 0)
  assert.equal(visibleAudit(events, membership).length, 0)
  assert.equal(visibleAudit(events, finance, "membership").length, 0)
  assert.equal(visibleAudit(events, membership, "finance").length, 0)
  assert.deepEqual(
    visibleAudit(events, finance, "finance").map((event) => event.actorId),
    [superAdmin.id],
  )
  assert.deepEqual(
    visibleAudit(events, membership, "membership").map(
      (event) => event.actorId,
    ),
    [membership.id],
  )
  assert.equal(
    visibleAudit(events, { ...finance, kind: "organisation" }, "finance")
      .length,
    0,
  )
})

test("Super Admin finance changes appear in Finance history with actor, time and safe field changes", () => {
  const previous = createDemoState()
  const id = previous.applications.find(
    (a) => a.stage === "Approved awaiting payment",
  )!.id
  const command = {
    type: "payment",
    id,
    reference: "PRIVATE-PAYMENT-REFERENCE",
    date: "2026-11-03",
  } as const
  const next = applyCommand(previous, superAdmin, command, date)
  const event = changeEvent(
    previous,
    next,
    superAdmin,
    command,
    "super-session",
  )!
  assert.equal(event.area, "finance")
  assert.equal(event.actorId, superAdmin.id)
  assert.equal(event.actorName, superAdmin.name)
  assert.equal(event.date, date)
  assert.equal(event.recordId, id)
  assert.ok(event.changedFields?.includes("invoice.paymentReference"))
  assert.ok(
    event.transitions?.some(
      (item) =>
        item.field === "Payment status" &&
        item.before === "Awaiting payment" &&
        item.after === "Receipt submitted",
    ),
  )
  assert.equal(
    JSON.stringify(event).includes("PRIVATE-PAYMENT-REFERENCE"),
    false,
  )
  assert.equal(visibleAudit([event], finance, "finance").length, 1)
  assert.equal(visibleAudit([event], membership, "membership").length, 0)
  assert.equal(
    previous.invoices.find((i) => i.applicationId === id)?.status,
    "Awaiting payment",
  )
})

test("Membership changes are logged without copying private answers or document contents", () => {
  const previous = createDemoState()
  const id = previous.applications.find((a) => a.stage === "Active")!.id
  const command = {
    type: "details",
    id,
    values: { representativeName: "PRIVATE-PERSON" },
  } as const
  const next = applyCommand(previous, membership, command, date)
  const event = changeEvent(
    previous,
    next,
    membership,
    command,
    "member-session",
  )!
  assert.equal(event.area, "membership")
  assert.ok(event.changedFields?.includes("representativeName"))
  assert.equal(JSON.stringify(event).includes("PRIVATE-PERSON"), false)
  assert.equal(visibleAudit([event], superAdmin).length, 1)
  assert.equal(visibleAudit([event], finance, "finance").length, 0)
  const owner = {
    ...membership,
    kind: "organisation" as const,
    roles: [],
    organisationId: previous.applications.find((a) => a.id === id)!
      .organisationId,
  }
  assert.equal(
    changeEvent(previous, next, owner, command, "owner-session"),
    null,
  )
})
