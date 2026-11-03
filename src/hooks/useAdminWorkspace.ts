import { useSyncExternalStore } from "react"
import { membershipService } from "@/services/membershipService"
import { sessionService } from "@/services/sessionService"
export default function useAdminWorkspace() {
  const actor = useSyncExternalStore(
    sessionService.subscribe,
    sessionService.getSnapshot,
  )
  const state = useSyncExternalStore(membershipService.subscribe, () =>
    membershipService.workspaceSnapshot(actor),
  )
  return {
    state,
    actor,
  }
}
