import test from "node:test"
import assert from "node:assert/strict"
import {
  can,
  canAccessSection,
  workspaceForActor,
  type Permission,
} from "../src/config/permissions.ts"
import { createDemoState } from "../src/mocks/membership.ts"
import { applyCommand } from "../src/features/membership/services/workflow.ts"
import type {
  Actor,
  StaffRole,
} from "../src/features/membership/types/workspace.ts"

const staff = (role: StaffRole): Actor => ({
  id: role,
  name: role,
  kind: "staff",
  roles: [role],
})
const superAdmin = staff("super_admin"),
  membership = staff("membership_admin"),
  finance = staff("finance_admin")

test("one capability matrix governs sections, reports and actions for all three roles", () => {
  const permissions: Permission[] = [
    "applications.review",
    "applications.decide",
    "members.manage",
    "directory.manage",
    "billing.manage",
    "payments.confirm",
    "membership.activate",
    "renewals.manage",
    "reports.membership",
    "reports.finance",
    "administration.manage",
    "audit.global",
    "export.register",
  ]
  for (const permission of permissions)
    assert.equal(can(superAdmin, permission), true)
  for (const permission of [
    "applications.decide",
    "billing.manage",
    "payments.confirm",
    "reports.finance",
    "administration.manage",
    "audit.global",
    "export.register",
  ] as Permission[])
    assert.equal(can(membership, permission), false, permission)
  for (const permission of [
    "applications.review",
    "applications.decide",
    "members.manage",
    "directory.manage",
    "membership.activate",
    "renewals.manage",
    "reports.membership",
    "administration.manage",
    "audit.global",
    "export.register",
  ] as Permission[])
    assert.equal(can(finance, permission), false, permission)
  for (const role of [membership, finance]) {
    assert.equal(canAccessSection(role, "administration"), false)
    assert.equal(canAccessSection(role, "billing"), true)
    assert.equal(canAccessSection(role, "trade-credit"), role === membership)
  }
  assert.equal(canAccessSection(finance, "applications"), false)
  assert.equal(canAccessSection(membership, "applications"), true)
  assert.equal(canAccessSection(superAdmin, "unknown"), false)
  assert.equal(can(null, "overview.view"), false)
  assert.equal(
    can({ ...superAdmin, kind: "organisation" }, "applications.decide"),
    false,
  )
})

test("Finance snapshots exclude private application data and role changes cannot reuse it", () => {
  const state = createDemoState()
  const a = state.applications.find(
    (a) => a.stage === "Approved awaiting payment",
  )!
  a.values.representativeName = "PRIVATE REPRESENTATIVE"
  a.values.billingEmail = "billing@example.test"
  a.evidence = [
    {
      id: "private-file",
      name: "PRIVATE-EVIDENCE.pdf",
      category: "registrationEvidence",
      type: "application/pdf",
      size: 100,
    },
  ]
  a.activity.push({
    id: "private-note",
    date: a.updatedAt,
    actor: "Reviewer",
    text: "PRIVATE REVIEW NOTE",
    scope: "membership",
  })
  a.activity.push({
    id: "payment-event",
    date: a.updatedAt,
    actor: "Finance",
    text: "Payment received",
    scope: "billing",
  })
  const full = workspaceForActor(state, superAdmin)
  assert.equal(
    full.applications.find((item) => item.id === a.id)?.evidence.length,
    1,
  )
  const view = workspaceForActor(state, finance)
  const summary = view.applications.find((item) => item.id === a.id)!
  assert.deepEqual(summary.values, {
    billingEmail: "billing@example.test",
    registeredAddress: a.values.registeredAddress || "",
  })
  assert.deepEqual(summary.evidence, [])
  assert.deepEqual(summary.verifications, [])
  assert.deepEqual(summary.clarifications, [])
  assert.deepEqual(summary.decisions, [])
  assert.deepEqual(
    summary.activity.map((e) => e.id),
    ["payment-event"],
  )
  assert.equal(JSON.stringify(view).includes("PRIVATE"), false)
  assert.equal(view.notices.length, 0)
  assert.equal(
    view.applications.some((a) => a.stage === "Draft"),
    false,
  )
  assert.equal(
    workspaceForActor(state, membership).applications.find(
      (item) => item.id === a.id,
    )?.evidence.length,
    1,
  )
  assert.equal(
    workspaceForActor(state, { ...finance, roles: [] }).applications.length,
    0,
  )
})

test("workflow enforces the three roles and approval plus confirmed payment even for Super Admin", () => {
  let state = createDemoState()
  const a = state.applications.find((a) => a.stage === "Decision pending")!,
    id = a.id
  const decision = {
    type: "decide",
    id,
    outcome: "Approve",
    reason: "Reviewed admission",
    tier: "Silver",
    amount: 500,
    currency: "USD",
  } as const
  for (const actor of [membership, finance])
    assert.throws(() => applyCommand(state, actor, decision), /permission/)
  assert.throws(
    () =>
      applyCommand(state, finance, {
        type: "start-review",
        id: state.applications[0].id,
      }),
    /permission/,
  )
  state = applyCommand(state, superAdmin, decision)
  for (const actor of [membership, superAdmin])
    assert.throws(
      () => applyCommand(state, actor, { type: "activate", id }),
      /Accounts-confirmed/,
    )
  state = applyCommand(state, finance, {
    type: "payment",
    id,
    reference: "TEST-RECEIPT",
    date: "2026-11-03",
  })
  assert.equal(
    state.applications.find((a) => a.id === id)?.stage,
    "Approved awaiting payment",
  )
  assert.throws(
    () => applyCommand(state, membership, { type: "confirm-payment", id }),
    /permission/,
  )
  state = applyCommand(
    state,
    finance,
    { type: "confirm-payment", id },
    "2026-11-03T10:00:00Z",
  )
  assert.equal(
    state.invoices.find((i) => i.applicationId === id)?.confirmedAt,
    "2026-11-03T10:00:00Z",
  )
  assert.throws(
    () => applyCommand(state, finance, { type: "activate", id }),
    /permission/,
  )
  const withoutApproval = structuredClone(state)
  withoutApproval.applications.find((a) => a.id === id)!.decisions = []
  assert.throws(
    () => applyCommand(withoutApproval, superAdmin, { type: "activate", id }),
    /approved decision/,
  )
  const file = {
    id: "tax",
    name: "tax.pdf",
    category: "taxInvoice",
    type: "application/pdf",
    size: 1,
  }
  assert.throws(
    () => applyCommand(state, membership, { type: "tax-invoice", id, file }),
    /permission/,
  )
  state = applyCommand(state, finance, { type: "tax-invoice", id, file })
  state = applyCommand(state, membership, { type: "activate", id })
  const active = state.applications.find((a) => a.id === id)!
  assert.equal(active.stage, "Active")
  assert.ok(active.memberId)
  assert.throws(
    () =>
      applyCommand(state, finance, {
        type: "staff-profile",
        id,
        profile: active.profile,
      }),
    /permission/,
  )
  assert.throws(
    () =>
      applyCommand(state, finance, {
        type: "details",
        id,
        values: { representativeName: "Changed" },
      }),
    /permission/,
  )
  state = applyCommand(state, membership, {
    type: "details",
    id,
    values: { representativeName: "Authorised representative" },
  })
  assert.equal(
    state.applications.find((a) => a.id === id)?.values.representativeName,
    "Authorised representative",
  )
})
