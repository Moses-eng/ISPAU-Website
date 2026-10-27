import TradeWorkspace from "@/features/trade-credit/workspace/TradeWorkspace"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { staffSections } from "@/config/workspace"
import Overview from "./Overview"
import Applications from "./Applications"
import ApplicationReview from "./ApplicationReview"
import Members from "./Members"
import BillingWorkspace from "@/features/membership/components/BillingWorkspace"
import Communications from "./Communications"
import Reports from "./Reports"
import Administration from "./Administration"
import EmptyState from "@/components/dashboard/EmptyState"
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
  const allowed = staffSections
    .find((s) => s.id === section)
    ?.roles.some((r) => actor.roles.includes(r))
  if (actor.kind !== "staff" || !allowed)
    return (
      <EmptyState
        title="Access denied"
        text="Your account does not have access to this section. Contact the ISPAU administrator if you need assistance."
      />
    )
  if (section === "trade-credit")
    return <TradeWorkspace actor={actor} membership={state} />
  if (section === "overview")
    return <Overview state={state} actor={actor} navigate={navigate} />
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
      <BillingWorkspace
        state={state}
        actor={actor}
        feedback={feedback}
        selectedId={id}
      />
    )
  if (section === "communications")
    return <Communications state={state} actor={actor} feedback={feedback} />
  if (section === "reports") return <Reports state={state} />
  return <Administration state={state} actor={actor} feedback={feedback} />
}
