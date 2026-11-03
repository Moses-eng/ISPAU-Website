import type { Actor } from "@/features/membership/types/workspace"
import { staffAuditService } from "./staffAuditService"
let actor: Actor | null = null
const listeners = new Set<() => void>()
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
    listeners.forEach((listener) => listener())
  },
  signOut: () => {
    staffAuditService.end()
    actor = null
    listeners.forEach((listener) => listener())
  },
}
