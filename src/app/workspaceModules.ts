import type { ComponentType } from "react"
import type { View } from "@/types/View"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"

export type WorkspaceProps = {
  state: WorkspaceState
  actor: Actor
  route: string
  navigate: (route: string) => void
  feedback: (message: string, error?: boolean) => void
}

export const staffWorkspace: ComponentType<WorkspaceProps> | null = null

export type StaffAccessProps = {
  go: (view: View) => void
  onContinue: () => void
}
export const staffAccess: ComponentType<StaffAccessProps> | null = null
