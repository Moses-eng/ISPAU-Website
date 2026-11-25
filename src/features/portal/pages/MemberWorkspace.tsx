import { applicationAnswers, publishPortalApplication, useApplicantPortal } from "../services/useApplicantPortal"
import ApplicationReviewSummary from "@/features/membership/components/ApplicationReviewSummary"
import { applicationSectionNames } from "@/features/membership/data/applicationSectionNames"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import { BASE_URL } from "@/apiServices/env"
// src/features/portal/pages/MemberWorkspace.tsx

import { useEffect, useState, useCallback, type FormEvent } from "react"
import webAplicatService, {
  type LiveApplication,
} from "@/apiServices/webAplicatService"
import authStore from "@/apiServices/authStore"
import MemberOverview from "./MemberOverview"
import MemberCompany from "./MemberCompany"
import PageHeader from "@/components/dashboard/PageHeader"
import EmptyState from "@/components/dashboard/EmptyState"
import Button from "@/components/ui/Button"
// 1. IMPORT NOTIFICATIONS
import Notifications from "@/components/dashboard/Notifications"

interface MemberWorkspaceProps {
  route?: string
  navigate?: (route: string) => void
  feedback?: (message: string, error?: boolean) => void
  state?: unknown
  actor?: unknown
}

export default function MemberWorkspace({
  route = "overview",
  navigate = () => {},
  feedback,
}: MemberWorkspaceProps) {
  const portal = useApplicantPortal()
  const [application, setApplication] = useState<LiveApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localNotice, setLocalNotice] = useState<{
    text: string
    error?: boolean
  } | null>(null)

  const showFeedback = useCallback(
    (message: string, isError = false) => {
      if (feedback) {
        feedback(message, isError)
      } else {
        setLocalNotice({ text: message, error: isError })
      }
    },
    [feedback],
  )

  // 1. Fetch the live authenticated applicant record from MySQL/database
  const loadLiveApplication = useCallback(async (quiet = false) => {
    if (!authStore.isAuthenticated()) {
      setLoading(false)
      setError("Please sign in to view your application.")
      return
    }

    if (!quiet) setLoading(true)
    setError(null)

    const owner = authStore.getUserId() || ""
    const res = await webAplicatService.getProfile()
    if (authStore.getUserId() !== owner) return
    setLoading(false)

    if (res.success && res.data?.application) {
      setApplication(res.data.application)
      publishPortalApplication(owner, res.data.application, res.data)
    } else {
      if (quiet) setLocalNotice({ text: res.message || "Could not refresh the application.", error: true })
      else setError(
        res.message ||
          "Could not retrieve your application record. Please verify your connection or sign in again.",
      )
    }
  }, [])

  useEffect(() => {
    void loadLiveApplication()
  }, [loadLiveApplication])

  // Loading State
  if (loading) {
    return (
      <div className="workspace-panel" role="status" aria-busy="true">
        <span
          className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm text-neutral-600">
          Loading your application record from the database…
        </p>
      </div>
    )
  }

  // Error State
  if (error || !application) {
    return (
      <main className="workspace-panel">
        <EmptyState
          title="Application unavailable"
          text={error || "Your organisation record could not be loaded."}
          action={
            <div className="flex gap-2">
              <Button onClick={() => void loadLiveApplication()}>Retry</Button>
              <Button kind="secondary" onClick={() => void webAplicatService.logout()}>
                Sign out
              </Button>
            </div>
          }
        />
      </main>
    )
  }

  const section = route.split(/[/?]/)[0] || "overview"
  const { values, evidence } = applicationAnswers(application)
  const reviewFields: string[][] = [[], [], Object.keys(values).filter((name) => /^licence(?:Type|Status|Number|Holder)\d+$/.test(name)), [], [], [...new Set(["registrationEvidence", "authorityEvidence", ...evidence.map((file) => file.category)])], []]
  const legalName = application.legal_name || application.legalName || "Organisation"
  const applicationNumber =
    (application as any).application_number ||
    (application as any).applicationNumber ||
    application.registration_reference ||
    application.id

  return (
    <div className="workspace-content">
      {localNotice && (
        <div
          role={localNotice.error ? "alert" : "status"}
          className={`workspace-feedback mb-4 ${localNotice.error ? "error" : ""}`}
        >
          {localNotice.text}
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={() => setLocalNotice(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Routes & Sub-views */}
      {section === "notifications" ? (
        <Notifications go={navigate} />
      ) : ["company", "organisation", "representatives", "profile"].includes(section) ? (
        <MemberCompany
          application={application}
          section={section}
          onNavigate={navigate}
          onUpdated={(updated) => { setApplication(updated); publishPortalApplication(portal.owner, updated) }}
          onFeedback={showFeedback}
        />
      ) : section === "invoices" ? (
        <ApplicantInvoices route={route} onNavigate={navigate} onRefresh={() => loadLiveApplication(true)} />
      ) : section === "account" ? (
        <>
          <PageHeader
            title="Organisation Account"
            description="Manage your ISPAU portal account and verified access."
          />
          <section className="workspace-panel">
            <h2>{legalName}</h2>
            <dl className="workspace-record mt-4">
              <div>
                <dt>Application number</dt>
                <dd className="font-mono text-sm font-bold text-neutral-800">
                  {applicationNumber}
                </dd>
              </div>
              <div>
                <dt>Business email</dt>
                <dd>{application.business_email || application.businessEmail}</dd>
              </div>
              <div>
                <dt>Applicant contact</dt>
                <dd>
                  {application.applicant_name || application.applicantName} (
                  {application.applicant_phone || application.applicantPhone})
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd className="font-semibold text-brand">{application.status}</dd>
              </div>
            </dl>
          </section>
        </>
      ) : section === "application" ? (
        <>
          <PageHeader
            title="Application Details"
            description={`Application Number: ${applicationNumber}`}
          />
          <ApplicationReviewSummary sections={applicationSectionNames} fields={reviewFields} values={values} evidence={evidence} />
        </>
      ) : (
        <MemberOverview
          application={application}
          onNavigate={navigate}
          onRefresh={loadLiveApplication}
        />
      )}
    </div>
  )
}

// The ISP invoice view uses real profile records and the existing authenticated
// uploadReceipt(invoiceId, file). It never dispatches demo payments or confirms membership.
function ApplicantInvoices({ route, onNavigate, onRefresh }: { route: string; onNavigate: (route: string) => void; onRefresh: () => Promise<void> }) {
  const portal = useApplicantPortal()
  const [selected, setSelected] = useState(new URLSearchParams(route.split("?")[1]).get("invoice") || "")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const selectedParam = new URLSearchParams(route.split("?")[1]).get("invoice") || ""
  useEffect(() => { setSelected(selectedParam); setFile(null); setError(""); setMessage("") }, [selectedParam])
  const invoice = portal.invoices.find((item) => item.id === selected)
  useEffect(() => {
    if (invoice) void portal.openInvoice(invoice).catch((error: Error) => setError(error.message))
  }, [invoice?.id, portal.owner])
  const pdfUrl = (value: string) => {
    try { const url = new URL(value, BASE_URL.replace(/\/?$/, "/")); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "" } catch { return "" }
  }
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!invoice || !file || busy) return
    if (!/\.pdf$/i.test(file.name) || file.type !== "application/pdf" || !file.size || file.size > 10 * 1024 * 1024) { setError("Choose a PDF receipt up to 10 MB."); return }
    const owner = portal.owner, invoiceId = invoice.id
    setBusy(true); setError(""); setMessage("")
    try {
      const response = await webAplicatService.uploadReceipt(invoiceId, file)
      if (authStore.getUserId() !== owner) return
      if (!response.success) throw Error(response.message || "Receipt upload failed. Please try again.")
      setMessage(`${response.message || "Receipt uploaded."} Finance will review it; upload alone does not confirm payment or activate membership.`)
      setFile(null)
      form.reset()
      await onRefresh()
    } catch (error) { setError((error as Error).message || "Could not upload the receipt.") }
    finally { setBusy(false) }
  }
  return <>
    <PageHeader title="Your invoices" description="View your invoice and upload payment evidence for Finance to review." />
    <section className="workspace-panel">
      {portal.invoices.length ? <DataTable rows={portal.invoices} rowKey={(invoice) => invoice.id} label="Your membership invoices" columns={[
        { label: "Invoice", cell: (invoice) => <>{invoice.id}{portal.invoiceUnread(invoice) && <small className="block">Unread</small>}</> },
        { label: "Amount", cell: (invoice) => [invoice.currency, invoice.total].filter(Boolean).join(" ") || "Not provided" },
        { label: "Membership period", cell: (invoice) => invoice.period || "Not provided" },
        { label: "Payment status", cell: (invoice) => invoice.payment },
        { label: "Action", cell: (invoice) => <Button kind="ghost" onClick={() => { setSelected(invoice.id); setFile(null); setError(""); setMessage("") }}>View invoice</Button> },
      ]} /> : <p>No invoices are available in your account yet. Contact ISPAU if you are expecting an invoice.</p>}
    </section>
    {invoice && <Dialog title={`Invoice ${invoice.id}`} onClose={() => { if (busy) return; setSelected(""); setFile(null); onNavigate("invoices") }}>
      <dl className="workspace-record">
        <div><dt>Amount</dt><dd>{[invoice.currency, invoice.total].filter(Boolean).join(" ") || "Not provided"}</dd></div>
        <div><dt>Membership period</dt><dd>{invoice.period || "Not provided"}</dd></div>
        <div><dt>Payment status</dt><dd>{invoice.payment}</dd></div>
      </dl>
      {invoice.pdf && pdfUrl(invoice.pdf) ? <a className="btn btn-secondary" href={pdfUrl(invoice.pdf)} target="_blank" rel="noopener noreferrer">Open invoice PDF</a> : <p>Invoice PDF not available.</p>}
      {error && <p role="alert" className="workspace-feedback error">{error}</p>}
      {message && <p role="status" className="workspace-feedback">{message}</p>}
      {!/^(confirmed|paid)$/i.test(invoice.payment) && <form onSubmit={(event) => void upload(event)} className="mt-6">
        <h3>Submit payment receipt</h3>
        <label className="field"><span>Receipt PDF (up to 10 MB)</span><input key={invoice.id} type="file" accept="application/pdf,.pdf" required disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] || null); setError(""); setMessage("") }} /></label>
        <Button type="submit" disabled={busy || !file}>{busy ? "Uploading receipt…" : "Submit receipt"}</Button>
      </form>}
    </Dialog>}
  </>
}
