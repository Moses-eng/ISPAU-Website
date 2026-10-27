import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { staffSections, staffGroup } from "@/config/workspace"
import SectionNavigation from "@/components/dashboard/SectionNavigation"
import StaffWorkspaceContent from "./StaffWorkspaceContent"
export default function StaffWorkspace(props: {
  state: WorkspaceState
  actor: Actor
  route: string
  navigate: (route: string) => void
  feedback: (message: string, error?: boolean) => void
}) {
  const section = props.route.split("/")[0],
    group = staffGroup(section)
  const sections = staffSections.filter(
    (s) =>
      staffGroup(s.id) === group &&
      props.actor.kind === "staff" &&
      s.roles.some((r) => props.actor.roles.includes(r)),
  )
  const actual =
    section === "membership" ||
    (section === "administration" &&
      sections.length > 0 &&
      !sections.some((s) => s.id === section))
      ? sections[0]?.id || "applications"
      : section
  const items = sections.map((s) => ({
    id: s.id,
    label:
      s.id === "communications"
        ? "Email templates"
        : s.id === "administration"
          ? "Settings & audit"
          : s.label,
  }))
  return (
    <>
      {items.length > 1 && (
        <SectionNavigation
          label={`${group} sections`}
          items={items}
          current={actual}
          onSelect={props.navigate}
        />
      )}
      <StaffWorkspaceContent
        {...props}
        route={
          section === "membership" || actual !== section ? actual : props.route
        }
      />
    </>
  )
}
