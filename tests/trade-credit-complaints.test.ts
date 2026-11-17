import test from "node:test"
import assert from "node:assert/strict"
import {
  submitComplaint,
  visibleComplaints,
  reviewComplaint,
  requestReference,
  type ComplaintStore,
  type CreditActor,
  type Review,
} from "../src/features/trade-credit/services/complaints.ts"
const isp: CreditActor = {
  id: "isp",
  name: "Reporting ISP",
  kind: "organisation",
  roles: [],
  organisationId: "org-a",
}
const other: CreditActor = { ...isp, id: "other", organisationId: "org-b" }
const admin: CreditActor = {
  id: "admin",
  name: "Membership Admin",
  kind: "staff",
  roles: ["membership_admin"],
}
const input = {
  customer: "Example Customer Ltd",
  contract: "Private contract",
  invoices: "INV-01 due 2026-10-01",
  history: "Unpaid invoice",
  balance: 100,
  currency: "UGX",
  reminders: "Customer contacted",
  evidence: [
    {
      id: "file",
      name: "invoice.pdf",
      size: 40,
      type: "application/pdf",
      category: "trade-credit",
    },
  ],
}
const make = () => {
  const store: ComplaintStore = { records: [], searches: [] }
  const record = submitComplaint(store, isp, true, input)
  return { store, record }
}
const review = (date: string): Review => ({
  outcome: "Approved",
  note: "Evidence and payment position checked",
  identity: true,
  invoices: true,
  balance: true,
  notice: true,
  expectedUpdatedAt: date,
})
test("pending complaint is private to its reporting ISP and authorised reviewers", () => {
  const { store, record } = make()
  assert.equal(record.approved, false)
  assert.equal(visibleComplaints(store, isp, true).length, 1)
  assert.deepEqual(visibleComplaints(store, other, true), [])
  assert.equal(visibleComplaints(store, admin, false).length, 1)
  assert.throws(() =>
    visibleComplaints(store, { ...admin, roles: ["finance_admin"] }, false),
  )
  assert.throws(() => visibleComplaints(store, isp, false))
})
test("pending and no-match reference requests are logged without disclosure", () => {
  const { store } = make()
  const response = requestReference(store, other, true, {
    customer: input.customer,
    purpose: "New service credit decision",
    authorised: true,
  })
  assert.deepEqual(response.results, [])
  assert.equal(store.searches.length, 1)
  assert.equal(store.searches[0].organisationId, "org-b")
})
test("approval unlocks only scoped fields through an authorised reference", () => {
  const { store, record } = make()
  reviewComplaint(store, admin, record.id, review(record.updatedAt))
  assert.deepEqual(visibleComplaints(store, other, true), [])
  const result = requestReference(store, other, true, {
    customer: "  EXAMPLE CUSTOMER LTD  ",
    purpose: "Credit assessment",
    authorised: true,
  }).results[0]
  assert.deepEqual(
    Object.keys(result).sort(),
    ["id", "customer", "status", "balance", "currency", "updatedAt"].sort(),
  )
  assert.equal(result.status, "verified overdue")
  assert.equal(JSON.stringify(result).includes("Private contract"), false)
})
test("Finance and ISP accounts cannot approve; approval requires every check", () => {
  const { store, record } = make()
  for (const actor of [isp, { ...admin, roles: ["finance_admin"] }])
    assert.throws(() =>
      reviewComplaint(store, actor, record.id, review(record.updatedAt)),
    )
  for (const key of ["identity", "invoices", "balance", "notice"] as const)
    assert.throws(() =>
      reviewComplaint(store, admin, record.id, {
        ...review(record.updatedAt),
        [key]: false,
      }),
    )
  assert.equal(record.approved, false)
})
test("clarification and decline remain private and record findings", () => {
  for (const outcome of ["Clarification needed", "Declined"] as const) {
    const { store, record } = make()
    reviewComplaint(store, admin, record.id, {
      ...review(record.updatedAt),
      outcome,
      identity: false,
    })
    assert.equal(record.approved, false)
    assert.equal(record.reviewOutcome, outcome)
    assert.equal(record.activity.length, 2)
    assert.equal(
      requestReference(store, other, true, {
        customer: input.customer,
        purpose: "Credit assessment",
        authorised: true,
      }).results.length,
      0,
    )
  }
})
test("stale or repeated approval cannot overwrite a review", () => {
  const { store, record } = make()
  assert.throws(() => reviewComplaint(store, admin, record.id, review("stale")))
  reviewComplaint(
    store,
    { ...admin, roles: ["super_admin"] },
    record.id,
    review(record.updatedAt),
  )
  assert.throws(() =>
    reviewComplaint(store, admin, record.id, review(record.updatedAt)),
  )
})
test("expired members, missing evidence, invalid balances and unauthorised queries are rejected", () => {
  const { store } = make()
  assert.throws(() => submitComplaint(store, isp, false, input))
  assert.throws(() =>
    submitComplaint(store, isp, true, { ...input, evidence: [] }),
  )
  assert.throws(() =>
    submitComplaint(store, isp, true, { ...input, balance: 0 }),
  )
  assert.throws(() =>
    requestReference(store, other, false, {
      customer: input.customer,
      purpose: "Credit",
      authorised: true,
    }),
  )
  assert.throws(() =>
    requestReference(store, other, true, {
      customer: input.customer,
      purpose: "",
      authorised: true,
    }),
  )
  assert.throws(() =>
    requestReference(store, other, true, {
      customer: input.customer,
      purpose: "Credit",
      authorised: false,
    }),
  )
})
test("disputed claims cannot be approved as confirmed defaults", () => {
  const { store, record } = make()
  record.status = "disputed"
  assert.throws(() =>
    reviewComplaint(store, admin, record.id, review(record.updatedAt)),
  )
  assert.equal(record.approved, false)
})
