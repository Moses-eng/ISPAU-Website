import { membershipFormSchema } from "../src/features/membership/data/membershipFormSchema.ts"
import { buildRestrictedCsv } from "../src/services/workspaceExport.ts"
import { workspaceFlags } from "../src/config/workspace.ts"
import {
  acceptFile,
  getLocalFile,
} from "../src/features/membership/services/files.ts"
import test from "node:test"
import assert from "node:assert/strict"
import { createDemoState } from "../src/mocks/membership.ts"
import {
  applyCommand,
  published,
  visibleApplications,
} from "../src/features/membership/services/workflow.ts"
import { validateApplication } from "../src/features/membership/services/validation.ts"
import type {
  Actor,
  StaffRole,
} from "../src/features/membership/types/workspace.ts"
const staff = (...roles: StaffRole[]): Actor => ({
  id: "test-staff",
  name: "Test staff",
  kind: "staff",
  roles,
})
const owner = (organisationId = "org-1"): Actor => ({
  id: "test-owner",
  name: "Test organisation",
  kind: "organisation",
  roles: [],
  organisationId,
})
const checks = [
  "Organisation registration",
  "Representative authority",
  "Applicable regulatory evidence",
].map((label) => ({
  label,
  result: "Verified" as const,
  note: "Checked in this fictional test",
  reviewer: "",
  date: "",
}))
test("connected clarification, decision, payment, activation and publication workflow", () => {
  let state = createDemoState()
  const id = state.applications[0].id
  state = applyCommand(state, staff("membership"), { type: "start-review", id })
  state = applyCommand(state, staff("membership"), {
    type: "clarify",
    id,
    items: ["Correct the licence holder", "Confirm representative authority"],
  })
  assert.equal(state.applications[0].stage, "Clarification needed")
  assert.equal(state.notices[0].template, "Clarification request")
  state = applyCommand(state, owner(), {
    type: "respond",
    id,
    response: "Both corrections are now explained for the reviewer.",
  })
  state = applyCommand(state, staff("membership"), {
    type: "verify",
    id,
    results: checks,
  })
  state = applyCommand(state, staff("membership"), {
    type: "send-decision",
    id,
  })
  assert.throws(
    () =>
      applyCommand(state, staff("membership"), {
        type: "decide",
        id,
        outcome: "Approve",
        reason: "Reviewed",
        tier: "Silver",
        amount: 100,
        currency: "UGX",
      }),
    /permission/,
  )
  state = applyCommand(state, staff("decision"), {
    type: "decide",
    id,
    outcome: "Approve",
    reason: "Reviewed admission evidence",
    tier: "Silver",
    amount: 100,
    currency: "UGX",
  })
  assert.throws(
    () => applyCommand(state, staff("membership"), { type: "activate", id }),
    /Accounts-confirmed/,
  )
  state = applyCommand(state, owner(), {
    type: "payment",
    id,
    reference: "FICTIONAL-REF",
    date: "2026-10-27",
  })
  assert.equal(state.applications[0].stage, "Approved awaiting payment")
  assert.equal(
    state.invoices.find((i) => i.applicationId === id)!.status,
    "Receipt submitted",
  )
  assert.throws(
    () =>
      applyCommand(state, staff("secretariat"), {
        type: "confirm-payment",
        id,
      }),
    /permission/,
  )
  state = applyCommand(state, staff("accounts"), {
    type: "confirm-payment",
    id,
  })
  assert.throws(
    () => applyCommand(state, staff("accounts"), { type: "activate", id }),
    /permission/,
  )
  state = applyCommand(state, staff("membership"), { type: "activate", id })
  const memberId = state.applications[0].memberId
  assert.ok(memberId)
  assert.equal(state.applications[0].stage, "Active")
  assert.equal(published(state.applications[0]), false)
  state = applyCommand(state, owner(), {
    type: "profile",
    id,
    profile: { ...state.applications[0].profile, name: "Proposed public name" },
    consent: true,
  })
  assert.notEqual(state.applications[0].profile.name, "Proposed public name")
  state = applyCommand(state, staff("membership"), {
    type: "approve-profile",
    id,
    eligible: true,
  })
  assert.equal(published(state.applications[0]), true)
  state = applyCommand(state, owner(), { type: "withdraw", id })
  assert.equal(published(state.applications[0]), false)
  assert.equal(state.applications[0].stage, "Active")
  assert.equal(state.applications[0].portalAccess, true)
  state = applyCommand(state, owner(), { type: "renew", id })
  assert.equal(state.applications[0].memberId, memberId)
  assert.equal(state.applications[0].periodEnd, "2026-12-31")
  assert.ok(state.notices.some((n) => n.template === "Welcome"))
})
test("applicants cannot read or update another organisation; staff cannot read drafts", () => {
  const state = createDemoState()
  assert.equal(visibleApplications(state, owner()).length, 1)
  assert.ok(
    !visibleApplications(state, staff("membership")).some(
      (a) => a.stage === "Draft",
    ),
  )
  assert.throws(
    () =>
      applyCommand(state, owner("org-2"), {
        type: "save-draft",
        id: state.applications[6].id,
        values: {},
        evidence: [],
      }),
    /organisation/,
  )
  assert.throws(
    () =>
      applyCommand(state, staff("secretariat"), {
        type: "start-review",
        id: state.applications[6].id,
      }),
    /permission/,
  )
})
test("incomplete verification, missing decision reasons and invalid submissions are blocked atomically", () => {
  let state = createDemoState()
  const id = state.applications[0].id
  state = applyCommand(state, staff("membership"), { type: "start-review", id })
  assert.throws(
    () =>
      applyCommand(state, staff("membership"), { type: "send-decision", id }),
    /Complete verification/,
  )
  const pending = state.applications[2].id
  assert.throws(
    () =>
      applyCommand(state, staff("decision"), {
        type: "decide",
        id: pending,
        outcome: "Decline",
        reason: "",
        tier: "",
      }),
    /reason/,
  )
  assert.equal(state.applications[2].stage, "Decision pending")
  const draft = state.applications[6]
  assert.equal(draft.consent, false)
  assert.equal(draft.values.promotionalConsent, false)
  assert.throws(
    () =>
      applyCommand(state, owner(draft.organisationId), {
        type: "submit",
        id: draft.id,
        values: { legalName: "Incomplete", accuracyDeclaration: true },
        evidence: [],
      }),
    /required/,
  )
  const errors = validateApplication(
    {
      licenceRelevant: "No — not applicable to activities",
      pdpoStatus: "Not applicable",
      licenceEntries: "3",
    },
    [],
  )
  assert.ok(errors.licenceExplanation)
  assert.ok(errors.pdpoExplanation)
  assert.ok(errors.registrationEvidence)
  assert.ok(
    validateApplication(
      { licenceRelevant: "Yes", licenceEntries: "3", licenceStatus3: "Valid" },
      [],
    ).licenceNumber3,
  )
})
test("publication always requires all four conditions; membership remains separate", () => {
  const a = createDemoState().applications[4]
  assert.equal(published(a), true)
  for (const patch of [
    { consent: false },
    { eligible: false },
    { profileApproved: false },
    { stage: "Approved awaiting payment" as const },
  ])
    assert.equal(published({ ...a, ...patch }), false)
  const state = createDemoState()
  assert.throws(
    () =>
      applyCommand(state, owner("org-5"), {
        type: "confirm-payment",
        id: a.id,
      }),
    /permission/,
  )
})

test("multi-role staff can decide but do not inherit Accounts permissions", () => {
  const state = createDemoState(),
    id = state.applications[2].id,
    lead = staff("membership", "decision")
  const next = applyCommand(state, lead, {
    type: "decide",
    id,
    outcome: "Approve",
    reason: "Reviewed fictional evidence",
    tier: "Silver",
    amount: 1,
    currency: "UGX",
  })
  assert.equal(next.applications[2].stage, "Approved awaiting payment")
  assert.throws(
    () => applyCommand(next, lead, { type: "confirm-payment", id }),
    /permission/,
  )
  assert.throws(
    () =>
      applyCommand(next, staff("decision"), {
        type: "decide",
        id,
        outcome: "Approve",
        reason: "Duplicate",
        tier: "Silver",
        amount: 1,
        currency: "UGX",
      }),
    /current application stage/,
  )
})
test("a clarification is consolidated and cannot leave unreachable open requests", () => {
  let state = createDemoState()
  const id = state.applications[0].id
  state = applyCommand(state, staff("membership"), { type: "start-review", id })
  state = applyCommand(state, staff("membership"), {
    type: "clarify",
    id,
    items: ["First correction", "Second correction"],
  })
  assert.throws(
    () =>
      applyCommand(state, staff("membership"), {
        type: "clarify",
        id,
        items: ["Another request"],
      }),
    /already exists/,
  )
  state = applyCommand(state, owner(), {
    type: "respond",
    id,
    response: "Both corrections addressed",
  })
  assert.equal(
    state.applications[0].clarifications.filter((c) => !c.response).length,
    0,
  )
})

test("private uploads reject unsupported/oversized files and retain only metadata in workflow records", () => {
  assert.throws(
    () =>
      acceptFile(
        new File(["html"], "test.html", { type: "text/html" }),
        "registrationEvidence",
      ),
    /PDF/,
  )
  assert.throws(
    () =>
      acceptFile(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf", {
          type: "application/pdf",
        }),
        "registrationEvidence",
      ),
    /10 MB/,
  )
  const record = acceptFile(
    new File(["PRIVATE-FILE-BODY"], "fictional.pdf", {
      type: "application/pdf",
    }),
    "registrationEvidence",
  )
  assert.ok(getLocalFile(record.id))
  assert.equal(JSON.stringify(record).includes("PRIVATE-FILE-BODY"), false)
})
test("exports are role restricted and Trade Credit demo is centrally enabled", () => {
  const state = createDemoState()
  assert.equal(workspaceFlags.tradeCreditEnabled, true)
  assert.equal(workspaceFlags.publicTradeCreditEnabled, false)
  assert.throws(
    () => buildRestrictedCsv(state, staff("accounts")),
    /restricted/,
  )
  const csv = buildRestrictedCsv(state, staff("secretariat"))
  assert.ok(csv.includes("Reference"))
  assert.equal(csv.includes(state.applications[6].id), false)
  assert.equal(csv.includes("representative@"), false)
})

test("a complete scoped draft submits with optional consent off and public fields still unapproved", () => {
  const state = createDemoState(),
    draft = state.applications[6]
  const values: Record<string, string | boolean> = Object.fromEntries(
    membershipFormSchema
      .filter((field) => field.required === true)
      .map((field) => [
        field.name,
        field.name.endsWith("Declaration") ||
        field.name === "authorityConfirmed"
          ? true
          : field.name.toLowerCase().includes("email")
            ? "fictional@example.test"
            : "Demonstration answer",
      ]),
  )
  Object.assign(values, {
    legalName: "Fictional new network",
    requestedTier: "Silver — USD 500",
    licenceRelevant: "No — not applicable to activities",
    licenceExplanation:
      "Fictional research organisation without a licensable activity",
    pdpoStatus: "Not applicable",
    pdpoExplanation: "Explanation for staff verification",
    customerFacing: "No",
    hasRestrictions: "No",
    directoryConsent: false,
    promotionalConsent: false,
    publicName: "Fictional public brand",
    publicDescription: "Public-only description",
  })
  const evidence = ["registrationEvidence", "authorityEvidence"].map(
    (category, i) => ({
      id: `file-${i}`,
      category,
      name: "fictional.pdf",
      size: 100,
      type: "application/pdf",
    }),
  )
  assert.deepEqual(validateApplication(values, evidence), {})
  const next = applyCommand(state, owner(draft.organisationId), {
    type: "submit",
    id: draft.id,
    values,
    evidence,
  })
  const submitted = next.applications[6]
  assert.equal(submitted.stage, "Submitted")
  assert.equal(submitted.requestedTier, "Silver")
  assert.equal(submitted.profile.name, "Fictional public brand")
  assert.equal(submitted.profileApproved, false)
  assert.equal(published(submitted), false)
  assert.equal(submitted.consent, false)
  assert.ok(
    visibleApplications(next, staff("membership")).some(
      (a) => a.id === draft.id,
    ),
  )
})
