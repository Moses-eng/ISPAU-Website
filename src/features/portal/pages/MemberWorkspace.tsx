import MemberCompany from "./MemberCompany"
import MemberMembership from "./MemberMembership"
import TradeWorkspace from "@/features/trade-credit/workspace/TradeWorkspace"
import MemberOverview from "./MemberOverview"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"

import PageHeader from "@/components/dashboard/PageHeader"
import EmptyState from "@/components/dashboard/EmptyState"

import BillingWorkspace from "@/features/membership/components/BillingWorkspace"
import EvidencePreview from "@/components/dashboard/EvidencePreview"

export default function MemberWorkspace({
  state,
  actor,
  route,
  navigate,
  feedback,
}: {
  state: WorkspaceState
  actor: Actor
  route: string
  navigate: (route: string) => void
  feedback: (message: string, error?: boolean) => void
}) {
  const a = state.applications.find(
    (a) => a.organisationId === actor.organisationId && a.portalAccess,
  )

  if (!a || actor.kind !== "organisation")
    return (
      <EmptyState
        title="Access denied"
        text="Your organisation record is unavailable. Contact the Secretariat if access is required."
      />
    )
  const [section, recordId] = route.split("/")
  if (recordId && recordId !== a.id)
    return (
      <EmptyState
        title="Access denied"
        text="You can only access your own organisation's record."
      />
    )
  const active = a.stage === "Active",
    invoice = state.invoices.find((i) => i.applicationId === a.id)
  if (section === "trade-credit")
    return <TradeWorkspace actor={actor} membership={state} />
  if (!active && section === "invoices")
    return <BillingWorkspace state={state} actor={actor} feedback={feedback} />
  if (!active && !["overview", "application", "account"].includes(section))
    return (
      <EmptyState
        title="Available after activation"
        text="Organisation, directory and renewal tools become available after your membership is activated."
      />
    )
  if (
    ["company", "organisation", "representatives", "profile"].includes(section)
  )
    return (
      <MemberCompany
        application={a}
        actor={actor}
        section={section}
        navigate={navigate}
        feedback={feedback}
      />
    )
  if (["membership", "invoices", "renewal"].includes(section))
    return (
      <MemberMembership
        application={a}
        actor={actor}
        state={state}
        section={section}
        navigate={navigate}
        feedback={feedback}
      />
    )
  if (section === "account")
    return (
      <>
        <PageHeader
          title="Account"
          description="One organisation identity for your application and active membership."
        />
        <section className="workspace-panel">
          <h2>{actor.name}</h2>
          <p>Organisation: {a.organisation}</p>
          <p>Portal access: {a.portalAccess ? "Enabled" : "Restricted"}</p>
          <p>
            Trade Credit:{" "}
            {a.tradeCreditAccess?.enabled
              ? "Provisioned by ISPAU"
              : "ISPAU provisioning required"}
            .
          </p>
          <p>
            Every participating ISP has the same tools. Access is scoped to your
            organisation, not increased by membership tier. Staff verification,
            payment confirmation, other ISPs' private cases and search logs are
            unavailable to ISP accounts.
          </p>
          <p>
            Contact the Secretariat for help with your account or access
            permissions.
          </p>
        </section>
      </>
    )
  if (section === "application")
    return (
      <>
        <PageHeader
          title="Your application record"
          description={`${a.id} · ${a.stage}`}
        />
        <section className="workspace-panel">
          <dl className="workspace-record">
            {Object.entries(a.values).map(([key, value]) => (
              <div key={key}>
                <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
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
          {a.evidence.map((f) => (
            <EvidencePreview key={f.id} file={f} />
          ))}
        </section>
      </>
    )
  if (section !== "overview")
    return (
      <EmptyState
        title="Page unavailable"
        text="Choose an available page from your organisation navigation."
      />
    )
  return (
    <MemberOverview
      application={a}
      actor={actor}
      feedback={feedback}
      navigate={navigate}
      state={state}
    />
  )
}
