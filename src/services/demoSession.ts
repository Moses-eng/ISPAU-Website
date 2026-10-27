import type { Actor } from "@/features/membership/types/workspace"
let actor: Actor | null = null
const listeners = new Set<() => void>()
export const demoSession = {
  getSnapshot: () => actor,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  signIn: (identity: Actor) => {
    actor = identity
    listeners.forEach((listener) => listener())
  },
  signOut: () => {
    actor = null
    listeners.forEach((listener) => listener())
  },
}
