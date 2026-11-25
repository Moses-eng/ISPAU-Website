import { useState, useEffect, type ReactNode } from "react"
import { can } from "@/config/permissions"
import type { Actor, WorkspaceState } from "../types/workspace"
import applicationService, { Application as ActiveApplication } from "@/apiServices/applicationService"
import invoiceService, { Invoice as DbInvoice } from "@/apiServices/invoiceService"
import paymentService, { Payment as DbPayment } from "@/apiServices/paymentService"
import subscriptionService, { type Subscription as DbSubscription } from "@/apiServices/subscriptionService"

import Button from "@/components/ui/Button"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import FormField from "@/components/dashboard/FormField"
import StatusBadge from "@/components/dashboard/StatusBadge"
import systemUserAuthStore from "@/apiServices/systemUserAuthStore"

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
  const [view, setView] = useState<"Invoices" | "Payments" | "Subscriptions">("Invoices")
  const manage = can(actor, "billing.manage")

  // ============================================================
  // 1. INVOICING STATE & ACTIVE APPLICANTS
  // ============================================================
  const [activeApps, setActiveApps] = useState<ActiveApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [applicant, setApplicant] = useState("")
  const [error, setError] = useState("")
  const [duration, setDuration] = useState("1")
  const [start, setStart] = useState("")
  const [annualFee, setAnnualFee] = useState("")
  const [invoiceDate, setInvoiceDate] = useState("")
  const [currency, setCurrency] = useState("USD")

  // Load Active & Approved applicants from database
  const loadActiveApplications = async () => {
    setLoadingApps(true)
    try {
      const res = await applicationService.list({ status: "Approved awaiting payment" })
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const eligible = res.data.filter(
          (app) => app.status === "Active" || app.status === "Approved awaiting payment",
        )
        setActiveApps(eligible.length > 0 ? eligible : res.data)
      }
    } catch (err) {
      console.error("Failed to load active applications from database", err)
    } finally {
      setLoadingApps(false)
    }
  }

  useEffect(() => {
    loadActiveApplications()
  }, [])

  // Auto-populate form inputs when selecting an active applicant
  const handleApplicantSelect = (selectedId: string) => {
    setApplicant(selectedId)
    const target = activeApps.find((app) => app.id === selectedId)

    if (!target) return

    const todayStr = new Date().toISOString().slice(0, 10)
    setInvoiceDate(todayStr)
    setStart(todayStr)
    setDuration("1")

    // Parse fee and currency from requested_tier (e.g., "Gold -- USD 900.00")
    let parsedFee = ""
    let parsedCurrency = "USD"

    if (target.requested_tier) {
      if (/UGX/i.test(target.requested_tier)) {
        parsedCurrency = "UGX"
      } else if (/USD/i.test(target.requested_tier)) {
        parsedCurrency = "USD"
      }

      const match = target.requested_tier.match(/(?:USD|UGX)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i)
      if (match && match[1]) {
        parsedFee = match[1].replace(/,/g, "")
      }
    }

    setAnnualFee(parsedFee || "500")
    setCurrency(parsedCurrency)
  }

  // Selected applicant object
  const selectedApp = activeApps.find((app) => app.id === applicant)

  // Calculations for dates and fee
  const years = Number(duration) || 1
  const fee = Number(annualFee) || 0
  const total = (Math.round(fee * 100) * years) / 100

  const calculateEndDate = (startDateStr: string, yearsCount: number) => {
    if (!startDateStr) return ""
    const d = new Date(startDateStr + "T00:00:00Z")
    d.setUTCDate(d.getUTCDate() + yearsCount * 365 - 1)
    return Number.isFinite(d.getTime()) && d.getUTCFullYear() <= 9999
      ? d.toISOString().slice(0, 10)
      : ""
  }

  const end = calculateEndDate(start, years)

  // Helper for organisation display
  const organisation = (id: string) => {
    const foundApp = activeApps.find((a) => a.id === id)
    if (foundApp) return foundApp.legal_name || foundApp.trading_name || id
    const stateApp = state.applications.find((a) => a.id === id)
    if (stateApp) return stateApp.organisation || id
    return id
  }

  // ============================================================
  // 2. LIVE PAYMENTS, INVOICES & SUBSCRIPTIONS
  // ============================================================
  const [dbPayments, setDbPayments] = useState<DbPayment[]>([])
  const [dbInvoices, setDbInvoices] = useState<DbInvoice[]>([])
  const [dbSubscriptions, setDbSubscriptions] = useState<DbSubscription[]>([])
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [paymentInvoiceId, setPaymentInvoiceId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentPeriod, setPaymentPeriod] = useState("")
  const [paymentError, setPaymentError] = useState("")

  const loadPaymentsAndInvoices = async () => {
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        paymentService.list(),
        invoiceService.list(),
      ])

      if (paymentsRes.success && Array.isArray(paymentsRes.data)) {
        setDbPayments(paymentsRes.data)
      }
      if (invoicesRes.success && Array.isArray(invoicesRes.data)) {
        setDbInvoices(invoicesRes.data)
      }
    } catch (err) {
      console.error("Failed to load live database payments or invoices", err)
    }
  }

  const loadSubscriptions = async () => {
    try {
      const res = await subscriptionService.list()
      if (res.success && Array.isArray(res.data)) {
        setDbSubscriptions(res.data)
      }
    } catch (err) {
      console.error("Failed to load live database subscriptions", err)
    }
  }

  useEffect(() => {
    if (view === "Payments" || view === "Invoices") {
      loadPaymentsAndInvoices()
    } else if (view === "Subscriptions") {
      loadSubscriptions()
    }
  }, [view])

  // Auto-populate fields when an invoice is chosen in Record Payment
  const handleSelectInvoiceForPayment = (invId: string) => {
    setPaymentInvoiceId(invId)
    const selectedInv = dbInvoices.find((i) => i.id === invId)
    if (selectedInv) {
      setPaymentAmount(String(selectedInv.total))
      if (selectedInv.membership_period) {
        setPaymentPeriod(selectedInv.membership_period)
      }
    }
  }

  // Create payment via paymentService
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentError("")

    const targetInvoice = dbInvoices.find((i) => i.id === paymentInvoiceId)
    if (!targetInvoice) {
      setPaymentError("Please select a valid invoice.")
      return
    }

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setPaymentError("Please specify a valid payment amount.")
      return
    }

    try {
      const res = await paymentService.create({
        invoice_id: targetInvoice.id,
        applicant_id: targetInvoice.applicant_id,
        amount: Number(paymentAmount),
        payment_reference: paymentReference || null,
        paid_at: paymentDate || new Date().toISOString().slice(0, 10),
        period: paymentPeriod || targetInvoice.membership_period || null,
        status: "active",
        created_by: systemUserAuthStore.getUserId(),
      })

      if (!res.success) {
        throw new Error(res.message || "Failed to record payment.")
      }

      feedback("Payment recorded successfully.")
      setRecordingPayment(false)
      loadPaymentsAndInvoices()
      loadSubscriptions()
    } catch (err) {
      setPaymentError((err as Error).message)
    }
  }

  // Database payment rows
  const paymentRows = dbPayments.length > 0
    ? dbPayments.map((p) => {
        const inv = dbInvoices.find((i) => i.id === p.invoice_id)
        return {
          id: p.payment_id,
          invoiceId: p.invoice_id,
          invoiceDisplay: (inv as any)?.invoice_number || p.invoice_id.slice(0, 8),
          applicantId: p.applicant_id,
          amount: Number(p.amount) || 0,
          paidAt: p.paid_at || "-",
          reference: p.payment_reference || "-",
          createdBy: p.created_by || "Finance Admin",
          period: p.period || inv?.membership_period || "-",
          status: p.status === "active" ? "Confirmed" : "Pending",
        }
      })
    : state.invoices.flatMap((invoice) =>
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
        ).map((payment) => ({
          id: payment.id,
          invoiceId: invoice.id,
          invoiceDisplay: invoice.id,
          applicantId: invoice.applicationId,
          amount: payment.amount,
          paidAt: payment.paidAt,
          reference: payment.reference,
          createdBy: payment.createdBy,
          period: invoice.periodStart + " – " + invoice.periodEnd,
          status: payment.confirmedAt !== undefined ? "Confirmed" : "Pending",
        })),
      )

  // ============================================================
  // 3. SUBSCRIPTIONS TAB (LIVE DATABASE DATA)
  // ============================================================
  const subscriptionRows = dbSubscriptions.length > 0
    ? dbSubscriptions.map((s) => ({
        id: s.id,
        organisation:
          (s as any).applicant_legal_name ||
          (s as any).applicant_name ||
          organisation(s.applicant_id),
        applicantEmail: (s as any).applicant_email || "",
        applicationNumber:
          (s as any).applicantion_number ||
          (s as any).application_number ||
          "—",
        paymentNumber:
          (s as any).payment_number ||
          (s as any).payment_no ||
          s.payment_id ||
          "—",
        confirmedAt: s.payment_confirmed_at
          ? new Date(s.payment_confirmed_at).toLocaleString("en-GB")
          : "—",
        startsAt: s.starts_at
          ? new Date(s.starts_at).toLocaleDateString("en-GB")
          : "—",
        expiresAt: s.ends_at
          ? new Date(s.ends_at).toLocaleDateString("en-GB")
          : "—",
        daysRemaining: s.days_remaining ?? 0,
        status: s.status === "active" ? "Confirmed" : "Pending",
      }))
    : state.invoices.flatMap((invoice) =>
        invoice.subscription
          ? [
              {
                id: invoice.subscription.paymentId || invoice.id,
                organisation: organisation(invoice.applicationId),
                applicantEmail: "",
                applicationNumber:
                  (activeApps.find((a) => a.id === invoice.applicationId) as any)
                    ?.application_number || invoice.applicationId,
                paymentNumber: invoice.subscription.paymentId,
                confirmedAt: new Date(
                  invoice.subscription.paymentConfirmedAt,
                ).toLocaleString("en-GB"),
                startsAt: invoice.subscription.startsAt,
                expiresAt: invoice.subscription.expiresAt,
                daysRemaining: 0,
                status: "Confirmed",
              },
            ]
          : [],
      )

  return (
    <>
      <nav className="workspace-actions" aria-label="Finance records">
        {(["Invoices", "Payments", "Subscriptions"] as const).map((name) => (
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

      {/* ==================== INVOICES TAB ==================== */}
      {view === "Invoices" && manage && (
        <div className="workspace-actions">
          <Button
            onClick={() => {
              loadActiveApplications()
              setApplicant("")
              setError("")
              setDuration("1")
              const todayStr = new Date().toISOString().slice(0, 10)
              setStart(todayStr)
              setInvoiceDate(todayStr)
              setAnnualFee("")
              setCurrency("USD")
              setIssuing(true)
            }}
          >
            Create invoice
          </Button>
        </div>
      )}

      {/* ==================== PAYMENTS TAB ==================== */}
      {view === "Payments" && (
        <section className="workspace-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Payments</h2>
            {manage && (
              <Button
                kind="primary"
                onClick={() => {
                  setPaymentError("")
                  setPaymentInvoiceId("")
                  setPaymentAmount("")
                  setPaymentReference("")
                  setPaymentDate(new Date().toISOString().slice(0, 10))
                  setPaymentPeriod("")
                  setRecordingPayment(true)
                }}
              >
                Record Payment
              </Button>
            )}
          </div>

          {manage && (
            <label className="field" style={{ marginTop: "1rem" }}>
              <span>Quick view: Choose an invoice to inspect</span>
              <select
                value=""
                onChange={(event) => onInvoice(event.target.value)}
              >
                <option value="" disabled>
                  Select an invoice to view details
                </option>
                {(dbInvoices.length > 0 ? dbInvoices : state.invoices)
                  .filter((inv) => (inv as any).payment_status !== "Confirmed" && (inv as any).status !== "Confirmed")
                  .map((inv) => {
                    const legalName =
                      (inv as any).applicant_legal_name ||
                      organisation((inv as any).applicant_id || (inv as any).applicationId) ||
                      "Applicant"
                    const appNumber =
                      (inv as any).applicantion_number ||
                      (inv as any).application_number ||
                      (inv as any).applicationId ||
                      "—"
                    const invoiceNumber = (inv as any).invoice_number || inv.id

                    return (
                      <option key={inv.id} value={inv.id}>
                        {legalName} - {appNumber} - {invoiceNumber}
                      </option>
                    )
                  })}
              </select>
            </label>
          )}
          <DataTable
            rows={paymentRows}
            label="Recorded payments"
            rowKey={(item) => item.id}
            columns={[
              {
                label: "Organisation",
                cell: (item) => organisation(item.applicantId),
              },
              { label: "Invoice", cell: (item) => item.invoiceDisplay },
              {
                label: "Amount paid",
                cell: (item) => currency + " " + item.amount.toLocaleString(),
              },
              { label: "Paid on", cell: (item) => item.paidAt },
              { label: "Reference", cell: (item) => item.reference },
              {
                label: "Recorded by",
                cell: (item) => item.createdBy,
              },
              {
                label: "Period",
                cell: (item) => item.period,
              },
              {
                label: "Status",
                cell: (item) => <StatusBadge status={item.status} />,
              },
              {
                label: "Actions",
                cell: (item) => (
                  <Button kind="ghost" onClick={() => onInvoice(item.invoiceId)}>
                    View invoice
                  </Button>
                ),
              },
            ]}
          />
        </section>
      )}

      {/* ==================== SUBSCRIPTIONS TAB ==================== */}
      {view === "Subscriptions" && (
        <section className="workspace-panel">
          <h2>Subscriptions</h2>
          <p>
            Subscriptions are recorded when Finance confirms the payment that
            settles an invoice.
          </p>
          <DataTable
            rows={subscriptionRows}
            label="Membership subscriptions"
            rowKey={(item) => item.id}
            columns={[
              {
                label: "Organisation",
                cell: (item) => (
                  <div>
                    <strong>{item.organisation}</strong>
                    {item.applicantEmail && (
                      <small style={{ display: "block", color: "#16734a" }}>
                        {item.applicantEmail}
                      </small>
                    )}
                  </div>
                ),
              },
              {
                label: "Application #",
                cell: (item) => item.applicationNumber,
              },
              {
                label: "Payment",
                cell: (item) => item.paymentNumber,
              },
              {
                label: "Payment confirmed",
                cell: (item) => item.confirmedAt,
              },
              {
                label: "Starts",
                cell: (item) => item.startsAt,
              },
              {
                label: "Expires",
                cell: (item) => (
                  <div>
                    <span>{item.expiresAt}</span>
                    {item.daysRemaining > 0 && (
                      <small style={{ display: "block", color: "var(--burgundy-primary, #650B23)" }}>
                        {item.daysRemaining} days left
                      </small>
                    )}
                  </div>
                ),
              },
              {
                label: "Status",
                cell: (item) => <StatusBadge status={item.status} />,
              },
            ]}
          />
        </section>
      )}

      {/* ==================== CREATE INVOICE DIALOG ==================== */}
      {issuing && manage && (
        <Dialog
          title="Create membership invoice"
          onClose={() => setIssuing(false)}
        >
          {loadingApps ? (
            <p>Loading active applicants...</p>
          ) : !activeApps.length ? (
            <p>There are no active applicants available for invoicing.</p>
          ) : (
            <form
              className="workspace-form"
              onSubmit={async (event) => {
                event.preventDefault()
                setError("")
                const data = new FormData(event.currentTarget)

                try {
                  const file = data.get("pdf")
                  if (!selectedApp) {
                    throw new Error("Please choose an applicant.")
                  }
                  if (!(file instanceof File) || !file.size) {
                    throw new Error("Please upload a valid invoice PDF.")
                  }

                  const res = await invoiceService.create({
                    applicant_id: selectedApp.id,
                    total: total,
                    invoice_date: invoiceDate || new Date().toISOString().slice(0, 10),
                    start_date: start || null,
                    end_date: end || null,
                    status: (data.get("status") as string)?.toLowerCase() === "active" ? "active" : "not active",
                    membership_period: `${years * 365} days`,
                    payment_status: "Pending",
                    confirmed_by: systemUserAuthStore.getUserId(),
                    invoice_pdf: file,
                  })

                  if (!res.success) {
                    throw new Error(res.message || "Failed to create invoice.")
                  }

                  setIssuing(false)
                  const appNum = (selectedApp as any).application_number
                  feedback(`Membership invoice for ${selectedApp.legal_name}${appNum ? ` (${appNum})` : ""} saved successfully.`)
                  loadPaymentsAndInvoices()
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
                <span>Active Applicant</span>
                <select
                  required
                  value={applicant}
                  onChange={(event) => handleApplicantSelect(event.target.value)}
                >
                  <option value="">Select an active organisation</option>
                  {activeApps.map((app) => {
                    const appNumber = (app as any).application_number || app.id.slice(0, 8)
                    return (
                      <option key={app.id} value={app.id}>
                        {app.legal_name || app.trading_name} · {appNumber} ({app.requested_tier || "Active"})
                      </option>
                    )
                  })}
                </select>
              </label>

              {selectedApp && (
                <fieldset key={selectedApp.id}>
                  <legend>
                    Invoice details · {(selectedApp as any).application_number || selectedApp.legal_name}
                  </legend>

                  <label className="field">
                    <span>Invoice Date</span>
                    <input
                      type="date"
                      required
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Annual membership fee</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={annualFee}
                      onChange={(event) => setAnnualFee(event.target.value)}
                      placeholder="e.g. 500"
                    />
                  </label>

                  <label className="field">
                    <span>Invoice total ({currency})</span>
                    <input
                      name="total"
                      type="number"
                      readOnly
                      value={Number.isFinite(total) && total > 0 ? total : ""}
                    />
                  </label>

                  <FormField
                    label="Currency"
                    name="currency"
                    options={["USD", "UGX"]}
                    required
                    value={currency}
                  />

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
                    options={["Active", "Not Active"]}
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
                    !selectedApp || !end || !Number.isFinite(total) || total <= 0
                  }
                >
                  Save invoice
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      )}

      {/* ==================== RECORD PAYMENT DIALOG ==================== */}
      {recordingPayment && manage && (
        <Dialog
          title="Record Payment"
          onClose={() => setRecordingPayment(false)}
        >
          <form className="workspace-form" onSubmit={handleRecordPayment}>
            {paymentError && (
              <p className="inline-error" role="alert">
                {paymentError}
              </p>
            )}

            <label className="field">
              <span>Select Invoice</span>
              <select
                required
                value={paymentInvoiceId}
                onChange={(e) => handleSelectInvoiceForPayment(e.target.value)}
              >
                <option value="">Choose an invoice</option>
                {dbInvoices.map((inv) => {
                  const legalName = (inv as any).applicant_legal_name || organisation(inv.applicant_id)
                  const appNumber = (inv as any).applicantion_number || (inv as any).application_number || ""
                  const invNumber = (inv as any).invoice_number || inv.id.slice(0, 8)
                  return (
                    <option key={inv.id} value={inv.id}>
                      {legalName} {appNumber ? `- ${appNumber}` : ""} - #{invNumber} (Total: {inv.total}) [{inv.payment_status}]
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="field">
              <span>Amount Paid</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount paid"
              />
            </label>

            <label className="field">
              <span>Payment Reference / Transaction ID</span>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. EFT-98234, Bank Slip #123"
              />
            </label>

            <label className="field">
              <span>Payment Date</span>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Membership Period / Note</span>
              <input
                type="text"
                value={paymentPeriod}
                onChange={(e) => setPaymentPeriod(e.target.value)}
                placeholder="e.g. 365 days / 2026-2027"
              />
            </label>

            <div className="workspace-actions">
              <Button kind="secondary" onClick={() => setRecordingPayment(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!paymentInvoiceId || !paymentAmount}>
                Confirm Payment
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Render children on Invoices tab */}
      {view === "Invoices" && children}
    </>
  )
}
