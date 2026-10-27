import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { demoStaff, demoMemberOrganisationId } from "@/config/workspace"
import Button from "@/components/ui/Button"
import StatusBadge from "./StatusBadge"
export default function DemoIdentity({
  kind,
  state,
  onSelect,
  applicationMode = false,
}: {
  kind: "staff" | "organisation"
  state: WorkspaceState
  applicationMode?: boolean
  onSelect: (actor: Actor) => void
}) {
  return (
    <div className="workspace-identities">
      <p>
        {kind === "staff"
          ? "Manage membership and association services."
          : "Manage your organisation’s membership and services."}
      </p>
      {kind === "staff"
        ? demoStaff.map((actor) => (
            <button
              className="workspace-identity"
              key={actor.id}
              onClick={() => onSelect(actor)}
            >
              <strong>ISPAU Admin</strong>
              <span>Association administration</span>
              <small>
                Membership · Directory · Billing · Trade Credit verification
              </small>
            </button>
          ))
        : state.applications
            .filter((a) =>
              applicationMode
                ? a.organisationId === "org-7"
                : a.organisationId === demoMemberOrganisationId,
            )
            .map((a) => (
              <button
                className="workspace-identity"
                key={a.id}
                onClick={() =>
                  onSelect({
                    id: `portal-${a.organisationId}`,
                    name: a.organisation,
                    kind: "organisation",
                    roles: [],
                    organisationId: a.organisationId,
                  })
                }
              >
                <strong>{a.organisation}</strong>
                <span>
                  {applicationMode
                    ? "Applicant workspace"
                    : "ISP Account Manager"}{" "}
                  · {a.memberId || a.id}
                </span>
                <StatusBadge status={a.stage} />
              </button>
            ))}
      <Button
        kind="ghost"
        onClick={() => {
          location.href = "/"
        }}
      >
        Return to public website
      </Button>
    </div>
  )
}
