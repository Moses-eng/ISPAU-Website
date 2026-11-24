import { useState, type ReactNode } from "react"
import { can } from "@/config/permissions"
import { membershipService } from "@/services/membershipService"
import { acceptFile } from "../services/files"
import type { Actor, WorkspaceState } from "../types/workspace"
import Button from "@/components/ui/Button"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import FormField from "@/components/dashboard/FormField"
import StatusBadge from "@/components/dashboard/StatusBadge"

type Props = {
  state: WorkspaceState
  actor: Actor
  feedback: (message: string, error?: boolean) => void
  onInvoice: (id: string) => void
  children: ReactNode
}

export default function FinanceRecords({
  state,
  actor,
  feedback,
  onInvoice,
  children,
}: Props) {
  const [view, setView] = useState("Invoices")
  const [issuing, setIssuing] = useState(false)
  const [applicant, setApplicant] = useState("")
  const [error, setError] = useState("")
  const [duration, setDuration] = useState("1")
  const [start, setStart] = useState("")
  const [annualFee, setAnnualFee] = useState("")
  const manage = can(actor, "billing.manage")
  const eligible = state.applications.filter(
    (application) =>
      ["Approved awaiting payment", "Active"].includes(application.stage) &&
      !state.invoices.some(
        (invoice) => invoice.applicationId === application.id,
      ),
  )
  const selected = eligible.find((application) => application.id === applicant)
  const years = Number(duration)
  const fee = selected?.approvedFee?.amount ?? Number(annualFee)
  const total = (Math.round(fee * 100) * years) / 100
  const endDate = new Date(start + "T00:00:00Z")
  endDate.setUTCDate(endDate.getUTCDate() + years * 365 - 1)
  const end =
    Number.isInteger(years) &&
    years > 0 &&
    Number.isFinite(endDate.getTime()) &&
    endDate.getUTCFullYear() <= 9999
      ? endDate.toISOString().slice(0, 10)
      : ""
  const organisation = (id: string) =>
    state.applications.find((application) => application.id === id)
      ?.organisation ?? id
  const payments = state.invoices.flatMap((invoice) =>
    (
      invoice.payments ??
      (invoice.paymentReference && invoice.paymentDate
        ? [
            {
              id: invoice.id + "-PAY-1",
              amount: invoice.amount,
              reference: invoice.paymentReference,
              paidAt: invoice.paymentDate,
              createdBy: "Legacy payment record",
              active: true,
              confirmedAt:
                invoice.status === "Confirmed"
                  ? (invoice.confirmedAt ?? "")
                  : undefined,
            },
          ]
        : [])
    ).map((payment) => ({ invoice, payment })),
  )
  const subscriptions = state.invoices.flatMap((invoice) =>
    invoice.subscription
      ? [{ invoice, subscription: invoice.subscription }]
      : [],
  )
  return (
    <>
      <nav className="workspace-actions" aria-label="Finance records">
        {["Invoices", "Payments", "Subscriptions"].map((name) => (
          <Button
            key={name}
            kind={view === name ? "primary" : "secondary"}
            aria-current={view === name ? "page" : undefined}
            onClick={() => setView(name)}
          >
            {name}
          </Button>
        ))}
      </nav>
      {view === "Invoices" && manage && (
        <div className="workspace-actions">
          <Button
            onClick={() => {
              setApplicant("")
              setError("")
              setDuration("1")
              setStart(new Date().toLocaleDateString("sv-SE"))
              setAnnualFee("")
              setIssuing(true)
            }}
          >
            Create invoice
          </Button>
        </div>
      )}
      {view === "Payments" && (
        <section className="workspace-panel">
          <h2>Payments</h2>
          {manage && (
            <label className="field">
              <span>Choose an invoice to record or confirm payment</span>
              <select
                value=""
                onChange={(event) => onInvoice(event.target.value)}
              >
                <option value="" disabled>
                  Select an outstanding invoice
                </option>
                {state.invoices
                  .filter(
                    (invoice) =>
                      invoice.active !== false &&
                      invoice.status !== "Confirmed",
                  )
                  .map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {organisation(invoice.applicationId)} · {invoice.id}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <DataTable
            rows={payments}
            label="Recorded payments"
            rowKey={({ payment }) => payment.id}
            columns={[
              {
                label: "Organisation",
                cell: ({ invoice }) => organisation(invoice.applicationId),
              },
              { label: "Invoice", cell: ({ invoice }) => invoice.id },
              {
                label: "Amount paid",
                cell: ({ invoice, payment }) =>
                  invoice.currency + " " + payment.amount.toLocaleString(),
              },
              { label: "Paid on", cell: ({ payment }) => payment.paidAt },
              { label: "Reference", cell: ({ payment }) => payment.reference },
              {
                label: "Recorded by",
                cell: ({ payment }) => payment.createdBy,
              },
              {
                label: "Period",
                cell: ({ invoice }) =>
                  invoice.periodStart + " – " + invoice.periodEnd,
              },
              {
                label: "Status",
                cell: ({ payment }) => (
                  <StatusBadge
                    status={
                      !payment.active
                        ? "Inactive"
                        : payment.confirmedAt !== undefined
                          ? "Confirmed"
                          : "Pending"
                    }
                  />
                ),
              },
              {
                label: "Actions",
                cell: ({ invoice }) => (
                  <Button kind="ghost" onClick={() => onInvoice(invoice.id)}>
                    View invoice
                  </Button>
                ),
              },
            ]}
          />
        </section>
      )}
      {view === "Subscriptions" && (
        <section className="workspace-panel">
          <h2>Subscriptions</h2>
          <p>
            Subscriptions are recorded when Finance confirms the payment that
            settles an invoice.
          </p>
          <DataTable
            rows={subscriptions}
            label="Membership subscriptions"
            rowKey={({ invoice }) => invoice.id}
            columns={[
              {
                label: "Organisation",
                cell: ({ invoice }) => organisation(invoice.applicationId),
              },
              {
                label: "Application",
                cell: ({ invoice }) => invoice.applicationId,
              },
              {
                label: "Payment",
                cell: ({ subscription }) => subscription.paymentId,
              },
              {
                label: "Payment confirmed",
                cell: ({ subscription }) =>
                  new Date(subscription.paymentConfirmedAt).toLocaleString(
                    "en-GB",
                  ),
              },
              {
                label: "Starts",
                cell: ({ subscription }) => subscription.startsAt,
              },
              {
                label: "Expires",
                cell: ({ subscription }) => subscription.expiresAt,
              },
            ]}
          />
        </section>
      )}
      {issuing && manage && (
        <Dialog
          title="Create membership invoice"
          onClose={() => setIssuing(false)}
        >
          {!eligible.length ? (
            <p>There are no approved applicants awaiting an invoice.</p>
          ) : (
            <form
              className="workspace-form"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                try {
                  const file = data.get("pdf")
                  if (!selected || !(file instanceof File) || !file.size)
                    throw Error("Choose an applicant and invoice PDF.")
                  membershipService.dispatch(actor, {
                    type: "issue-invoice",
                    id: selected.id,
                    amount: Number(data.get("total")),
                    currency: String(data.get("currency")),
                    active: data.get("status") === "Active",
                    periodStart: String(data.get("start")),
                    periodEnd: String(data.get("end")),
                    file: acceptFile(file, "membershipInvoice"),
                  })
                  setIssuing(false)
                  feedback("Membership invoice saved.")
                } catch (err) {
                  setError((err as Error).message)
                }
              }}
            >
              {error && (
                <p className="inline-error" role="alert">
                  {error}
                </p>
              )}
              <label className="field">
                <span>Applicant</span>
                <select
                  required
                  value={applicant}
                  onChange={(event) => {
                    setApplicant(event.target.value)
                    setAnnualFee("")
                  }}
                >
                  <option value="">Select an organisation</option>
                  {eligible.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.organisation} · {application.id}
                    </option>
                  ))}
                </select>
              </label>
              {selected && (
                <fieldset key={selected.id}>
                  <legend>Invoice details</legend>
                  {!selected.approvedFee && (
                    <label className="field">
                      <span>Annual membership fee</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={annualFee}
                        onChange={(event) => setAnnualFee(event.target.value)}
                      />
                    </label>
                  )}
                  <label className="field">
                    <span>Invoice total</span>
                    <input
                      name="total"
                      type="number"
                      readOnly
                      value={Number.isFinite(total) && total > 0 ? total : ""}
                    />
                  </label>
                  {selected.approvedFee ? (
                    <label className="field">
                      <span>Currency</span>
                      <input
                        name="currency"
                        readOnly
                        value={selected.approvedFee.currency}
                      />
                    </label>
                  ) : (
                    <FormField
                      label="Currency"
                      name="currency"
                      options={["USD", "UGX"]}
                      required
                      value="USD"
                    />
                  )}
                  <label className="field">
                    <span>Membership duration (years)</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Membership starts</span>
                    <input
                      name="start"
                      type="date"
                      required
                      value={start}
                      onChange={(event) => setStart(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Membership ends</span>
                    <input name="end" type="date" readOnly value={end} />
                  </label>
                  <FormField
                    label="Invoice status"
                    name="status"
                    options={["Active", "Inactive"]}
                    required
                    value="Active"
                  />
                  <label className="field">
                    <span>Invoice PDF · up to 10 MB</span>
                    <input
                      type="file"
                      name="pdf"
                      accept=".pdf,application/pdf"
                      required
                    />
                  </label>
                </fieldset>
              )}
              <div className="workspace-actions">
                <Button kind="secondary" onClick={() => setIssuing(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !selected || !end || !Number.isFinite(total) || total <= 0
                  }
                >
                  Save invoice
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      )}
      {view === "Invoices" && children}
    </>
  )
}
