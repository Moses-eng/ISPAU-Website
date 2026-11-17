// src/services/sessionService.ts
import type { Actor, StaffRole } from "@/features/membership/types/workspace"
import systemUserAuthStore, { type StoredSystemUser } from "@/apiServices/systemUserAuthStore"
import { staffAuditService } from "./staffAuditService"

function userToActor(user: StoredSystemUser | null): Actor | null {
  if (!user) return null
  return {
    id: user.id,
    name: user.name || user.full_name || "Administrator",
    kind: "staff",
    roles: [user.role as StaffRole],
  }
}

let actor: Actor | null = userToActor(systemUserAuthStore.getUser())
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

// Automatically sync when systemUserAuthStore changes
if (typeof window !== "undefined") {
  window.addEventListener(systemUserAuthStore.AUTH_EVENT, () => {
    actor = userToActor(systemUserAuthStore.getUser())
    if (actor) {
      staffAuditService.start(actor)
    } else {
      staffAuditService.end()
    }
    notify()
  })
}

export const sessionService = {
  getSnapshot: () => actor,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  acceptAuthenticatedStaff: (identity: Actor) => {
    if (identity.kind !== "staff") throw Error("A staff identity is required.")
    actor = { ...identity, roles: [...identity.roles] }
    staffAuditService.start(actor)
    notify()
  },
  signOut: () => {
    staffAuditService.end()
    actor = null
    systemUserAuthStore.clear()
    notify()
  },
}
