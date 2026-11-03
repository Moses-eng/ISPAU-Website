import { canAccessSection } from "@/config/permissions"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import Overview from "./Overview"
import Applications from "./Applications"
import ApplicationReview from "./ApplicationReview"
import Members from "./Members"
import BillingWorkspace from "@/features/membership/components/BillingWorkspace"
import Communications from "./Communications"
import Reports from "./Reports"
import Administration from "./Administration"
import EmptyState from "@/components/dashboard/EmptyState"
import StaffActivity from "../components/StaffActivity"
import { can } from "@/config/permissions"
export default function StaffWorkspaceContent({
  state,
  actor,
  route,
  navigate,
  feedback,
}: {
  state: WorkspaceState
  actor: Actor
  route: string
  navigate: (route: string) => void
  feedback: (message: string, error?: boolean) => void
}) {
  const [section, id] = route.split("/")
  const allowed = canAccessSection(actor, section)
  if (actor.kind !== "staff" || !allowed)
    return (
      <EmptyState
        title="Access denied"
        text="Your account does not have access to this section. Contact the ISPAU administrator if you need assistance."
      />
    )
  if (section === "overview")
    return <Overview state={state} actor={actor} navigate={navigate} />
  if (section === "staff-activity")
    return <StaffActivity key="global" actor={actor} />
  if (section === "membership-activity")
    return <StaffActivity key="membership" actor={actor} area="membership" />
  if (section === "finance-activity")
    return <StaffActivity key="finance" actor={actor} area="finance" />
  if (section === "applications") {
    const application = state.applications.find(
      (a) => a.id === id && a.stage !== "Draft",
    )
    return id ? (
      application ? (
        <ApplicationReview
          application={application}
          state={state}
          actor={actor}
          feedback={feedback}
        />
      ) : (
        <EmptyState
          title="Record unavailable"
          text="The reference is unavailable or is a private unsubmitted draft."
        />
      )
    ) : (
      <Applications state={state} actor={actor} navigate={navigate} />
    )
  }
  if (section === "members")
    return <Members state={state} actor={actor} feedback={feedback} />
  if (section === "billing")
    return (
      <>
        <BillingWorkspace
          state={state}
          actor={actor}
          feedback={feedback}
          selectedId={id}
        />
        {can(actor, "billing.manage") && (
          <StaffActivity actor={actor} area="finance" embedded />
        )}
      </>
    )
  if (section === "communications")
    return <Communications state={state} actor={actor} feedback={feedback} />
  if (section === "reports") return <Reports state={state} actor={actor} />
  return <Administration state={state} actor={actor} feedback={feedback} />
}
