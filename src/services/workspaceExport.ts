import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
export function buildRestrictedCsv(state: WorkspaceState, actor: Actor) {
  if (actor.kind !== "staff" || !actor.roles.includes("secretariat"))
    throw Error(
      "CSV export is restricted to the Secretariat role in this demo.",
    )
  const escape = (value: string) =>
    `"${value.replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`
  return [
    ["Reference", "Organisation", "Stage", "Tier"],
    ...state.applications
      .filter((a) => a.stage !== "Draft")
      .map((a) => [
        a.id,
        a.organisation,
        a.stage,
        a.confirmedTier || a.requestedTier,
      ]),
  ]
    .map((row) => row.map(escape).join(","))
    .join("\n")
}
