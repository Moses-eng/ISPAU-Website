import { tradeCreditEligibility } from "../trade-credit-error/services/access.ts"
import statisticsService, {
  type InvoiceStatistics,
} from "@/apiServices/statisticsService"
import systemUserAuthStore from "@/apiServices/systemUserAuthStore"

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
  active?: boolean
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

export const BADGES_UPDATED_EVENT = "ispau:badges:updated"

// In-memory cache for live backend statistics
let cachedBadges: InvoiceStatistics = {
  finance: 0,
  applicants: 0,
  other: 0,
}

/**
 * Fetch badge statistics from the server and update the in-memory cache.
 */
export async function fetchBadgeCounts(financeId?: string): Promise<InvoiceStatistics> {
  try {
    const res = await statisticsService.statisticsBadges(financeId)
    if (res.success && res.data) {
      cachedBadges = {
        finance: Number(res.data.finance) || 0,
        applicants: Number(res.data.applicants) || 0,
        other: Number(res.data.other) || 0,
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(BADGES_UPDATED_EVENT, { detail: cachedBadges }),
        )
      }
    }
  } catch (err) {
    console.error("Failed to load badge statistics:", err)
  }

  return cachedBadges
}

/**
 * Get the current cached badge counts.
 */
export function getBadgeCounts(): InvoiceStatistics {
  return cachedBadges
}

// Initial fetch & listener for login/logout auth changes
if (typeof window !== "undefined") {
  if (systemUserAuthStore.isAuthenticated()) {
    void fetchBadgeCounts()
  }

  window.addEventListener(systemUserAuthStore.AUTH_EVENT, () => {
    if (systemUserAuthStore.isAuthenticated()) {
      void fetchBadgeCounts()
    } else {
      cachedBadges = { finance: 0, applicants: 0, other: 0 }
    }
  })
}

export function workspaceAlerts(
  actor: AlertActor,
  state: AlertState,
  reviewTasks: ReviewTask[] = [],
  today?: string,
  overrideStats?: InvoiceStatistics | null,
) {
  const items: WorkspaceAlert[] = []
  const counts: Record<string, number> = {}

  const add = (item: WorkspaceAlert, section?: string) => {
    items.push(item)
    if (section) counts[section] = (counts[section] || 0) + 1
  }

  if (actor.kind === "staff") {
    const membership = actor.roles.some((role) =>
      ["super_admin", "membership_admin", "operations_officer"].includes(role),
    )
    const finance = actor.roles.some((role) =>
      ["super_admin", "finance_admin"].includes(role),
    )
    const operationsOnly =
      actor.roles.includes("operations_officer") &&
      !actor.roles.some((r) => ["super_admin", "membership_admin"].includes(r))

    if (membership) {
      for (const a of state.applications) {
        if (
          !operationsOnly &&
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
      for (const task of operationsOnly ? [] : reviewTasks)
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

    if (finance) {
      for (const i of state.invoices.filter(
        (i) => i.active !== false && i.status === "Receipt submitted",
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
    }

    // Apply backend statisticsBadges to sidebar & topbar section badges
    const stats = overrideStats || cachedBadges
    if (stats) {
      counts.finance = stats.finance ?? 0
      counts.billing = stats.finance ?? 0
      counts.invoices = stats.finance ?? 0

      counts.membership = stats.applicants ?? 0
      counts.applications = stats.applicants ?? 0
      counts.applicants = stats.applicants ?? 0

      counts.other = stats.other ?? 0
      counts["trade-credit"] = stats.other ?? 0
    }
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
