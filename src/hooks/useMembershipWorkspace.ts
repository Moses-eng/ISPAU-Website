// src/hooks/useMembershipWorkspace.ts
import { useSyncExternalStore } from "react"
import { membershipService } from "@/services/membershipService"
import { useSession } from "@/apiServices/session"

export default function useMembershipWorkspace() {
  const state = useSyncExternalStore(
    membershipService.subscribe,
    membershipService.getSnapshot,
  )
  const actor = useSession()
  return { state, actor }
}
