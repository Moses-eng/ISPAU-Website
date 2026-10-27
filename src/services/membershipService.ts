import { createDemoState, refreshExampleRecords } from "@/mocks/membership"
import {
  applyCommand,
  published,
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
export const membershipService = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  applications: (actor: Actor) => visibleApplications(state, actor),
  publicProfiles: () =>
    state.applications.filter(published).map((a) => ({
      id: a.memberId!,
      name: a.profile.name,
      description: a.profile.description,
      services: a.profile.services,
      coverage: a.profile.coverage,
      website: a.profile.website,
      contact: a.profile.contact,
      logo: a.profile.logo,
    })),
  dispatch: (actor: Actor, command: Command) => {
    const next = applyCommand(state, actor, command)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      /* Keep the demonstration usable in memory if local storage is unavailable. */
    }
    state = next
    notify()
  },
  reset: () => {
    state = createDemoState()
    localStorage.setItem(key, JSON.stringify(state))
    notify()
  },
}
