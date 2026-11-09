import { useSyncExternalStore } from "react"
import { membershipService } from "@/services/membershipService"
import type { Actor } from "@/features/membership/types/workspace"
import {
  complaintRequest,
  type ComplaintSnapshot,
} from "../services/complaintApi"
import { getLocalFile } from "@/features/membership/services/files"
import { canParticipate } from "./model"
import {
  addCustomerRequest,
  applyCreditCommand,
  createCreditState,
  type CreditCommand,
  type CreditState,
} from "./model"
let state = createCreditState()
state.records = []
let notices: ComplaintSnapshot["notices"] = []
let remoteError = ""
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())
export const creditService = {
  getNotices: () => notices,
  getError: () => remoteError,
  refresh: async (actor: Actor) => {
    const membership = membershipService.getSnapshot()
    const eligible = canParticipate(
      actor,
      membership.applications,
      membership.invoices,
    )
    if (!eligible) {
      state = { ...state, records: [] }
      notices = []
      notify()
      return
    }
    try {
      const snapshot = await complaintRequest<ComplaintSnapshot>(
        actor,
        eligible,
        "/complaints",
      )
      state = {
        ...state,
        records: snapshot.records,
        searches: snapshot.searches,
      }
      notices = snapshot.notices
      remoteError = ""
      notify()
    } catch (e) {
      remoteError = (e as Error).message
      state = { ...state, records: [] }
      notices = []
      notify()
    }
  },
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  dispatch: async (actor: Actor, command: CreditCommand) => {
    const membership = membershipService.getSnapshot()
    const eligible = canParticipate(
      actor,
      membership.applications,
      membership.invoices,
    )
    if (command.type === "submit") {
      const attachments: Record<string, string> = {}
      for (const evidence of command.evidence) {
        const file = getLocalFile(evidence.id)
        if (!file) throw Error(`Reattach ${evidence.name}.`)
        attachments[evidence.id] = await new Promise<string>(
          (resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result).split(",")[1])
            reader.onerror = () =>
              reject(Error("Unable to read the attachment."))
            reader.readAsDataURL(file)
          },
        )
      }
      await complaintRequest(actor, eligible, "/complaints", {
        ...command,
        attachments,
      })
      await creditService.refresh(actor)
      return
    }
    if (command.type === "update") {
      await complaintRequest(
        actor,
        eligible,
        `/complaints/${command.id}/update`,
        command,
      )
      await creditService.refresh(actor)
      return
    }
    if (command.type === "dispute") {
      await complaintRequest(
        actor,
        eligible,
        `/complaints/${command.id}/dispute`,
        command,
      )
      await creditService.refresh(actor)
      return
    }
    state = applyCreditCommand(
      state,
      actor,
      command,
      membershipService.getSnapshot().applications,
      new Date().toISOString(),
      membershipService.getSnapshot().invoices,
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
