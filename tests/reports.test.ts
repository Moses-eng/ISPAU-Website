import test from "node:test"
import assert from "node:assert/strict"
import {
  buildStaffReport,
  buildRecordDocument,
  recordDocumentDownload,
  assertRecordDownload,
} from "../src/features/membership/services/reports.ts"
import { demoStaff } from "../src/config/workspace.ts"
import { createDemoState } from "../src/mocks/membership.ts"
import {
  downloadEvent,
  visibleAudit,
} from "../src/features/staff/services/audit.ts"
import type { Actor } from "../src/features/membership/types/workspace.ts"
const [superAdmin, membership, finance] = demoStaff
test("report tables and PDF contents share exact counts and enforce report permissions", () => {
  const state = createDemoState(),
    report = buildStaffReport(state, superAdmin)
  const stages = report.sections.find((section) => section.id === "stages")!
  assert.equal(
    stages.rows.reduce((sum, row) => sum + Number(row[1]), 0),
    state.applications.filter((a) => a.stage !== "Draft").length,
  )
  assert.deepEqual(
    buildStaffReport(state, finance).sections.map((section) => section.id),
    ["finance"],
  )
  assert.equal(
    buildStaffReport(state, membership).sections.some(
      (section) => section.id === "finance",
    ),
    false,
  )
  assert.throws(
    () => buildStaffReport(state, finance, "stages"),
    /not available/,
  )
  assert.throws(
    () => buildStaffReport(state, membership, "finance"),
    /not available/,
  )
  const financial = JSON.stringify(buildStaffReport(state, finance))
  assert.equal(financial.includes("representative@"), false)
  assert.equal(financial.includes("registration-certificate.pdf"), false)
})
test("ISP document downloads are organisation-scoped and cannot masquerade as tax invoices", () => {
  const state = createDemoState(),
    a = state.applications.find((a) => a.stage === "Active")!
  const actor: Actor = {
    id: "member",
    name: a.organisation,
    kind: "organisation",
    roles: [],
    organisationId: a.organisationId,
  }
  const summary = buildRecordDocument(state, actor, a.id, "membership-summary")
  assert.equal(
    summary.sections[0].rows.find((row) => row[0] === "Member ID")?.[1],
    a.memberId,
  )
  assert.throws(
    () =>
      buildRecordDocument(
        state,
        actor,
        state.applications[0].id,
        "application-summary",
      ),
    /permission/,
  )
  assert.throws(() => buildStaffReport(state, actor), /cannot download/)
  assert.throws(
    () => buildRecordDocument(state, finance, a.id, "application-summary"),
    /permission/,
  )
  assert.throws(
    () =>
      buildRecordDocument(state, membership, a.id, "proforma", "other-invoice"),
    /permission/,
  )
  const invoice = state.invoices.find((i) => i.applicationId === a.id)!
  const proforma = buildRecordDocument(
    state,
    actor,
    a.id,
    "proforma",
    invoice.id,
  )
  assert.match(proforma.title, /Non-tax proforma/)
  assert.match(proforma.sections[1].note!, /not a tax invoice/)
  assert.throws(
    () => buildRecordDocument(state, actor, a.id, "proforma", "other-invoice"),
    /not found/,
  )
  assert.throws(
    () => buildRecordDocument(state, actor, a.id, "tax-invoice"),
    /original files/,
  )
  assert.throws(
    () =>
      assertRecordDownload(
        state,
        finance,
        state.applications[6].id,
        "billing-statement",
      ),
    /permission/,
  )
})
test("document activity records actor, time and filename without changing membership or payment status", () => {
  const state = createDemoState(),
    a = state.applications.find((a) => a.stage === "Active")!
  const actor: Actor = {
    id: "owner",
    name: a.organisation,
    kind: "organisation",
    roles: [],
    organisationId: a.organisationId,
  }
  const next = recordDocumentDownload(
    state,
    actor,
    a.id,
    "membership-summary",
    "membership.pdf",
    "2026-11-03T08:00:00Z",
  )
  const updated = next.applications.find((item) => item.id === a.id)!
  assert.equal(updated.updatedAt, a.updatedAt)
  assert.equal(updated.stage, a.stage)
  assert.deepEqual(next.invoices, state.invoices)
  assert.equal(updated.activity[0].actor, actor.name)
  assert.equal(updated.activity[0].date, "2026-11-03T08:00:00Z")
  assert.match(updated.activity[0].text, /membership.pdf/)
  const event = downloadEvent(
    finance,
    "session",
    "finance",
    "Invoice report",
    "invoices.pdf",
    3,
    "2026-11-03T08:00:00Z",
  )
  assert.equal(event.kind, "download")
  assert.equal(event.filename, "invoices.pdf")
  assert.equal(event.recordCount, 3)
  assert.equal(visibleAudit([event], superAdmin).length, 1)
  assert.equal(visibleAudit([event], finance, "finance").length, 1)
  assert.equal(visibleAudit([event], membership, "membership").length, 0)
})
