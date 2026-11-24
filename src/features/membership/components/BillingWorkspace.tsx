import { useCallback, useEffect, useState } from "react"
import PdfDownload from "@/components/dashboard/PdfDownload"
import { can } from "@/config/permissions"
import type { Actor, Application, Invoice, WorkspaceState } from "../types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Dialog from "@/components/dashboard/Dialog"
import EvidencePreview from "@/components/dashboard/EvidencePreview"
import Button from "@/components/ui/Button"
import WorkflowActions from "./WorkflowActions"
import invoiceService, { type Invoice as ApiInvoice } from "@/apiServices/invoiceService"
import FinanceRecords from "./FinanceRecords"

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
  const [invoices, setInvoices] = useState<Invoice[]>(state.invoices || [])
  const [selected, setSelected] = useState(selectedId || "")

  // ------------------------------------------------------------------
  // Load invoice data from database via invoiceService
  // ------------------------------------------------------------------
  const loadInvoices = useCallback(async () => {
    try {
      const res = await invoiceService.list()
      if (res.success && Array.isArray(res.data)) {
        const mapped: Invoice[] = res.data.map(
          (item: ApiInvoice & { applicant_legal_name?: string; confirmed_by_name?: string }) => {
            const app = state.applications.find((a) => a.id === item.applicant_id)
            return {
              id: item.id,
              applicationId: item.applicant_id,
              amount: Number(item.total) || 0,
              currency: app?.approvedFee?.currency || "UGX",
              periodStart: item.start_date || "",
              periodEnd: item.end_date || "",
              status:
                item.payment_status === "Confirmed"
                  ? "Confirmed"
                  : "Awaiting payment",
              active: item.status === "active",
              paymentReference: (item as any).payment_reference || "",
              paymentDate: item.invoice_date || "",
              confirmedBy: item.confirmed_by_name || item.confirmed_by || "",
              taxInvoice: item.invoice_pdf
                ? {
                    id: item.invoice_pdf,
                    name: item.invoice_pdf.split("/").pop() || "invoice.pdf",
                    size: 0,
                    type: "application/pdf",
                    category: "Tax invoice",
                  }
                : undefined,
              ...({
                invoiceNumber: item.invoice_number,
                organisationName: item.applicant_legal_name || app?.organisation || "",
              } as any),
            }
          },
        )
        setInvoices(mapped)
      }
    } catch {
      // Keep existing state.invoices on network or request failure
    }
  }, [state.applications])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  useEffect(() => {
    if (selectedId) setSelected(selectedId)
  }, [selectedId])

  const invoice = invoices.find(
    (i) => i.applicationId === selected || i.id === selected,
  )

  const application =
    invoice &&
    (state.applications.find((a) => a.id === invoice.applicationId) ||
      ({
        id: invoice.applicationId,
        organisation: (invoice as any).organisationName || "Applicant",
        stage: invoice.status === "Confirmed" ? "Active" : "Decision pending",
        requestedTier: "Ordinary",
        decisions: [],
        verifications: [],
        clarifications: [],
        evidence: [],
        activity: [],
        values: {},
      } as unknown as Application))

  const handleFeedback = (message: string, isError?: boolean) => {
    feedback(message, isError)
    if (!isError) {
      loadInvoices()
    }
  }

  return (
    <>
      <PageHeader
        action={
          can(actor, "billing.manage") ? (
            <PdfDownload
              request={{ applicationId: "a.id", legalName: "organisation" }}
              label="Download application summary PDF"
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

      {/* Finance tabs: Invoices, Payments, and Subscriptions */}
      <FinanceRecords
        state={state}
        actor={actor}
        feedback={handleFeedback}
        onInvoice={setSelected}
      >
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
                        ?.organisation || (i as any).organisationName || ""
                    }
                  </strong>
                ),
                sort: (i) =>
                  state.applications.find((a) => a.id === i.applicationId)
                    ?.organisation || (i as any).organisationName || "",
              },
              {
                label: "Record status",
                cell: (i) => (
                  <StatusBadge
                    status={i.active === false ? "Inactive" : "Active"}
                  />
                ),
              },
              {
                label: "Invoice",
                cell: (i) => (i as any).invoiceNumber || i.id,
                sort: (i) => (i as any).invoiceNumber || i.id,
              },
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
      </FinanceRecords>

      {/* Invoice Details Dialog */}
      {invoice && application && (
        <Dialog
          title={(invoice as any).invoiceNumber || invoice.id}
          onClose={() => setSelected("")}
        >
          <h3>{application.organisation}</h3>
          {(invoice as any).issuedBy && <p>Issued by {(invoice as any).issuedBy}</p>}
          {(invoice as any).invoicePdf && <EvidencePreview file={(invoice as any).invoicePdf} />}
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
            feedback={handleFeedback}
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


