import { memberNotices } from "../src/features/trade-credit/workspace/model.ts"
import test from "node:test"
import assert from "node:assert/strict"
import { createDemoState } from "../src/mocks/membership.ts"
import {
  addCustomerRequest,
  applyCreditCommand,
  createCreditState,
  referenceResults,
  type CreditState,
  type CreditCommand,
} from "../src/features/trade-credit/workspace/model.ts"
import type { Actor } from "../src/features/membership/types/workspace.ts"
const applications = createDemoState().applications
const admin: Actor = {
  id: "admin",
  name: "ISPAU Admin",
  kind: "staff",
  roles: ["secretariat"],
}
const member = (organisationId = "org-5"): Actor => ({
  id: organisationId,
  name: "ISP demo",
  kind: "organisation",
  roles: [],
  organisationId,
})
function enrolled() {
  return applyCreditCommand(
    createCreditState(),
    member(),
    {
      type: "enrol",
      officer: "Officer",
      contact: "officer@example.test",
      accepted: true,
    },
    applications,
  )
}
const run = (s: CreditState, a: Actor, c: CreditCommand) =>
  applyCreditCommand(s, a, c, applications)
test("one ISP submission requires notice and ISPAU verification before another ISP can obtain a logged reference", () => {
  let s = enrolled()
  const id = s.records[0].id
  s = run(s, member("org-8"), {
    type: "enrol",
    officer: "Second officer",
    contact: "second@example.test",
    accepted: true,
  })
  s = run(s, member("org-8"), {
    type: "search",
    customer: s.records[0].customer,
    purpose: "Business connectivity credit decision",
    authorised: true,
  })
  assert.equal(s.searches.length, 1)
  assert.equal(referenceResults(s, member("org-8"), s.searches[0].id).length, 0)
  assert.throws(
    () =>
      run(s, member(), {
        type: "verify",
        id,
        note: "Checked",
        checks: true,
        status: "verified overdue",
      }),
    /administrator/,
  )
  assert.throws(
    () =>
      run(s, admin, {
        type: "verify",
        id,
        note: "Checked",
        checks: true,
        status: "verified overdue",
      }),
    /notice/,
  )
  s = run(s, admin, {
    type: "notice",
    id,
    text: "Fictional customer notice with correction and dispute path",
  })
  s = run(s, admin, {
    type: "verify",
    id,
    note: "Identity, due dates, evidence and acknowledgement checked",
    checks: true,
    status: "verified overdue",
  })
  s = run(s, member("org-8"), {
    type: "search",
    customer: s.records[0].customer,
    purpose: "New business contract decision",
    authorised: true,
  })
  const result = referenceResults(s, member("org-8"), s.searches[1].id)
  assert.equal(result.length, 1)
  assert.equal(result[0].status, "verified overdue")
  assert.equal("contract" in result[0], false)
  assert.throws(
    () => referenceResults(s, member(), s.searches[1].id),
    /logged reference/,
  )
  s = run(s, member(), {
    type: "update",
    id,
    history: "Payment received",
    balance: 0,
    requestedStatus: "settled",
  })
  assert.equal(s.records[0].status, "under verification")
  assert.equal(s.records[0].approved, false)
  assert.equal(referenceResults(s, member("org-8"), s.searches[1].id).length, 0)
  s = run(s, admin, {
    type: "verify",
    id,
    note: "Settlement reconciled",
    checks: true,
    status: "settled",
  })
  assert.equal(s.records[0].status, "settled")
})
test("case isolation, membership gating, enrolment and mandatory search declarations", () => {
  const s = enrolled(),
    id = s.records[0].id
  assert.throws(
    () =>
      run(s, member("org-1"), {
        type: "search",
        customer: "x",
        purpose: "x",
        authorised: true,
      }),
    /active/,
  )
  assert.throws(
    () =>
      run(s, member("org-8"), {
        type: "update",
        id,
        history: "x",
        balance: 0,
        requestedStatus: "settled",
      }),
    /officer/,
  )
  const other = run(s, member("org-8"), {
    type: "enrol",
    officer: "Other",
    contact: "other@example.test",
    accepted: true,
  })
  assert.throws(
    () =>
      run(other, member("org-8"), {
        type: "update",
        id,
        history: "x",
        balance: 0,
        requestedStatus: "settled",
      }),
    /cannot access/,
  )
  assert.throws(
    () =>
      run(s, member(), {
        type: "search",
        customer: "x",
        purpose: "",
        authorised: true,
      }),
    /purpose/,
  )
  assert.throws(
    () =>
      run(s, member(), {
        type: "search",
        customer: "x",
        purpose: "credit",
        authorised: false,
      }),
    /authority/,
  )
  assert.throws(
    () =>
      run(s, member(), {
        type: "enrol",
        officer: "x",
        contact: "x",
        accepted: false,
      }),
    /accepted/,
  )
  assert.equal(s.searches.length, 0)
})
test("contested claims need an independent conflict declaration and documented outcome", () => {
  let s = enrolled()
  const id = s.records[0].id
  s = run(s, admin, { type: "notice", id, text: "Fictional notice" })
  s = run(s, admin, {
    type: "verify",
    id,
    note: "Checks recorded",
    checks: true,
    status: "verified overdue",
  })
  s = run(s, member(), {
    type: "dispute",
    id,
    reason: "Invoice amount contested",
  })
  assert.equal(s.records[0].status, "disputed")
  assert.throws(
    () =>
      run(s, admin, {
        type: "verify",
        id,
        note: "Override",
        checks: true,
        status: "verified overdue",
      }),
    /independent/,
  )
  assert.throws(
    () =>
      run(s, admin, {
        type: "assign",
        id,
        reviewer: "ISPAU Admin",
        declaration: "No conflict",
        independent: true,
      }),
    /independent/,
  )
  assert.throws(
    () =>
      run(s, admin, {
        type: "resolve",
        id,
        outcome: "x",
        status: "verified overdue",
        confirmedIndependent: true,
      }),
    /independent/,
  )
  s = run(s, admin, {
    type: "assign",
    id,
    reviewer: "Independent reviewer (demo)",
    declaration: "No financial or organisational relationship with parties",
    independent: true,
  })
  s = run(s, admin, {
    type: "resolve",
    id,
    outcome: "Documented independent outcome: repayment arrangement agreed",
    status: "repayment arrangement",
    confirmedIndependent: true,
  })
  assert.equal(s.records[0].status, "repayment arrangement")
  assert.ok(s.records[0].activity.length >= 5)
})
test("satisfactory references stay separate; failed submissions leave no changes", () => {
  const s = enrolled()
  const next = run(s, member(), {
    type: "reference",
    customer: "Fictional business",
    summary: "Invoices paid on agreed dates",
  })
  assert.equal(next.references.length, 1)
  assert.equal(next.records.length, s.records.length)
  assert.throws(
    () =>
      run(s, member(), {
        type: "submit",
        customer: "Demo",
        contract: "C",
        invoices: "I",
        history: "H",
        balance: 100,
        currency: "USD",
        reminders: "R",
        evidence: [],
      }),
    /evidence/,
  )
  assert.equal(s.records.length, 1)
})
test("public customer requests return a receipt, never private records, and flag contested cases", () => {
  const s = createCreditState()
  const next = addCustomerRequest(s, {
    kind: "Dispute or appeal",
    recordId: s.records[0].id,
    name: "Example customer",
    contact: "customer@example.test",
    reason: "Correct the amount",
  })
  assert.equal(next.requests[0].status, "Received")
  assert.equal(next.records[0].status, "disputed")
  assert.equal("evidence" in next.requests[0], false)
  assert.equal(s.requests.length, 0)
  assert.throws(
    () =>
      addCustomerRequest(s, {
        kind: "Request my record",
        name: "",
        contact: "x",
        reason: "x",
      }),
    /required/,
  )
})

test("only reviewed case notices reach members, without customer identities or confidential terms", () => {
  let s = enrolled()
  const id = s.records[0].id
  assert.equal(memberNotices(s).length, 0)
  s = run(s, admin, { type: "notice", id, text: "Fictional customer notice" })
  s = run(s, admin, {
    type: "verify",
    id,
    note: "Evidence checks recorded",
    checks: true,
    status: "verified overdue",
  })
  assert.deepEqual(Object.keys(memberNotices(s)[0]).sort(), [
    "id",
    "status",
    "updatedAt",
  ])
  s = run(s, member(), {
    type: "update",
    id,
    history: "Payment update",
    balance: 100,
    requestedStatus: "repayment arrangement",
  })
  assert.equal(memberNotices(s).length, 0)
})
