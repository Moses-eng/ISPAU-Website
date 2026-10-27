import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { demoStaff, roleLabels, tierOptions } from "@/config/workspace"
import { buildRestrictedCsv } from "@/services/workspaceExport"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import Timeline from "@/components/dashboard/Timeline"
import Button from "@/components/ui/Button"
export default function Administration({
  state,
  actor,
  feedback,
}: {
  state: WorkspaceState
  actor: Actor
  feedback: (message: string, error?: boolean) => void
}) {
  const download = () => {
    try {
      const url = URL.createObjectURL(
        new Blob([buildRestrictedCsv(state, actor)], {
          type: "text/csv;charset=utf-8",
        }),
      )
      const link = document.createElement("a")
      link.href = url
      link.download = "ispau-application-register.csv"
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      feedback(
        "Register exported. Private evidence and representative details are excluded.",
      )
    } catch (e) {
      feedback((e as Error).message, true)
    }
  }
  return (
    <>
      <PageHeader
        title="Administration"
        description="Manage access assignments, membership settings and audit history."
        action={
          <Button kind="secondary" onClick={download}>
            Export restricted CSV
          </Button>
        }
      />
      <section className="workspace-panel">
        <h2>ISPAU administrator access</h2>
        <DataTable
          rows={demoStaff}
          label="Staff role assignments"
          rowKey={(u) => u.id}
          columns={[
            { label: "User", cell: (u) => u.name, sort: (u) => u.name },
            {
              label: "Authorised roles",
              cell: (u) => u.roles.map((r) => roleLabels[r]).join(" · "),
            },
          ]}
        />
        <p>
          The ISPAU administrator manages association operations and authorised
          access.
        </p>
      </section>
      <div className="workspace-review-grid">
        <section className="workspace-panel">
          <h2>Membership configuration</h2>
          <p>Tiers represented: {tierOptions.join(", ")}.</p>
          <p>
            Annual USD fee baseline: Platinum 1,000; Silver 500; Associate 250;
            Affiliate 150. UGX equivalents are indicative. Currency conversion
            and membership-year rules still require ISPAU configuration.
          </p>
          <p>
            Renewal is a confirmation flow; periods do not automatically expire
            or extend.
          </p>
        </section>
        <section className="workspace-panel">
          <h2>Directory & notice controls</h2>
          <p>
            Publication requires active membership, explicit eligibility,
            approved public fields and permission. Withdrawal hides a profile
            without changing membership standing or portal access.
          </p>
          <p>
            Use the current ISPAU-approved notices, membership rules and privacy
            arrangements.
          </p>
          <p>
            Trade Credit is available only within authorised ISP and ISPAU
            workspaces. Public pages never display customer payment records.
          </p>
        </section>
      </div>
      <section className="workspace-panel">
        <h2>Audit log</h2>
        <Timeline
          items={state.applications
            .flatMap((a) =>
              a.activity.map((e) => ({ ...e, text: `${a.id} · ${e.text}` })),
            )
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 30)}
        />
      </section>
    </>
  )
}
