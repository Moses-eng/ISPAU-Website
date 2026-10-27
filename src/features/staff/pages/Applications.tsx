import { useState } from "react"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { stages } from "@/features/membership/types/workspace"
import { visibleApplications } from "@/features/membership/services/workflow"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Button from "@/components/ui/Button"
export default function Applications({
  state,
  actor,
  navigate,
}: {
  state: WorkspaceState
  actor: Actor
  navigate: (route: string) => void
}) {
  const [query, setQuery] = useState(""),
    [stage, setStage] = useState(""),
    [tier, setTier] = useState(""),
    [reviewer, setReviewer] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("")
  const applications = visibleApplications(state, actor)
  const rows = applications.filter(
    (a) =>
      `${a.organisation} ${a.id}`.toLowerCase().includes(query.toLowerCase()) &&
      (!stage || a.stage === stage) &&
      (!tier || a.requestedTier === tier) &&
      (!reviewer || a.reviewer === reviewer) &&
      (!from || a.submittedAt!.slice(0, 10) >= from) &&
      (!to || a.submittedAt!.slice(0, 10) <= to),
  )
  return (
    <>
      <PageHeader
        title="Applications"
        description="One queue for submission, verification and admission. Unsubmitted drafts stay private to applicants."
      />
      <section className="workspace-panel">
        <label className="field">
          <span>Search organisation or reference</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications…"
          />
        </label>
        <details className="workspace-filters">
          <summary>Filters · {rows.length} matching applications</summary>
          <div className="workspace-filter-grid">
            <label className="field">
              Stage
              <select value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">All stages</option>
                {stages
                  .filter((s) => s !== "Draft")
                  .map((s) => (
                    <option key={s}>{s}</option>
                  ))}
              </select>
            </label>
            <label className="field">
              Requested tier
              <select value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="">All tiers</option>
                {[...new Set(applications.map((a) => a.requestedTier))].map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </label>
            <label className="field">
              Reviewer
              <select
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
              >
                <option value="">All reviewers</option>
                {[...new Set(applications.map((a) => a.reviewer))].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Submitted from
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="field">
              Submitted to
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <Button
              kind="secondary"
              onClick={() => {
                setQuery("")
                setStage("")
                setTier("")
                setReviewer("")
                setFrom("")
                setTo("")
              }}
            >
              Clear filters
            </Button>
          </div>
        </details>
        <DataTable
          rows={rows}
          label="Membership application queue"
          rowKey={(a) => a.id}
          columns={[
            {
              label: "Organisation",
              cell: (a) => <strong>{a.organisation}</strong>,
              sort: (a) => a.organisation,
            },
            { label: "Reference", cell: (a) => a.id, sort: (a) => a.id },
            {
              label: "Requested tier",
              cell: (a) => a.requestedTier,
              sort: (a) => a.requestedTier,
            },
            {
              label: "Stage",
              cell: (a) => <StatusBadge status={a.stage} />,
              sort: (a) => a.stage,
            },
            {
              label: "Submitted",
              cell: (a) => new Date(a.submittedAt!).toLocaleDateString("en-GB"),
              sort: (a) => a.submittedAt!,
            },
            {
              label: "Age",
              cell: (a) =>
                `${Math.max(0, Math.floor((Date.now() - Date.parse(a.submittedAt!)) / 86400000))}d`,
            },
            {
              label: "Reviewer",
              cell: (a) => a.reviewer,
              sort: (a) => a.reviewer,
            },
            {
              label: "Next action",
              cell: (a) => (
                <Button
                  kind="ghost"
                  onClick={() => navigate(`applications/${a.id}`)}
                >
                  Open review →
                </Button>
              ),
            },
          ]}
        />
      </section>
    </>
  )
}
