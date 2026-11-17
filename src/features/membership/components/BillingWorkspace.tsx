import { useState } from "react"
import type { Actor, WorkspaceState, Invoice } from "../types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Dialog from "@/components/dashboard/Dialog"
import EvidencePreview from "@/components/dashboard/EvidencePreview"
import Button from "@/components/ui/Button"
import WorkflowActions from "./WorkflowActions"
export default function BillingWorkspace({
  state,
  actor,
  feedback,
  selectedId,
}: {
  state: WorkspaceState
  actor: Actor
  feedback: (message: string, error?: boolean) => void
  selectedId?: string
}) {
  const invoices = state.invoices.filter(
    (i) =>
      actor.kind === "staff" ||
      state.applications.find((a) => a.id === i.applicationId)
        ?.organisationId === actor.organisationId,
  )
  const [selected, setSelected] = useState(selectedId || "")
  const invoice = invoices.find(
    (i) => i.applicationId === selected || i.id === selected,
  )
  const application =
    invoice && state.applications.find((a) => a.id === invoice.applicationId)
  const download = (item: Invoice) => {
    const a = state.applications.find((a) => a.id === item.applicationId)!
    const text = `NON-TAX PROFORMA — PREVIEW\n${item.id}\nOrganisation: ${a.organisation}\nApproved tier: ${a.confirmedTier}\nAmount: ${item.currency} ${item.amount.toLocaleString()}\nPeriod: ${item.periodStart} to ${item.periodEnd}\nPreview copy. Contact ISPAU for payment instructions.`
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `${item.id}-non-tax-proforma.txt`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <>
      <PageHeader
        title={
          actor.kind === "staff" ? "Billing & activation" : "Your invoices"
        }
        description="Application approval and payment confirmation are separate. There is no online payment checkout."
      />
      <div className="workspace-note">
        Review the invoice amount, currency and membership period. Contact ISPAU
        for payment instructions.
      </div>
      <section className="workspace-panel">
        <DataTable
          rows={invoices}
          label="Membership invoices"
          rowKey={(i) => i.id}
          columns={[
            {
              label: "Organisation",
              cell: (i) => (
                <strong>
                  {
                    state.applications.find((a) => a.id === i.applicationId)
                      ?.organisation
                  }
                </strong>
              ),
              sort: (i) =>
                state.applications.find((a) => a.id === i.applicationId)
                  ?.organisation || "",
            },
            { label: "Invoice", cell: (i) => i.id, sort: (i) => i.id },
            {
              label: "Approved fee",
              cell: (i) => `${i.currency} ${i.amount.toLocaleString()}`,
              sort: (i) => i.amount,
            },
            {
              label: "Period",
              cell: (i) => `${i.periodStart} — ${i.periodEnd}`,
            },
            {
              label: "Payment",
              cell: (i) => <StatusBadge status={i.status} />,
              sort: (i) => i.status,
            },
            {
              label: "Actions",
              cell: (i) => (
                <Button kind="ghost" onClick={() => setSelected(i.id)}>
                  View invoice →
                </Button>
              ),
            },
          ]}
        />
      </section>
      {invoice && application && (
        <Dialog title={invoice.id} onClose={() => setSelected("")}>
          <h3>{application.organisation}</h3>
          <dl className="workspace-record">
            <div>
              <dt>Application stage</dt>
              <dd>
                <StatusBadge status={application.stage} />
              </dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd>
                <StatusBadge status={invoice.status} />
              </dd>
            </div>
            <div>
              <dt>Approved fee</dt>
              <dd>
                {invoice.currency} {invoice.amount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt>Membership period</dt>
              <dd>
                {invoice.periodStart} to {invoice.periodEnd}
              </dd>
            </div>
            <div>
              <dt>Payment reference</dt>
              <dd>{invoice.paymentReference || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Confirmed by Accounts</dt>
              <dd>{invoice.confirmedBy || "Not confirmed"}</dd>
            </div>
          </dl>
          <Button kind="secondary" onClick={() => download(invoice)}>
            Download non-tax proforma
          </Button>
          {invoice.receipt && <EvidencePreview file={invoice.receipt} />}
          <h3 className="mt-6">Tax invoice</h3>
          {invoice.taxInvoice ? (
            <EvidencePreview file={invoice.taxInvoice} />
          ) : (
            <p>Not yet uploaded by the authorised Secretariat role.</p>
          )}
          <WorkflowActions
            application={application}
            invoice={invoice}
            actor={actor}
            feedback={feedback}
          />
          <p className="workspace-help">
            Uploading a receipt never activates membership. Accounts must
            confirm payment, then the membership team can activate after
            admission approval.
          </p>
        </Dialog>
      )}
    </>
  )
}
