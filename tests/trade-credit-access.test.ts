import test from "node:test"
import assert from "node:assert/strict"
import { createDemoState } from "../src/mocks/membership.ts"
import { tradeCreditEligibility } from "../src/features/trade-credit/services/access.ts"
import {
  workspaceAlerts,
  unreadAlerts,
} from "../src/features/notifications/model.ts"
const today = "2026-11-09"
const staff = (role: string) => ({ id: role, kind: "staff", roles: [role] })
const isp = (id = "org-5") => ({
  id: `isp-${id}`,
  kind: "organisation",
  roles: [],
  organisationId: id,
})

test("verified ISPs enrol automatically without provisioning or officer setup; explicit non-ISPs stay excluded", () => {
  const state = createDemoState()
  const a = state.applications.find((a) => a.organisationId === "org-5")!
  for (const tier of ["Platinum", "Silver", "Associate", "Affiliate"]) {
    a.confirmedTier = tier
    assert.equal(tradeCreditEligibility(a, state.invoices, today).allowed, true)
  }
  a.values.category = "Academic, research or non-profit organisation"
  assert.equal(
    tradeCreditEligibility(a, state.invoices, today).reason,
    "not-isp",
  )
  a.values.category = "Internet service provider"
  a.stage = "Under review"
  assert.equal(
    tradeCreditEligibility(a, state.invoices, today).reason,
    "verification",
  )
  a.stage = "Active"
  a.portalAccess = false
  assert.equal(
    tradeCreditEligibility(a, state.invoices, today).reason,
    "restricted",
  )
})

test("expiry pauses access, receipt submission cannot restore it, and confirmed renewal restores access", () => {
  const state = createDemoState()
  const a = state.applications.find((a) => a.organisationId === "org-5")!
  const invoice = state.invoices.find((i) => i.applicationId === a.id)!
  a.periodEnd = "2026-11-08"
  invoice.periodStart = "2026-11-09"
  invoice.periodEnd = "2027-11-08"
  invoice.status = "Awaiting payment"
  assert.equal(workspaceAlerts(isp(), state, [], today).counts.membership, 1)
  assert.equal(
    tradeCreditEligibility(a, state.invoices, today).reason,
    "subscription",
  )
  invoice.status = "Receipt submitted"
  assert.equal(tradeCreditEligibility(a, state.invoices, today).allowed, false)
  invoice.status = "Confirmed"
  assert.equal(tradeCreditEligibility(a, state.invoices, today).allowed, true)
  assert.equal(
    tradeCreditEligibility(a, state.invoices, today).validThrough,
    "2027-11-08",
  )
  assert.equal(workspaceAlerts(isp(), state, [], today).items.length, 0)
  invoice.periodStart = "2026-12-01"
  assert.equal(tradeCreditEligibility(a, state.invoices, today).allowed, false)
  a.periodEnd = today
  assert.equal(tradeCreditEligibility(a, state.invoices, today).allowed, true)
})

test("review counts and alerts go only to Super Admin and Membership Admin; Finance receives receipt actions only", () => {
  const state = createDemoState()
  const tasks = [{ id: "TC-42", updatedAt: "2026-11-09" }]
  for (const role of ["super_admin", "membership_admin"]) {
    const result = workspaceAlerts(staff(role), state, tasks, today)
    assert.equal(result.counts["trade-credit"], 1)
    assert.ok(result.items.some((item) => item.id.startsWith("trade-review:")))
  }
  const finance = workspaceAlerts(staff("finance_admin"), state, tasks, today)
  assert.equal(
    finance.items.some((item) => item.id.startsWith("trade-review:")),
    false,
  )
  assert.equal(finance.counts["trade-credit"] || 0, 0)
  const before = finance.counts.finance || 0
  state.invoices[0].status = "Receipt submitted"
  assert.equal(
    workspaceAlerts(staff("finance_admin"), state, tasks, today).counts.finance,
    before + 1,
  )
  assert.deepEqual(workspaceAlerts(staff("unknown"), state, tasks).items, [])
})

test("ISP alerts and invoice counts cannot reveal another organisation's records", () => {
  const state = createDemoState()
  const a = state.applications.find((a) => a.organisationId === "org-5")!
  state.notices = [
    {
      id: "private",
      applicationId: state.applications[0].id,
      template: "PRIVATE TITLE",
      body: "PRIVATE BODY",
      actor: "Admin",
      date: today,
    },
  ]
  state.invoices.find((i) => i.applicationId === a.id)!.status =
    "Awaiting payment"
  const result = workspaceAlerts(isp(), state, [], today)
  assert.equal(result.counts.invoices, 1)
  assert.equal(JSON.stringify(result).includes("PRIVATE"), false)
  const read = result.items.map((item) => item.id)
  assert.equal(unreadAlerts(result.items, read).length, 0)
  assert.equal(result.counts.invoices, 1)
  assert.equal(unreadAlerts([], []).length, 0)
})
