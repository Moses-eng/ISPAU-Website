import type { MembershipApplicationValues } from "@/types/MembershipApplicationValues"

export type MembershipFieldRule = {
  name: string
  label: string
  required: boolean | ((values: MembershipApplicationValues) => boolean)
  optional?: boolean
}
