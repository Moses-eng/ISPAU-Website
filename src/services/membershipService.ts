import { can, workspaceForActor, type Permission } from "@/config/permissions"
import { staffAuditService } from "./staffAuditService"
import {
  recordDocumentDownload,
  type RecordDocumentKind,
} from "@/features/membership/services/reports"
import { createDemoState, refreshExampleRecords } from "@/mocks/membership"
import {
  applyCommand,
  visibleApplications,
} from "@/features/membership/services/workflow"
import type {
  Actor,
  Command,
  WorkspaceState,
} from "@/features/membership/types/workspace"
const key = "ispau-workspace-demo-v2"
function load(): WorkspaceState {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null")
    if (
      saved?.version === 1 &&
      Array.isArray(saved.applications) &&
      Array.isArray(saved.invoices)
    )
      return refreshExampleRecords(saved)
  } catch {
    /* Use fictional seed data when storage is unavailable. */
  }
  return createDemoState()
}
let state = load()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())
window.addEventListener("storage", (event) => {
  if (event.key === key) {
    state = load()
    notify()
  }
})
let cachedState: WorkspaceState | undefined
let cachedActor: Actor | null | undefined
let cachedView: WorkspaceState
type FinanceCommand = Extract<
  Command,
  { type: "issue-invoice" | "payment" | "confirm-payment" }
>

function applyLocalFinance(
  previous: WorkspaceState,
  actor: Actor,
  command: FinanceCommand,
): WorkspaceState {
  const state = structuredClone(previous)
  const a = state.applications.find(
    (application) => application.id === command.id,
  )
  if (!a) throw Error("This application is not in the local Finance workspace.")
  const date = new Date().toISOString()
  const staff = (permission: Permission) => {
    if (!can(actor, permission) || a.stage === "Draft")
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
      throw Error("An approved application is required.")
  }
  const reason = (value: string) => {
    if (!value.trim()) throw Error("Enter the payment reference.")
  }
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const parsed = new Date(value)
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    )
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
  const activateMembership = () => {
    a.stage = "Active"
    a.memberId ??= `DEMO-ISPAU-${String(state.nextMemberNumber++).padStart(4, "0")}`
    notice(
      "Welcome",
      `Welcome ${a.organisation}. Your member ID is ${a.memberId}.`,
    )
  }
  let text: string
  switch (command.type) {
    case "issue-invoice":
      staff("billing.manage")
      expect("Approved awaiting payment", "Active")
      if (invoice)
        throw Error("An invoice already exists for this application.")
      if (
        !Number.isFinite(command.amount) ||
        command.amount <= 0 ||
        !["UGX", "USD"].includes(command.currency)
      )
        throw Error("Enter a positive amount and select the currency.")
      if (
        ![command.periodStart, command.periodEnd].every(validDate) ||
        command.periodEnd < command.periodStart
      )
        throw Error("Enter a valid membership period.")
      if (
        command.file.type !== "application/pdf" ||
        !/\.pdf$/i.test(command.file.name) ||
        command.file.size <= 0 ||
        command.file.size > 10 * 1024 * 1024
      )
        throw Error("Choose an invoice PDF up to 10 MB.")
      state.invoices.push({
        id: "INV-" + a.id,
        applicationId: a.id,
        amount: command.amount,
        currency: command.currency,
        periodStart: command.periodStart,
        periodEnd: command.periodEnd,
        status: "Awaiting payment",
        active: command.active,
        issuedBy: actor.name,
        invoicePdf: command.file,
      })
      text = "Membership invoice issued"
      break
    case "payment":
      if (actor.kind === "staff") staff("billing.manage")
      else owner()
      if (
        !invoice ||
        invoice.active === false ||
        invoice.status === "Confirmed"
      )
        throw Error("No unpaid invoice is available.")
      reason(command.reference)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(command.date))
        throw Error("Enter the payment date.")
      {
        const payments = (invoice.payments ??= [])
        const pending = payments.find(
          (payment) => payment.active && !payment.confirmedAt,
        )
        if (pending && actor.kind !== "staff")
          throw Error("A payment is already awaiting review.")
        const confirmed = payments
          .filter((payment) => payment.active && payment.confirmedAt)
          .reduce(
            (total, payment) => total + Math.round(payment.amount * 100),
            0,
          )
        const amount =
          command.amount ?? (Math.round(invoice.amount * 100) - confirmed) / 100
        if (
          !Number.isFinite(amount) ||
          Math.round(amount * 100) <= 0 ||
          Math.round(amount * 100) + confirmed >
            Math.round(invoice.amount * 100)
        )
          throw Error("Enter an amount within the outstanding balance.")
        if (pending && command.active === false)
          throw Error("The payment awaiting review must remain active.")
        const payment = {
          id: pending?.id ?? invoice.id + "-PAY-" + (payments.length + 1),
          amount,
          reference: command.reference.trim(),
          paidAt: command.date,
          createdBy: pending?.createdBy ?? actor.name,
          active: command.active ?? true,
        }
        if (pending) payments[payments.indexOf(pending)] = payment
        else payments.push(payment)
        if (!payment.active) {
          text = "Inactive payment recorded"
          break
        }
      }
      invoice.paymentReference = command.reference.trim()
      invoice.paymentDate = command.date
      invoice.receipt = command.receipt ?? invoice.receipt
      invoice.status = "Receipt submitted"
      text = "Payment details recorded; Accounts confirmation required"
      break
    case "confirm-payment": {
      staff("payments.confirm")
      if (
        !invoice ||
        invoice.active === false ||
        !invoice.paymentReference ||
        !invoice.paymentDate ||
        invoice.status !== "Receipt submitted"
      )
        throw Error("Record payment details before confirming receipt.")
      const payments = (invoice.payments ??= [
        {
          id: invoice.id + "-PAY-1",
          amount: invoice.amount,
          reference: invoice.paymentReference,
          paidAt: invoice.paymentDate,
          createdBy: "Legacy payment record",
          active: true,
        },
      ])
      const payment = payments.find((item) => item.active && !item.confirmedAt)
      if (!payment) throw Error("No payment is awaiting confirmation.")
      payment.confirmedAt = date
      payment.confirmedBy = actor.name
      const total = payments
        .filter((item) => item.active && item.confirmedAt)
        .reduce((sum, item) => sum + Math.round(item.amount * 100), 0)
      if (total < Math.round(invoice.amount * 100)) {
        invoice.status = "Awaiting payment"
        text = "Partial payment confirmed"
        break
      }
      invoice.status = "Confirmed"
      invoice.subscription = {
        paymentId: payment.id,
        paymentConfirmedAt: date,
        startsAt: invoice.periodStart,
        expiresAt: invoice.periodEnd,
      }
      invoice.confirmedBy = actor.name
      invoice.confirmedAt = date
      if (
        a.stage === "Approved awaiting payment" &&
        a.decisions.some((decision) => decision.outcome === "Approve")
      ) {
        a.periodStart = invoice.periodStart
        a.periodEnd = invoice.periodEnd
        activateMembership()
        text = "Payment confirmed; membership activated"
      } else text = "Accounts confirmed payment received"
      break
    }
  }
  a.updatedAt = date
  a.activity.unshift({
    id: crypto.randomUUID(),
    actor: actor.name,
    date,
    text,
    scope: "billing",
  })
  return state
}

export const membershipService = {
  recordDownload: (
    actor: Actor,
    id: string,
    kind: RecordDocumentKind,
    filename: string,
  ) => {
    const next = recordDocumentDownload(state, actor, id, kind, filename)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      /* Retain local activity in memory. */
    }
    state = next
    notify()
  },
  workspaceSnapshot: (actor: Actor | null) => {
    if (cachedState !== state || cachedActor !== actor) {
      cachedView = workspaceForActor(state, actor)
      cachedState = state
      cachedActor = actor
    }
    return cachedView
  },
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  applications: (actor: Actor) => visibleApplications(state, actor),
  dispatch: (actor: Actor, command: Command) => {
    const next =
      command.type === "issue-invoice" ||
      command.type === "payment" ||
      command.type === "confirm-payment"
        ? applyLocalFinance(state, actor, command)
        : applyCommand(state, actor, command)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      /* Keep the demonstration usable in memory if local storage is unavailable. */
    }
    staffAuditService.recordChange(state, next, actor, command)
    state = next
    notify()
  },
  reset: () => {
    state = createDemoState()
    localStorage.setItem(key, JSON.stringify(state))
    notify()
  },
}
