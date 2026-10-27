import { useSyncExternalStore } from "react"
import { membershipService } from "@/services/membershipService"
import type { Actor } from "@/features/membership/types/workspace"
import {
  addCustomerRequest,
  applyCreditCommand,
  createCreditState,
  type CreditCommand,
  type CreditState,
} from "./model"
let state = createCreditState()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())
export const creditService = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  dispatch: (actor: Actor, command: CreditCommand) => {
    state = applyCreditCommand(
      state,
      actor,
      command,
      membershipService.getSnapshot().applications,
    )
    notify()
  },
  request: (
    request: Omit<CreditState["requests"][number], "id" | "status">,
  ) => {
    state = addCustomerRequest(state, request)
    notify()
    return state.requests.at(-1)!.id
  },
}
export default function useCreditWorkspace() {
  return useSyncExternalStore(
    creditService.subscribe,
    creditService.getSnapshot,
  )
}
