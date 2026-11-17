import { tradeCreditEligibility } from "../trade-credit/services/access.ts"
export type AlertActor = {
  id: string
  kind: string
  roles: string[]
  organisationId?: string
}
type Application = {
  id: string
  organisationId: string
  organisation: string
  stage: string
  portalAccess: boolean
  periodEnd: string
  updatedAt: string
  values: Record<string, string | boolean>
  clarifications: { response?: string }[]
}
type Invoice = {
  id: string
  applicationId: string
  status: string
  periodStart: string
  periodEnd: string
  taxInvoice?: unknown
}
type Notice = {
  id: string
  applicationId: string
  template: string
  body: string
  date: string
}
export type AlertState = {
  applications: Application[]
  invoices: Invoice[]
  notices: Notice[]
}
export type WorkspaceAlert = {
  id: string
  title: string
  detail: string
  route: string
  date: string
}
export type ReviewTask = { id: string; updatedAt: string }
export function workspaceAlerts(
  actor: AlertActor,
  state: AlertState,
  reviewTasks: ReviewTask[] = [],
  today?: string,
) {
  const items: WorkspaceAlert[] = []
  const counts: Record<string, number> = {}
  const add = (item: WorkspaceAlert, section?: string) => {
    items.push(item)
    if (section) counts[section] = (counts[section] || 0) + 1
  }
  if (actor.kind === "staff") {
    const membership = actor.roles.some((role) =>
      ["super_admin", "membership_admin"].includes(role),
    )
    const finance = actor.roles.some((role) =>
      ["super_admin", "finance_admin"].includes(role),
    )
    if (membership) {
      for (const a of state.applications) {
        if (
          a.stage === "Approved awaiting payment" &&
          state.invoices.some(
            (i) => i.applicationId === a.id && i.status === "Confirmed",
          )
        )
          add(
            {
              id: `activation:${a.id}:${a.updatedAt}`,
              title: "Membership ready to activate",
              detail: a.organisation,
              route: `applications/${a.id}`,
              date: a.updatedAt,
            },
            "membership",
          )
        if (
          a.stage === "Submitted" ||
          (a.stage === "Under review" &&
            a.clarifications.some((c) => c.response))
        )
          add(
            {
              id: `application:${a.id}:${a.updatedAt}`,
              title:
                a.stage === "Submitted"
                  ? "Application ready for review"
                  : "Clarification response received",
              detail: a.organisation,
              route: `applications/${a.id}`,
              date: a.updatedAt,
            },
            "membership",
          )
        if (
          a.stage === "Decision pending" &&
          actor.roles.includes("super_admin")
        )
          add(
            {
              id: `decision:${a.id}:${a.updatedAt}`,
              title: "Admission decision needed",
              detail: a.organisation,
              route: `applications/${a.id}`,
              date: a.updatedAt,
            },
            "membership",
          )
      }
      for (const task of reviewTasks)
        add(
          {
            id: `trade-review:${task.id}:${task.updatedAt}`,
            title: "Trade Credit complaint awaiting verification",
            detail: task.id,
            route: "trade-credit",
            date: task.updatedAt,
          },
          "trade-credit",
        )
    }
    if (finance)
      for (const i of state.invoices.filter(
        (i) => i.status === "Receipt submitted",
      ))
        add(
          {
            id: `receipt:${i.id}`,
            title: "Payment receipt needs confirmation",
            detail: i.id,
            route: `billing/${i.id}`,
            date: "",
          },
          "finance",
        )
    if (finance)
      for (const i of state.invoices.filter(
        (i) => i.status === "Confirmed" && !i.taxInvoice,
      ))
        add(
          {
            id: `tax-invoice:${i.id}`,
            title: "Tax invoice needs attaching",
            detail: i.id,
            route: `billing/${i.id}`,
            date: "",
          },
          "finance",
        )
  } else if (actor.kind === "organisation") {
    const own = state.applications.filter(
      (a) => a.organisationId === actor.organisationId && a.portalAccess,
    )
    for (const a of own) {
      if (a.stage === "Clarification needed")
        add(
          {
            id: `clarification:${a.id}:${a.updatedAt}`,
            title: "Your application needs an update",
            detail: "Respond to the requested clarification.",
            route: "overview",
            date: a.updatedAt,
          },
          "application",
        )
      for (const i of state.invoices.filter(
        (i) => i.applicationId === a.id && i.status === "Awaiting payment",
      ))
        add(
          {
            id: `invoice:${i.id}`,
            title: "Invoice awaiting payment",
            detail: i.id,
            route: "invoices",
            date: "",
          },
          "invoices",
        )
      if (
        tradeCreditEligibility(a, state.invoices, today).reason ===
          "subscription" &&
        !state.invoices.some(
          (i) => i.applicationId === a.id && i.status === "Awaiting payment",
        )
      )
        add(
          {
            id: `subscription:${a.id}:${a.periodEnd}`,
            title: "Renew your subscription",
            detail:
              "Trade Credit is paused until renewal payment is confirmed.",
            route: "invoices",
            date: "",
          },
          "membership",
        )
      for (const n of state.notices.filter((n) => n.applicationId === a.id))
        add({
          id: `notice:${n.id}`,
          title: n.template,
          detail: n.body,
          route: "overview",
          date: n.date,
        })
    }
    counts.membership = (counts.membership || 0) + (counts.invoices || 0)
  }
  return { items, counts }
}
export function unreadAlerts(items: WorkspaceAlert[], readIds: string[]) {
  return items.filter((item) => !readIds.includes(item.id))
}
