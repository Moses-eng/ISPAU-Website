import type {
  Actor,
  Application,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Timeline from "@/components/dashboard/Timeline"
import EvidencePreview from "@/components/dashboard/EvidencePreview"
import WorkflowActions from "@/features/membership/components/WorkflowActions"
import { verificationLabels } from "@/config/workspace"
import { membershipFormSchema } from "@/features/membership/data/membershipFormSchema"
export default function ApplicationReview({
  application: a,
  state,
  actor,
  feedback,
}: {
  application: Application
  state: WorkspaceState
  actor: Actor
  feedback: (message: string, error?: boolean) => void
}) {
  return (
    <>
      <PageHeader
        title={a.organisation}
        description={`${a.id} · Requested ${a.requestedTier} · Confirmed ${a.confirmedTier || "not yet decided"} · Reviewer: ${a.reviewer}`}
      />
      <div className="workspace-review-status">
        <StatusBadge status={a.stage} />
        <span>Updated {new Date(a.updatedAt).toLocaleString("en-GB")}</span>
      </div>
      <WorkflowActions
        application={a}
        actor={actor}
        invoice={state.invoices.find((i) => i.applicationId === a.id)}
        feedback={feedback}
      />
      <div className="workspace-review-grid">
        <div>
          <section className="workspace-panel">
            <h2>Application information</h2>
            <dl className="workspace-record">
              {Object.entries(a.values).map(([key, value]) => (
                <div key={key}>
                  <dt>
                    {membershipFormSchema.find((field) => field.name === key)
                      ?.label || key.replace(/([A-Z])/g, " $1")}
                  </dt>
                  <dd>
                    {typeof value === "boolean"
                      ? value
                        ? "Yes"
                        : "No"
                      : value || "Not provided"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="workspace-panel">
            <h2>Clarification history</h2>
            {a.clarifications.length ? (
              a.clarifications.map((c) => (
                <article className="workspace-history" key={c.id}>
                  <strong>
                    {c.requestedBy} ·{" "}
                    {new Date(c.date).toLocaleDateString("en-GB")}
                  </strong>
                  <ul>
                    {c.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p>
                    <b>Applicant response:</b>{" "}
                    {c.response || "Awaiting a consolidated response"}
                  </p>
                  {c.respondedAt && (
                    <small>
                      Received {new Date(c.respondedAt).toLocaleString("en-GB")}
                    </small>
                  )}
                </article>
              ))
            ) : (
              <p>No clarification requests.</p>
            )}
          </section>
          <section className="workspace-panel">
            <h2>Decision history</h2>
            {a.decisions.length ? (
              a.decisions.map((d, i) => (
                <article key={i} className="workspace-history">
                  <StatusBadge status={d.outcome} />
                  <p>{d.reason}</p>
                  <small>
                    {d.actor} · {new Date(d.date).toLocaleDateString("en-GB")} ·
                    Tier: {d.tier || "Not assigned"}
                  </small>
                </article>
              ))
            ) : (
              <p>No admission decision recorded.</p>
            )}
          </section>
        </div>
        <div>
          <section className="workspace-panel">
            <h2>Supporting evidence</h2>
            <p>
              Review context and authenticity independently. Uploaded documents
              do not automatically prove eligibility.
            </p>
            {a.evidence.map((file) => (
              <div key={file.id}>
                <EvidencePreview file={file} inline />
              </div>
            ))}
          </section>
          <section className="workspace-panel">
            <h2>Verification checklist</h2>
            {verificationLabels.map((label) => {
              const result = a.verifications.find((v) => v.label === label)
              return (
                <div key={label} className="workspace-history">
                  <strong>{label}</strong>
                  <div>
                    <StatusBadge status={result?.result || "Not reviewed"} />
                  </div>
                  {result && (
                    <>
                      <p>{result.note}</p>
                      <small>
                        {result.reviewer} ·{" "}
                        {new Date(result.date).toLocaleDateString("en-GB")}
                      </small>
                    </>
                  )}
                </div>
              )
            })}
          </section>
          <section className="workspace-panel">
            <h2>Activity timeline</h2>
            <Timeline items={a.activity} />
          </section>
        </div>
      </div>
    </>
  )
}
