import test from "node:test"
import assert from "node:assert/strict"
import { createDemoState } from "../src/mocks/membership.ts"
import {
  applyCommand,
  published,
} from "../src/features/membership/services/workflow.ts"
import {
  canParticipate,
  applyCreditCommand,
  createCreditState,
} from "../src/features/trade-credit/workspace/model.ts"
import {
  demoMemberOrganisationId,
  demoStaff,
  memberNavigation,
  staffNavigation,
  memberGroup,
  staffGroup,
} from "../src/config/workspace.ts"
import type { Actor } from "../src/features/membership/types/workspace.ts"
const admin = demoStaff[0]
const owner: Actor = {
  id: "member",
  name: "ISP",
  kind: "organisation",
  organisationId: demoMemberOrganisationId,
  roles: [],
}
test("all member tiers share ISP authority without acquiring ISPAU powers", () => {
  const state = createDemoState(),
    a = state.applications.find(
      (a) => a.organisationId === demoMemberOrganisationId,
    )!
  for (const tier of ["Platinum", "Silver", "Associate", "Affiliate"]) {
    a.confirmedTier = tier
    assert.equal(canParticipate(owner, state.applications), true)
    assert.throws(
      () =>
        applyCreditCommand(
          createCreditState(),
          owner,
          { type: "notice", id: "TC-DEMO-001", text: "x" },
          state.applications,
        ),
      /administrator/,
    )
  }
})
test("ISPAU provisioning is explicit, scoped and reversible without altering membership or directory", () => {
  let state = createDemoState()
  const a = state.applications.find(
      (a) => a.organisationId === demoMemberOrganisationId,
    )!,
    id = a.id
  a.tradeCreditAccess = undefined
  assert.equal(canParticipate(owner, state.applications), false)
  assert.throws(
    () =>
      applyCommand(state, owner, {
        type: "trade-access",
        id,
        enabled: true,
        reason: "Enable",
      }),
    /permission/,
  )
  const before = published(a)
  state = applyCommand(state, admin, {
    type: "trade-access",
    id,
    enabled: true,
    reason: "Accountable organisation verified; initiation approved",
  })
  assert.equal(canParticipate(owner, state.applications), true)
  assert.equal(
    state.applications.find((a) => a.id === id)!.tradeCreditAccess!.actor,
    "ISPAU Admin",
  )
  state = applyCommand(state, admin, {
    type: "trade-access",
    id,
    enabled: false,
    reason: "Participation temporarily restricted",
  })
  const after = state.applications.find((a) => a.id === id)!
  assert.equal(canParticipate(owner, state.applications), false)
  assert.equal(after.stage, "Active")
  assert.equal(published(after), before)
  assert.equal(after.portalAccess, true)
  assert.equal(
    state.applications.find((a) => a.organisationId === "org-8")!
      .tradeCreditAccess!.enabled,
    true,
  )
  assert.throws(
    () =>
      applyCreditCommand(
        createCreditState(),
        owner,
        {
          type: "enrol",
          officer: "Officer",
          contact: "office@example.test",
          accepted: true,
        },
        state.applications,
      ),
    /active/,
  )
})
test("staff cannot provision unapproved applicants and a missing reason never changes access", () => {
  const state = createDemoState()
  assert.throws(
    () =>
      applyCommand(state, admin, {
        type: "trade-access",
        id: state.applications[0].id,
        enabled: true,
        reason: "Grant",
      }),
    /stage/,
  )
  const a = state.applications.find(
    (a) => a.organisationId === demoMemberOrganisationId,
  )!
  assert.throws(
    () =>
      applyCommand(state, admin, {
        type: "trade-access",
        id: a.id,
        enabled: false,
        reason: "",
      }),
    /reason/,
  )
  assert.equal(a.tradeCreditAccess!.enabled, true)
})
test("simple primary navigation groups legacy routes without discarding functionality", () => {
  assert.equal(demoStaff.length, 1)
  assert.deepEqual(
    memberNavigation.map((n) => n.id),
    ["overview", "company", "membership", "trade-credit", "account"],
  )
  assert.equal(staffNavigation.length, 5)
  for (const route of ["organisation", "representatives", "profile"])
    assert.equal(memberGroup(route), "company")
  for (const route of ["invoices", "renewal"])
    assert.equal(memberGroup(route), "membership")
  for (const route of ["applications", "members", "billing"])
    assert.equal(staffGroup(route), "membership")
  assert.equal(staffGroup("communications"), "administration")
})
