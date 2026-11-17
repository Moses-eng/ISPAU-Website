// src/features/portal/pages/MemberOverview.tsx

import type { LiveApplication } from "@/apiServices/webAplicatService"
import PageHeader from "@/components/dashboard/PageHeader"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/dashboard/StatusBadge"

interface MemberOverviewProps {
  application: LiveApplication
  onNavigate: (route: string) => void
  onRefresh: () => Promise<void>
}

export default function MemberOverview({
  application: app,
  onNavigate,
  onRefresh,
}: MemberOverviewProps) {
  const active = app.status === "Active"
  const legalName = app.legal_name || app.legalName || "Your Organisation"
  const tier = app.requested_tier || app.requestedTier || "ISP Member"
  const updatedAt = app.updated_at || app.updatedAt || app.created_at || ""
  const clarifications = app.clarifications || []

  return (
    <>
      <PageHeader
        title={active ? "Your ISPAU Membership" : "Your Membership Application"}
        description={legalName}
        action={
          <div className="flex gap-2">
            <Button kind="secondary" onClick={() => void onRefresh()}>
              Refresh status
            </Button>
            {active ? (
              <Button onClick={() => onNavigate("company")}>
                Update organisation details
              </Button>
            ) : app.status === "Draft" ? (
              <Button onClick={() => onNavigate("application")}>
                Continue Application
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="workspace-member-banner">
        <div>
          <StatusBadge status={app.status} />
          <h2 className="mt-2 text-xl font-bold">{legalName}</h2>
          <p className="text-sm text-neutral-600">
            {active ? `Membership tier: ${tier}` : `Requested tier: ${tier}`}
          </p>
        </div>
        <dl>
          <dt>Application ID</dt>
          <dd className="font-mono text-xs">{app.id}</dd>
          <dt>Last update</dt>
          <dd>
            {updatedAt ? new Date(updatedAt).toLocaleString("en-GB") : "Recently"}
          </dd>
          <dt>Official contact</dt>
          <dd>{app.business_email || app.businessEmail}</dd>
        </dl>
      </div>

      <section className="workspace-panel">
        <h2>Next required action</h2>
        <p>
          {
            (
              {
                Draft:
                  "Complete your saved draft application and upload all required documents to submit for verification.",
                Submitted:
                  "Your application has been received into our database. The ISPAU Secretariat will begin document review; no action is needed at this time.",
                "Under review":
                  "The membership team is actively reviewing your regulatory details and company documents.",
                "Clarification needed":
                  "Clarifications have been requested. Review the requests below and update your application details.",
                "Decision pending":
                  "Verification is complete. Your application is before the executive board for admission approval.",
                "Approved awaiting payment":
                  "Your application has been approved! Prepare your proforma invoice payment to finalize activation.",
                Active:
                  "Your membership is active and in good standing with ISPAU.",
                Deferred:
                  "Your application was deferred. Please contact the Secretariat for guidance.",
                Declined:
                  "Your application has been declined. Please reach out to ISPAU support.",
              } as Record<string, string>
            )[app.status] || "Your application is being processed."
          }
        </p>

        {["Deferred", "Declined"].includes(app.status) && (
          <div className="mt-4">
            <a
              href="mailto:membership@ispau.ug"
              className="font-medium text-brand hover:underline"
            >
              Contact the Secretariat at membership@ispau.ug →
            </a>
          </div>
        )}

        {clarifications.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3>Clarification requests</h3>
            {clarifications.map((c) => (
              <div key={c.id} className="workspace-history">
                <strong>
                  Request dated{" "}
                  {c.created_at || c.date
                    ? new Date(c.created_at || c.date || "").toLocaleDateString("en-GB")
                    : ""}
                </strong>
                {Array.isArray(c.items) && (
                  <ul className="mt-2 list-disc pl-5">
                    {c.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-sm">
                  {c.response
                    ? `Submitted response: ${c.response}`
                    : "Awaiting your response."}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="workspace-review-grid">
        <section className="workspace-panel">
          <h2>Application summary</h2>
          <dl className="workspace-record">
            <div>
              <dt>Registration reference</dt>
              <dd>{app.registration_reference || app.registrationReference || "—"}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{app.category || "General ISP"}</dd>
            </div>
            <div>
              <dt>Customer facing</dt>
              <dd>{app.customer_facing || app.customerFacing || "No"}</dd>
            </div>
            <div>
              <dt>PDPO compliance</dt>
              <dd>{app.pdpo_status || app.pdpoStatus || "Pending"}</dd>
            </div>
          </dl>
        </section>

        <section className="workspace-panel">
          <h2>Representative & billing</h2>
          <dl className="workspace-record">
            <div>
              <dt>Designated representative</dt>
              <dd>{app.representative_name || app.representativeName || "—"}</dd>
            </div>
            <div>
              <dt>Representative email</dt>
              <dd>{app.representative_email || app.representativeEmail || "—"}</dd>
            </div>
            <div>
              <dt>Billing email</dt>
              <dd>{app.billing_email || app.billingEmail || "—"}</dd>
            </div>
            <div>
              <dt>Billing contact</dt>
              <dd>{app.billing_contact || app.billingContact || "—"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  )
}
