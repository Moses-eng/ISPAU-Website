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
  const review = can(actor, "applications.review")
  const applications = visibleApplications(state, actor)
  const summaries = !review
    ? [
        {
          label: "Awaiting payment",
          count: state.invoices.filter((i) => i.status === "Awaiting payment")
            .length,
        },
        {
          label: "Receipts to confirm",
          count: state.invoices.filter((i) => i.status === "Receipt submitted")
            .length,
        },
        {
          label: "Confirmed payments",
          count: state.invoices.filter((i) => i.status === "Confirmed").length,
        },
        {
          label: "Tax invoices to attach",
          count: state.invoices.filter(
            (i) => i.status === "Confirmed" && !i.taxInvoice,
          ).length,
        },
      ]
    : [
        {
          label: "New submissions",
          count: applications.filter((a) => a.stage === "Submitted").length,
        },
        {
          label: "Clarification responses",
          count: applications.filter(
            (a) =>
              a.stage === "Under review" &&
              a.clarifications.some((c) => c.response),
          ).length,
        },
        {
          label: "Awaiting decision",
          count: applications.filter((a) => a.stage === "Decision pending")
            .length,
        },
        {
          label: "Awaiting payment",
          count: applications.filter(
            (a) => a.stage === "Approved awaiting payment",
          ).length,
        },
      ]
  if (review && can(actor, "billing.manage"))
    summaries.push(
      {
        label: "Receipts to confirm",
        count: state.invoices.filter((i) => i.status === "Receipt submitted")
          .length,
      },
      {
        label: "Tax invoices to attach",
        count: state.invoices.filter(
          (i) => i.status === "Confirmed" && !i.taxInvoice,
        ).length,
      },
    )
  const attention = applications
    .filter((a) =>
      !review
        ? state.invoices.some(
            (i) =>
              i.applicationId === a.id &&
              (i.status !== "Confirmed" || !i.taxInvoice),
          )
        : true,
    )
    .filter(
      (a) =>
        [
          "Submitted",
          "Under review",
          "Decision pending",
          "Approved awaiting payment",
        ].includes(a.stage) ||
        (can(actor, "billing.manage") &&
          a.stage === "Active" &&
          state.invoices.some(
            (i) =>
              i.applicationId === a.id &&
              (i.status !== "Confirmed" || !i.taxInvoice),
          )),
    )
  return (
    <>
      <PageHeader
        title={review ? "Membership Overview" : "Finance Overview"}
        description={
          review
            ? "Review applications, resolve outstanding items and manage member activation."
            : "Manage invoices, confirm payments and prepare tax invoices."
        }
      />
      <div className="workspace-summaries">
        {summaries.map((s) => (
          <div className="workspace-summary" key={s.label}>
            <span>{s.label}</span>
            <strong>{s.count}</strong>
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
            onClick={() => navigate(!review ? "billing" : "applications")}
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
            ...(review
              ? [
                  {
                    label: "Reviewer",
                    cell: (a: (typeof applications)[number]) => a.reviewer,
                  },
                ]
              : []),
            {
              label: "Next action",
              cell: (a) => (
                <Button
                  kind="ghost"
                  onClick={() =>
                    navigate(
                      `${!review || ["Approved awaiting payment", "Active"].includes(a.stage) ? "billing" : "applications"}/${a.id}`,
                    )
                  }
                >
                  {!review
                    ? "Review invoice"
                    : a.stage === "Decision pending"
                      ? can(actor, "applications.decide")
                        ? "Record decision"
                        : "View decision progress"
                      : ["Approved awaiting payment", "Active"].includes(
                            a.stage,
                          )
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
          items={
            !review
              ? state.invoices
                  .filter((i) => i.confirmedAt)
                  .map((i) => ({
                    id: i.id,
                    date: i.confirmedAt!,
                    actor: i.confirmedBy || "Finance",
                    text: `${i.id}: payment confirmed`,
                  }))
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 6)
              : applications
                  .flatMap((a) =>
                    a.activity.map((e) => ({
                      ...e,
                      text: `${a.organisation}: ${e.text}`,
                    })),
                  )
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 6)
          }
        />
      </section>
    </>
  )
}
