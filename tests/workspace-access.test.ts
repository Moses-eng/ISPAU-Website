import test from "node:test"
import assert from "node:assert/strict"
import { createDemoState } from "../src/mocks/membership.ts"
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
test("verified ISPs can use Trade Credit without a manual provisioning flag or enrolment gate", () => {
  const state = createDemoState()
  const a = state.applications.find(
    (a) => a.organisationId === demoMemberOrganisationId,
  )!
  a.tradeCreditAccess = undefined
  assert.equal(
    canParticipate(owner, state.applications, state.invoices, "2026-11-09"),
    true,
  )
  const result = applyCreditCommand(
    createCreditState(),
    owner,
    {
      type: "search",
      customer: "Example",
      purpose: "Credit decision",
      authorised: true,
    },
    state.applications,
    "2026-11-09T10:00:00Z",
    state.invoices,
  )
  assert.equal(result.searches.length, 1)
  a.periodEnd = "2026-11-08"
  for (const invoice of state.invoices)
    if (invoice.applicationId === a.id) invoice.periodEnd = "2026-11-08"
  assert.equal(
    canParticipate(owner, state.applications, state.invoices, "2026-11-09"),
    false,
  )
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
