import type {
  Actor,
  Application,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Timeline from "@/components/dashboard/Timeline"
import WorkflowActions from "@/features/membership/components/WorkflowActions"
export default function MemberOverview({
  application: a,
  actor,
  feedback,
  navigate,
  state,
}: {
  application: Application
  actor: Actor
  feedback: (message: string, error?: boolean) => void
  navigate: (route: string) => void
  state: WorkspaceState
}) {
  const active = a.stage === "Active",
    invoice = state.invoices.find((i) => i.applicationId === a.id)
  const lastDecision = a.decisions.slice(-1)[0]
  return (
    <>
      <PageHeader
        title={active ? "Your ISPAU Membership" : "Your Membership Application"}
        description={a.organisation}
        action={
          active ? (
            <Button onClick={() => navigate("organisation")}>
              Update organisation details
            </Button>
          ) : a.stage === "Draft" ? (
            <Button onClick={() => navigate("application")}>
              Continue Application
            </Button>
          ) : a.stage === "Approved awaiting payment" ? (
            <Button onClick={() => navigate("invoices")}>View Proforma</Button>
          ) : undefined
        }
      />
      <div className="workspace-member-banner">
        <div>
          <StatusBadge status={a.stage} />
          <h2>{active ? a.memberId : a.id}</h2>
          <p>
            {active
              ? `Membership tier: ${a.confirmedTier}`
              : `Requested tier: ${a.requestedTier}`}
          </p>
        </div>
        <dl>
          <dt>{active ? "Membership period" : "Last update"}</dt>
          <dd>
            {active
              ? `${a.periodStart} — ${a.periodEnd}`
              : new Date(a.updatedAt).toLocaleString("en-GB")}
          </dd>
          <dt>{active ? "Membership standing" : "Assigned reviewer"}</dt>
          <dd>{active ? a.standing : a.reviewer}</dd>
        </dl>
      </div>
      {active ? (
        <>
          <div className="workspace-quick-actions">
            {[
              ["profile", "Manage directory profile"],
              ["invoices", "View invoices"],
              ["trade-credit", "Open Trade Credit workspace"],
              ["renewal", "Confirm renewal details"],
            ].map(([id, label]) => (
              <Button key={id} kind="secondary" onClick={() => navigate(id)}>
                {label} →
              </Button>
            ))}
          </div>
          <section className="workspace-panel">
            <h2>Outstanding profile tasks</h2>
            <p>
              {a.proposedProfile
                ? "Your public profile changes are awaiting staff review."
                : !a.consent
                  ? "Directory publication permission is not granted. Your profile remains private."
                  : !a.profileApproved
                    ? "Your public profile needs staff approval."
                    : "Your approved public profile is up to date."}
            </p>
            <h3>Renewal information</h3>
            <p>
              Your recorded period ends {a.periodEnd}. Confirm or correct your
              details before following the approved renewal process.
            </p>
            <h3>Available invoices</h3>
            <p>
              {state.invoices.filter((i) => i.applicationId === a.id).length}{" "}
              invoice record(s) available in Invoices.
            </p>
          </section>
        </>
      ) : (
        <section className="workspace-panel">
          <h2>Next required action</h2>
          <p>
            {
              (
                {
                  Draft:
                    "Continue your saved application, attach the required evidence and review your answers before submission.",
                  Submitted:
                    "Your application has been received. The membership team will begin verification; no action is required right now.",
                  "Under review":
                    "The membership team is reviewing your answers and any clarification response. You will see requested corrections here.",
                  "Clarification needed":
                    "Respond to all corrections in one consolidated response below.",
                  "Decision pending":
                    "Verification is complete and the application is awaiting an authorised admission decision.",
                  "Approved awaiting payment":
                    "View the non-tax proforma and record payment details. A receipt does not activate membership.",
                  Deferred:
                    lastDecision?.reason ||
                    "Contact the Secretariat for the communicated decision.",
                  Declined:
                    lastDecision?.reason ||
                    "Contact the Secretariat for the communicated decision.",
                  Active: "",
                } as Record<string, string>
              )[a.stage]
            }
          </p>
          {["Deferred", "Declined"].includes(a.stage) && (
            <a href="mailto:membership@ispau.ug">Contact the Secretariat</a>
          )}
          <WorkflowActions
            application={a}
            actor={actor}
            invoice={invoice}
            feedback={feedback}
          />
          {a.clarifications.map((c) => (
            <div key={c.id} className="workspace-history">
              <strong>
                Clarification request ·{" "}
                {new Date(c.date).toLocaleDateString("en-GB")}
              </strong>
              <ul>
                {c.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                {c.response
                  ? `Your response: ${c.response}`
                  : "Response not yet received"}
              </p>
            </div>
          ))}
        </section>
      )}
      <div className="workspace-review-grid">
        <section className="workspace-panel">
          <h2>{active ? "Recent activity" : "Application progress"}</h2>
          <Timeline items={a.activity} />
        </section>
        <section className="workspace-panel">
          <h2>Organisation notices</h2>
          {state.notices
            .filter((n) => n.applicationId === a.id)
            .map((n) => (
              <article className="workspace-history" key={n.id}>
                <strong>{n.template}</strong>
                <p className="whitespace-pre-line">{n.body}</p>
                <small>
                  Prepared · {new Date(n.date).toLocaleString("en-GB")}
                </small>
              </article>
            ))}
          {!state.notices.some((n) => n.applicationId === a.id) && (
            <p>
              No notices yet. Any clarification, admission or welcome notice
              will appear here.
            </p>
          )}
        </section>
      </div>
    </>
  )
}
