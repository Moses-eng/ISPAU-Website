import type {
  Actor,
  Command,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import {
  changeEvent,
  sessionEvent,
  visitEvent,
  visibleAudit,
  downloadEvent,
  type AuditArea,
  type AuditEvent,
} from "@/features/staff/services/audit"
import { can } from "@/config/permissions"

const key = "ispau-staff-audit-v1"
function load(): AuditEvent[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(saved)
      ? saved.filter(
          (event) =>
            event &&
            typeof event.id === "string" &&
            typeof event.date === "string" &&
            Array.isArray(event.roles) &&
            [
              "login",
              "logout",
              "view",
              "change",
              "download",
              "account",
            ].includes(event.kind),
        )
      : []
  } catch {
    return []
  }
}
let events = load()
let current: { actor: Actor; id: string; route?: string } | null = null
const listeners = new Set<() => void>()
const snapshots = new Map<
  string,
  { events: AuditEvent[]; view: AuditEvent[] }
>()
const notify = () => listeners.forEach((listener) => listener())
function append(event: AuditEvent) {
  // Merge other preview tabs before appending; production requires server-side writes.
  const combined = new Map(
    [...load(), ...events, event].map((item) => [item.id, item]),
  )
  events = [...combined.values()].sort((a, b) => b.date.localeCompare(a.date))
  try {
    localStorage.setItem(key, JSON.stringify(events))
  } catch {
    /* Keep the preview usable in memory. */
  }
  notify()
}
window.addEventListener("storage", (event) => {
  if (event.key === key) {
    events = load()
    notify()
  }
})
export const staffAuditService = {
  recordAccount: (actor: Actor, summary: string, accountId: string) => {
    append({
      ...sessionEvent(
        actor,
        current?.actor.id === actor.id
          ? current.id
          : `account-${crypto.randomUUID()}`,
        "login",
        new Date().toISOString(),
      ),
      kind: "account",
      area: "administration",
      summary,
      recordId: accountId,
    })
  },
  snapshot: (actor: Actor, area?: AuditArea) => {
    const identity = `${actor.kind}:${actor.id}:${actor.roles.join(",")}:${area || "all"}`
    const cached = snapshots.get(identity)
    if (cached?.events === events) return cached.view
    const view = visibleAudit(events, actor, area)
    snapshots.set(identity, { events, view })
    return view
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  start: (actor: Actor) => {
    staffAuditService.end("Workspace account changed")
    if (actor.kind !== "staff") return
    current = {
      actor: { ...actor, roles: [...actor.roles] },
      id: crypto.randomUUID(),
    }
    append(
      sessionEvent(
        current.actor,
        current.id,
        "login",
        new Date().toISOString(),
      ),
    )
  },
  end: (reason = "Explicit sign out") => {
    if (!current) return
    append(
      sessionEvent(
        current.actor,
        current.id,
        "logout",
        new Date().toISOString(),
        reason,
      ),
    )
    current = null
  },
  visit: (actor: Actor, route: string) => {
    if (!current || current.actor.id !== actor.id || current.route === route)
      return
    const event = visitEvent(actor, current.id, route, new Date().toISOString())
    if (!event) return
    current.route = route
    append(event)
  },
  recordChange: (
    previous: WorkspaceState,
    next: WorkspaceState,
    actor: Actor,
    command: Command,
  ) => {
    const event = changeEvent(
      previous,
      next,
      actor,
      command,
      current?.actor.id === actor.id
        ? current.id
        : `operation-${crypto.randomUUID()}`,
    )
    if (event) append(event)
  },
  recordDownload: (
    actor: Actor,
    area: AuditArea,
    title: string,
    filename: string,
    count: number,
    recordId?: string,
  ) => {
    append(
      downloadEvent(
        actor,
        current?.actor.id === actor.id
          ? current.id
          : `download-${crypto.randomUUID()}`,
        area,
        title,
        filename,
        count,
        new Date().toISOString(),
        recordId,
      ),
    )
  },
  canViewArea: (actor: Actor, area: AuditArea) =>
    area === "membership"
      ? can(actor, "applications.review")
      : area === "finance"
        ? can(actor, "billing.manage")
        : can(actor, "audit.global"),
}
