import type { WorkspaceState } from "@/features/membership/types/workspace"
import { stages } from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
export default function Reports({ state }: { state: WorkspaceState }) {
  const apps = state.applications.filter((a) => a.stage !== "Draft"),
    active = apps.filter((a) => a.stage === "Active")
  const byStage = stages
    .filter((s) => s !== "Draft")
    .map((stage) => ({
      stage,
      count: apps.filter((a) => a.stage === stage).length,
    }))
  const dates = [...new Set(apps.map((a) => a.submittedAt!.slice(0, 10)))]
    .sort()
    .map((date) => ({
      date,
      count: apps.filter((a) => a.submittedAt!.startsWith(date)).length,
    }))
  const tiers = [...new Set(active.map((a) => a.confirmedTier!))].map(
    (tier) => ({
      tier,
      count: active.filter((a) => a.confirmedTier === tier).length,
    }),
  )
  const upcoming = active.filter((a) => {
    const days = (Date.parse(a.periodEnd) - Date.now()) / 86400000
    return days >= 0 && days <= 90
  })
  return (
    <>
      <PageHeader
        title="Membership reports"
        description="Counts are calculated from the same records shown in applications, billing and the member register."
      />
      <div className="workspace-review-grid">
        <section className="workspace-panel">
          <h2>Applications by stage</h2>
          {byStage.map((s) => (
            <div className="workspace-stage" key={s.stage}>
              <span>{s.stage}</span>
              <meter
                min={0}
                max={Math.max(1, apps.length)}
                value={s.count}
                aria-label={`${s.stage}: ${s.count}`}
              />
              <strong>{s.count}</strong>
            </div>
          ))}
        </section>
        <section className="workspace-panel">
          <h2>Active members by tier</h2>
          <DataTable
            rows={tiers}
            label="Active members by tier"
            rowKey={(r) => r.tier}
            columns={[
              { label: "Tier", cell: (r) => r.tier, sort: (r) => r.tier },
              {
                label: "Active members",
                cell: (r) => r.count,
                sort: (r) => r.count,
              },
            ]}
          />
        </section>
        <section className="workspace-panel">
          <h2>Submissions over time</h2>
          <DataTable
            rows={dates}
            label="Submissions by date"
            rowKey={(r) => r.date}
            columns={[
              {
                label: "Submitted date",
                cell: (r) => r.date,
                sort: (r) => r.date,
              },
              {
                label: "Applications",
                cell: (r) => r.count,
                sort: (r) => r.count,
              },
            ]}
          />
        </section>
        <section className="workspace-panel">
          <h2>Upcoming renewals</h2>
          <p>
            Periods ending in the next 90 days. This is a reporting window, not
            an automatic expiry or renewal rule.
          </p>
          <DataTable
            rows={upcoming}
            label="Upcoming renewals"
            rowKey={(a) => a.id}
            columns={[
              {
                label: "Organisation",
                cell: (a) => a.organisation,
                sort: (a) => a.organisation,
              },
              { label: "Member ID", cell: (a) => a.memberId },
              {
                label: "Period ends",
                cell: (a) => a.periodEnd,
                sort: (a) => a.periodEnd,
              },
            ]}
          />
        </section>
      </div>
    </>
  )
}
