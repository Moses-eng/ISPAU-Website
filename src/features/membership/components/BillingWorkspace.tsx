import PdfDownload from "@/components/dashboard/PdfDownload"
import { can } from "@/config/permissions"
import { useState } from "react"
import type { Actor, WorkspaceState } from "../types/workspace"
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
  const invoices = state.invoices
  const [selected, setSelected] = useState(selectedId || "")
  const invoice = invoices.find(
    (i) => i.applicationId === selected || i.id === selected,
  )
  const application =
    invoice && state.applications.find((a) => a.id === invoice.applicationId)
  return (
    <>
      <PageHeader
        action={
          can(actor, "billing.manage") ? (
            <PdfDownload
              actor={actor}
              request={{ kind: "report", sectionId: "finance" }}
              label="Download billing report PDF"
            />
          ) : undefined
        }
        title="Billing & activation"
        description="Application approval and payment confirmation are separate. There is no online payment checkout."
      />
      {!can(actor, "billing.manage") && (
        <p className="workspace-note">
          Payment confirmation is read-only. Finance manages invoices and
          confirms receipt.
        </p>
      )}
      {can(actor, "billing.manage") &&
        state.applications
          .filter((a) => selectedId === a.id)
          .map((a) => (
            <PdfDownload
              key={a.id}
              actor={actor}
              request={{ kind: "billing-statement", applicationId: a.id }}
              label="Download invoice statement PDF"
            />
          ))}
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
          {(actor.kind === "organisation" || can(actor, "billing.manage")) && (
            <PdfDownload
              actor={actor}
              request={{
                kind: "proforma",
                applicationId: application.id,
                invoiceId: invoice.id,
              }}
              label="Download proforma PDF"
            />
          )}
          {invoice.receipt &&
            (actor.kind === "organisation" || can(actor, "billing.manage")) && (
              <>
                <EvidencePreview file={invoice.receipt} />
                <PdfDownload
                  actor={actor}
                  request={{
                    kind: "receipt",
                    applicationId: application.id,
                    invoiceId: invoice.id,
                  }}
                  label="Download receipt (original)"
                />
              </>
            )}
          <h3 className="mt-6">Tax invoice</h3>
          {invoice.taxInvoice ? (
            <>
              <EvidencePreview file={invoice.taxInvoice} />
              <PdfDownload
                actor={actor}
                request={{
                  kind: "tax-invoice",
                  applicationId: application.id,
                  invoiceId: invoice.id,
                }}
                label="Download tax invoice (original)"
              />
            </>
          ) : (
            <p>Not yet uploaded by Finance.</p>
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
