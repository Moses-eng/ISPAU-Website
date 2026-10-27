import type {
  Actor,
  Application,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import SectionNavigation from "@/components/dashboard/SectionNavigation"
import BillingWorkspace from "@/features/membership/components/BillingWorkspace"
import RenewalDetails from "./RenewalDetails"
export default function MemberMembership({
  application,
  actor,
  state,
  section,
  navigate,
  feedback,
}: {
  application: Application
  actor: Actor
  state: WorkspaceState
  section: string
  navigate: (route: string) => void
  feedback: (text: string, error?: boolean) => void
}) {
  return (
    <>
      <SectionNavigation
        label="Membership sections"
        items={[
          { id: "membership", label: "Invoices & documents" },
          { id: "renewal", label: "Renewal" },
        ]}
        current={section === "renewal" ? "renewal" : "membership"}
        onSelect={navigate}
      />
      {section === "renewal" ? (
        <RenewalDetails
          application={application}
          actor={actor}
          navigate={navigate}
          feedback={feedback}
        />
      ) : (
        <BillingWorkspace actor={actor} state={state} feedback={feedback} />
      )}
    </>
  )
}
