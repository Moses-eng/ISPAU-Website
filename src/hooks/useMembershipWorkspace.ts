import { useSyncExternalStore } from "react"
import { membershipService } from "@/services/membershipService"
import { demoSession } from "@/services/demoSession"
export default function useMembershipWorkspace() {
  return {
    state: useSyncExternalStore(
      membershipService.subscribe,
      membershipService.getSnapshot,
    ),
    actor: useSyncExternalStore(demoSession.subscribe, demoSession.getSnapshot),
  }
}
