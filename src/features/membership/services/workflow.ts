import { validateApplication } from "./validation.ts"
import type {
  Actor,
  Application,
  Command,
  WorkspaceState,
} from "../types/workspace.ts"
export function published(application: Application) {
  return (
    application.stage === "Active" &&
    application.eligible &&
    application.profileApproved &&
    application.consent
  )
}
export function visibleApplications(state: WorkspaceState, actor: Actor) {
  return actor.kind === "staff"
    ? state.applications.filter((a) => a.stage !== "Draft")
    : state.applications.filter(
        (a) => a.organisationId === actor.organisationId && a.portalAccess,
      )
}
export function applyCommand(
  previous: WorkspaceState,
  actor: Actor,
  command: Command,
  date = new Date().toISOString(),
): WorkspaceState {
  const state = structuredClone(previous)
  const a = state.applications.find((item) => item.id === command.id)
  if (!a) throw Error("Application not found.")
  const staff = (...roles: string[]) => {
    if (
      actor.kind !== "staff" ||
      !actor.roles.some((role) => roles.includes(role)) ||
      a.stage === "Draft"
    )
      throw Error("You do not have permission for this action.")
  }
  const owner = () => {
    if (
      actor.kind !== "organisation" ||
      actor.organisationId !== a.organisationId ||
      !a.portalAccess
    )
      throw Error("This record is not available to your organisation.")
  }
  const expect = (...stages: string[]) => {
    if (!stages.includes(a.stage))
      throw Error(
        "This action is not available at the current application stage.",
      )
  }
  const reason = (value: string) => {
    if (!value.trim()) throw Error("A reason or explanation is required.")
  }
  const invoice = state.invoices.find((item) => item.applicationId === a.id)
  const notice = (template: string, body: string) =>
    state.notices.push({
      id: `notice-${state.notices.length + 1}-${date}`,
      applicationId: a.id,
      template,
      body,
      actor: actor.name,
      date,
    })
  let text: string = command.type
  switch (command.type) {
    case "trade-access":
      staff("secretariat")
      expect("Active")
      reason(command.reason)
      if (command.enabled && (!a.portalAccess || a.standing !== "Current"))
        throw Error(
          "Resolve membership standing and portal access before provisioning Trade Credit.",
        )
      a.tradeCreditAccess = {
        enabled: command.enabled,
        actor: actor.name,
        date,
        reason: command.reason,
      }
      text = `Trade Credit account ${command.enabled ? "provisioned" : "restricted"} by ISPAU: ${command.reason}`
      break
    case "start-review":
      staff("membership")
      expect("Submitted")
      a.stage = "Under review"
      a.reviewer = actor.name
      text = "Review started"
      break
    case "reviewer":
      staff("membership", "secretariat")
      reason(command.reviewer)
      a.reviewer = command.reviewer
      text = "Reviewer assignment updated"
      break
    case "verify":
      staff("membership")
      expect("Under review", "Clarification needed")
      if (
        !command.results.length ||
        command.results.some(
          (v) =>
            !v.note.trim() ||
            !["Verified", "Clarification needed", "Not applicable"].includes(
              v.result,
            ),
        )
      )
        throw Error("Record a result and note for each verification.")
      a.verifications = command.results.map((v) => ({
        ...v,
        reviewer: actor.name,
        date,
      }))
      text = "Verification results recorded"
      break
    case "clarify":
      staff("membership")
      if (a.clarifications.some((item) => !item.response))
        throw Error(
          "An open clarification request already exists. Await the consolidated response before issuing another.",
        )
      staff("membership")
      expect("Under review", "Clarification needed")
      if (!command.items.length || command.items.some((item) => !item.trim()))
        throw Error("Add at least one correction.")
      a.clarifications.push({
        id: `clar-${a.clarifications.length + 1}`,
        items: command.items,
        requestedBy: actor.name,
        date,
      })
      a.stage = "Clarification needed"
      notice("Clarification request", command.items.join("\n"))
      text = "Clarification request recorded; notification prepared"
      break
    case "respond":
      owner()
      expect("Clarification needed")
      reason(command.response)
      {
        const request = [...a.clarifications].reverse().find((c) => !c.response)
        if (!request) throw Error("There is no open clarification request.")
        request.response = command.response
        request.respondedAt = date
      }
      a.stage = "Under review"
      text = "Clarification response received"
      break
    case "send-decision":
      staff("membership")
      expect("Under review")
      if (
        ![
          "Organisation registration",
          "Representative authority",
          "Applicable regulatory evidence",
        ].every((label) => a.verifications.some((v) => v.label === label)) ||
        a.verifications.some((v) => v.result === "Clarification needed") ||
        a.clarifications.some((c) => !c.response)
      )
        throw Error(
          "Complete verification and resolve all clarification requests first.",
        )
      a.stage = "Decision pending"
      text = "Application sent for decision"
      break
    case "decide":
      staff("decision")
      expect("Decision pending")
      reason(command.reason)
      if (command.outcome === "Approve") {
        if (
          !command.tier ||
          !command.amount ||
          command.amount <= 0 ||
          !Number.isFinite(command.amount) ||
          !command.currency?.trim()
        )
          throw Error("Confirm the final tier, positive fee and currency.")
        a.stage = "Approved awaiting payment"
        a.confirmedTier = command.tier
        state.invoices.push({
          id: `PF-DEMO-${a.id}`,
          applicationId: a.id,
          amount: command.amount,
          currency: command.currency,
          periodStart: a.periodStart,
          periodEnd: a.periodEnd,
          status: "Awaiting payment",
        })
      } else a.stage = command.outcome === "Defer" ? "Deferred" : "Declined"
      a.decisions.push({
        outcome: command.outcome,
        reason: command.reason,
        tier: command.tier,
        actor: actor.name,
        date,
      })
      notice("Admission decision", `${command.outcome}: ${command.reason}`)
      text = `Decision recorded: ${command.outcome}`
      break
    case "payment":
      if (actor.kind === "staff") staff("accounts")
      else owner()
      if (!invoice || invoice.status === "Confirmed")
        throw Error("No unpaid invoice is available.")
      reason(command.reference)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(command.date))
        throw Error("Enter the payment date.")
      invoice.paymentReference = command.reference
      invoice.paymentDate = command.date
      invoice.receipt = command.receipt
      invoice.status = "Receipt submitted"
      text = "Payment details recorded; Accounts confirmation required"
      break
    case "confirm-payment":
      staff("accounts")
      if (
        !invoice ||
        !invoice.paymentReference ||
        !invoice.paymentDate ||
        invoice.status !== "Receipt submitted"
      )
        throw Error("Record payment details before confirming receipt.")
      invoice.status = "Confirmed"
      invoice.confirmedBy = actor.name
      text = "Accounts confirmed payment received"
      break
    case "tax-invoice":
      staff("secretariat")
      if (!invoice || invoice.status !== "Confirmed")
        throw Error(
          "Payment must be confirmed before attaching the tax invoice.",
        )
      invoice.taxInvoice = command.file
      text = "Tax invoice attached"
      break
    case "activate":
      staff("membership")
      expect("Approved awaiting payment")
      if (
        !invoice ||
        invoice.status !== "Confirmed" ||
        !a.decisions.some((d) => d.outcome === "Approve")
      )
        throw Error(
          "An approved decision and Accounts-confirmed payment are required.",
        )
      a.stage = "Active"
      a.memberId ??= `DEMO-ISPAU-${String(state.nextMemberNumber++).padStart(4, "0")}`
      notice(
        "Welcome",
        `Welcome ${a.organisation}. Your member ID is ${a.memberId}.`,
      )
      text = "Membership activated; welcome notice prepared"
      break
    case "profile":
      owner()
      expect("Active")
      if (!command.profile.name.trim() || !command.profile.description.trim())
        throw Error("Public name and description are required.")
      a.proposedProfile = command.profile
      a.consent = command.consent
      text = "Proposed public profile saved for staff review"
      break
    case "staff-profile":
      staff("membership", "secretariat")
      expect("Active")
      if (!command.profile.name.trim() || !command.profile.description.trim())
        throw Error("Public name and description are required.")
      a.profile = command.profile
      delete a.proposedProfile
      a.profileApproved = true
      text = "Approved public fields corrected by staff"
      break
    case "approve-profile":
      staff("membership", "secretariat")
      expect("Active")
      if (a.proposedProfile) a.profile = a.proposedProfile
      delete a.proposedProfile
      a.profileApproved = true
      a.eligible = command.eligible
      text = "Public profile reviewed; publication conditions evaluated"
      break
    case "withdraw":
      owner()
      a.consent = false
      text = "Publication permission withdrawn"
      break
    case "details":
      owner()
      expect("Active")
      a.values = { ...a.values, ...command.values }
      a.organisation = String(a.values.legalName || a.organisation)
      text = "Organisation details updated"
      break
    case "renew":
      owner()
      expect("Active")
      a.renewalConfirmedAt = date
      text = "Renewal details confirmed; no new period or payment created"
      break
    case "save-draft":
      owner()
      expect("Draft")
      a.values = command.values
      a.organisation = String(command.values.legalName || a.organisation)
      a.requestedTier = String(
        command.values.requestedTier || a.requestedTier,
      ).split(" — ")[0]
      a.evidence = command.evidence
      text = "Application draft saved"
      break
    case "submit":
      owner()
      expect("Draft")
      if (
        Object.keys(validateApplication(command.values, command.evidence))
          .length
      )
        throw Error(
          "Complete all required application fields, declarations and evidence.",
        )
      if (
        !command.values.legalName ||
        !command.values.accuracyDeclaration ||
        !command.evidence.some((e) => e.category === "registrationEvidence") ||
        !command.evidence.some((e) => e.category === "authorityEvidence")
      )
        throw Error(
          "Complete the required answers, declarations and evidence before submitting.",
        )
      a.values = command.values
      a.organisation = String(command.values.legalName)
      a.requestedTier = String(
        command.values.requestedTier || a.requestedTier,
      ).split(" — ")[0]
      a.profile = {
        name: String(command.values.publicName || a.organisation),
        description: String(command.values.publicDescription || ""),
        services: String(command.values.publicServices || ""),
        coverage: String(command.values.publicCoverage || ""),
        website: String(command.values.publicWebsite || ""),
        contact: String(command.values.publicContact || ""),
        logo: String(command.values.publicLogoReference || ""),
      }
      a.profileApproved = false
      a.consent = command.values.directoryConsent === true
      a.evidence = command.evidence
      a.stage = "Submitted"
      a.submittedAt = date
      notice("Application acknowledgement", `Application ${a.id} received.`)
      text = "Application recorded; acknowledgement prepared"
      break
    case "send-notice":
      staff("membership", "secretariat")
      reason(command.body)
      notice(command.template, command.body)
      text = `${command.template} prepared; delivery pending`
      break
  }
  a.updatedAt = date
  a.activity.unshift({
    id: `event-${a.activity.length}-${date}`,
    date,
    actor: actor.name,
    text,
  })
  return state
}
