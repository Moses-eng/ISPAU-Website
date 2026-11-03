import { workspaceForActor } from "@/config/permissions"
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
    const next = applyCommand(state, actor, command)
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
