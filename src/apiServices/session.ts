// src/apiServices/session.ts
import { useSyncExternalStore } from "react"
import authStore, { type StoredUser } from "@/apiServices/authStore"
import type { Actor } from "@/features/membership/types/workspace"

/**
 * Derive the workspace Actor from the persisted authStore session.
 * Returns null when there is no token or no user.
 */
function actorFromStore(): Actor | null {
  if (!authStore.isAuthenticated()) return null
  const user: StoredUser | null = authStore.getUser()
  if (!user) return null

  // Only organisation (applicant/member) actors are supported here.
  // Staff identity should come from a separate store/endpoint.
  return {
    id: `portal-${user.id}`,
    name: user.name || "Organisation",
    kind: "organisation",
    roles: [],
    organisationId: user.id,
  }
}

let cached: Actor | null = actorFromStore()
const listeners = new Set<() => void>()

function emit() {
  cached = actorFromStore()
  listeners.forEach((l) => l())
}

export const session = {
  getSnapshot: () => cached,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    // Recompute on subscribe in case storage changed while unmounted.
    const next = actorFromStore()
    if (next !== cached) {
      cached = next
      listener()
    }
    return () => {
      listeners.delete(listener)
    }
  },
  /** Re-read from authStore (call after OTP verify / sign in). */
  refresh: () => emit(),
  signIn: (user: StoredUser, token: string) => {
    authStore.setSession({ token, user })
    emit()
  },
  signOut: () => {
    authStore.clear()
    emit()
  },
}

export function useSession() {
  return useSyncExternalStore(session.subscribe, session.getSnapshot)
}
