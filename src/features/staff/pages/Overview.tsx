import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { visibleApplications } from "@/features/membership/services/workflow"
import { can } from "@/config/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Timeline from "@/components/dashboard/Timeline"
import Button from "@/components/ui/Button"
export default function Overview({
  state,
  actor,
  navigate,
}: {
  state: WorkspaceState
  actor: Actor
  navigate: (route: string) => void
}) {
  const applications = visibleApplications(state, actor)
  const summaries = [
    {
      label: "New submissions",
      stage: "Submitted",
      count: applications.filter((a) => a.stage === "Submitted").length,
    },
    {
      label: "Clarification responses",
      stage: "Under review",
      count: applications.filter(
        (a) =>
          a.stage === "Under review" &&
          a.clarifications.some((c) => c.response),
      ).length,
    },
    {
      label: "Awaiting decision",
      stage: "Decision pending",
      count: applications.filter((a) => a.stage === "Decision pending").length,
    },
    {
      label: "Awaiting payment",
      stage: "Approved awaiting payment",
      count: applications.filter((a) => a.stage === "Approved awaiting payment")
        .length,
    },
  ]
  const attention = applications
    .filter((a) =>
      actor.roles.includes("accounts") && actor.roles.length === 1
        ? state.invoices.some(
            (i) => i.applicationId === a.id && i.status !== "Confirmed",
          )
        : true,
    )
    .filter((a) =>
      [
        "Submitted",
        "Under review",
        "Decision pending",
        "Approved awaiting payment",
      ].includes(a.stage),
    )
  return (
    <>
      <PageHeader
        title="Membership Overview"
        description="Review applications, resolve outstanding items and manage member activation."
      />
      <div className="workspace-summaries">
        {summaries.map((s) => (
          <div className="workspace-summary" key={s.label}>
            <span>{s.label}</span>
            <strong>{s.count}</strong>
            <small>From the current application records</small>
          </div>
        ))}
      </div>
      <section className="workspace-panel">
        <div className="workspace-section-heading">
          <div>
            <h2>Needs attention</h2>
            <p>Move each application toward its next step.</p>
          </div>
          <Button
            kind="ghost"
            onClick={() =>
              navigate(
                can(actor, "accounts") &&
                  !can(actor, "membership", "decision", "secretariat")
                  ? "billing"
                  : "applications",
              )
            }
          >
            View workspace →
          </Button>
        </div>
        <DataTable
          rows={attention}
          label="Applications needing attention"
          rowKey={(a) => a.id}
          columns={[
            {
              label: "Organisation",
              cell: (a) => (
                <>
                  <strong>{a.organisation}</strong>
                  <small>{a.id}</small>
                </>
              ),
              sort: (a) => a.organisation,
            },
            {
              label: "Stage",
              cell: (a) => <StatusBadge status={a.stage} />,
              sort: (a) => a.stage,
            },
            {
              label: "Age",
              cell: (a) =>
                `${Math.max(0, Math.floor((Date.now() - Date.parse(a.submittedAt!)) / 86400000))} days`,
              sort: (a) => a.submittedAt!,
            },
            { label: "Reviewer", cell: (a) => a.reviewer },
            {
              label: "Next action",
              cell: (a) => (
                <Button
                  kind="ghost"
                  onClick={() =>
                    navigate(
                      `${can(actor, "accounts") && !can(actor, "membership", "decision", "secretariat") ? "billing" : "applications"}/${a.id}`,
                    )
                  }
                >
                  {a.stage === "Decision pending"
                    ? "Record decision"
                    : a.stage === "Approved awaiting payment"
                      ? "Review payment"
                      : a.clarifications.some((c) => c.response)
                        ? "Read clarification response"
                        : "Review application"}
                </Button>
              ),
            },
          ]}
        />
      </section>
      <section className="workspace-panel">
        <h2>Recent activity</h2>
        <Timeline
          items={applications
            .flatMap((a) =>
              a.activity.map((e) => ({
                ...e,
                text: `${a.organisation}: ${e.text}`,
              })),
            )
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 6)}
        />
      </section>
    </>
  )
}
