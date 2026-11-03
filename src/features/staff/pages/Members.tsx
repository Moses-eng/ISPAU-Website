import PdfDownload from "@/components/dashboard/PdfDownload"
import { can } from "@/config/permissions"
import OrganisationDetailsEditor from "@/features/membership/components/OrganisationDetailsEditor"
import { membershipService } from "@/services/membershipService"
import { useState } from "react"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { published } from "@/features/membership/services/workflow"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Timeline from "@/components/dashboard/Timeline"
import Button from "@/components/ui/Button"
import ProfileEditor from "@/features/membership/components/ProfileEditor"
export default function Members({
  state,
  actor,
  feedback,
}: {
  state: WorkspaceState
  actor: Actor
  feedback: (message: string, error?: boolean) => void
}) {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("")
  const members = state.applications.filter(
    (a) =>
      a.stage === "Active" &&
      `${a.organisation} ${a.memberId}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const a = members.find((a) => a.id === selected)
  return (
    <>
      <PageHeader
        action={
          can(actor, "members.manage") ? (
            <PdfDownload
              actor={actor}
              request={
                a
                  ? { kind: "membership-summary", applicationId: a.id }
                  : { kind: "member-register", query }
              }
              label={
                a ? "Download member summary PDF" : "Download register PDF"
              }
            />
          ) : undefined
        }
        title="Member register"
        description="Membership standing, portal access and directory publication are tracked separately."
      />
      {a ? (
        <>
          <Button kind="ghost" onClick={() => setSelected("")}>
            ← Member register
          </Button>
          <h2>
            {a.organisation} · {a.memberId}
          </h2>
          <div className="workspace-panel">
            <h3>
              {can(actor, "members.manage")
                ? "Organisation & representatives"
                : "Billing details"}
            </h3>
            <dl className="workspace-record">
              {(can(actor, "members.manage")
                ? [
                    "registeredAddress",
                    "businessEmail",
                    "representativeName",
                    "representativeEmail",
                  ]
                : ["registeredAddress", "billingEmail"]
              ).map((key) => (
                <div key={key}>
                  <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd>{String(a.values[key] || "Not provided")}</dd>
                </div>
              ))}
            </dl>
            <h3>Membership history</h3>
            <p>
              {a.confirmedTier} · {a.periodStart} to {a.periodEnd}
            </p>
            <h3>Billing history</h3>
            {state.invoices
              .filter((i) => i.applicationId === a.id)
              .map((i) => (
                <p key={i.id}>
                  {i.id} · {i.currency} {i.amount.toLocaleString()} · {i.status}
                </p>
              ))}
          </div>
          {can(actor, "members.manage") && (
            <OrganisationDetailsEditor
              application={a}
              actor={actor}
              feedback={feedback}
              section="company"
              compact
            />
          )}
          {can(actor, "renewals.manage") && (
            <Button
              kind="secondary"
              onClick={() => {
                try {
                  membershipService.dispatch(actor, { type: "renew", id: a.id })
                  feedback("Renewal details confirmed.")
                } catch (error) {
                  feedback((error as Error).message, true)
                }
              }}
            >
              Confirm renewal details
            </Button>
          )}
          {can(actor, "directory.manage") && (
            <ProfileEditor application={a} actor={actor} feedback={feedback} />
          )}
          <section className="workspace-panel">
            <h2>Relevant audit history</h2>
            <Timeline items={a.activity} />
          </section>
        </>
      ) : (
        <section className="workspace-panel">
          <label className="field">
            Search members
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Organisation or member ID"
            />
          </label>
          <DataTable
            rows={members}
            label="Active member register"
            rowKey={(a) => a.id}
            columns={[
              {
                label: "Member ID",
                cell: (a) => a.memberId,
                sort: (a) => a.memberId!,
              },
              {
                label: "Organisation",
                cell: (a) => <strong>{a.organisation}</strong>,
                sort: (a) => a.organisation,
              },
              {
                label: "Tier",
                cell: (a) => a.confirmedTier,
                sort: (a) => a.confirmedTier || "",
              },
              {
                label: "Membership period",
                cell: (a) => `${a.periodStart} — ${a.periodEnd}`,
              },
              { label: "Standing", cell: (a) => a.standing },
              ...(can(actor, "directory.manage")
                ? [
                    {
                      label: "Directory visibility",
                      cell: (a: WorkspaceState["applications"][number]) => (
                        <StatusBadge
                          status={published(a) ? "Published" : "Not published"}
                        />
                      ),
                    },
                  ]
                : []),
              {
                label: "Actions",
                cell: (a) => (
                  <Button kind="ghost" onClick={() => setSelected(a.id)}>
                    Open member →
                  </Button>
                ),
              },
            ]}
          />
        </section>
      )}
    </>
  )
}
