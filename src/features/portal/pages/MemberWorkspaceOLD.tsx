// src/features/portal/pages/MemberWorkspace.tsx

import { useEffect, useState, useCallback } from "react"
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
  const loadLiveApplication = useCallback(async () => {
    if (!authStore.isAuthenticated()) {
      setLoading(false)
      setError("Please sign in to view your application.")
      return
    }

    setLoading(true)
    setError(null)

    const res = await webAplicatService.getProfile()
    setLoading(false)

    if (res.success && res.data?.application) {
      setApplication(res.data.application)
    } else {
      setError(
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

  const section = route.split("/")[0] || "overview"
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
          onUpdated={(updated) => setApplication(updated)}
          onFeedback={showFeedback}
        />
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
          <section className="workspace-panel">
            <dl className="workspace-record">
              <div>
                <dt>Application number</dt>
                <dd className="font-mono font-bold text-neutral-800">
                  {applicationNumber}
                </dd>
              </div>
              <div>
                <dt>Legal entity name</dt>
                <dd>{application.legal_name || application.legalName || "—"}</dd>
              </div>
              <div>
                <dt>Trading name</dt>
                <dd>{application.trading_name || application.tradingName || "—"}</dd>
              </div>
              <div>
                <dt>Entity type</dt>
                <dd>{application.entity_type || application.entityType || "—"}</dd>
              </div>
              <div>
                <dt>Country of registration</dt>
                <dd>
                  {application.registration_country ||
                    application.registrationCountry ||
                    "Uganda"}
                </dd>
              </div>
              <div>
                <dt>Registration reference</dt>
                <dd>
                  {application.registration_reference ||
                    application.registrationReference ||
                    "—"}
                </dd>
              </div>
              <div>
                <dt>Registered address</dt>
                <dd>
                  {application.registered_address ||
                    application.registeredAddress ||
                    "—"}
                </dd>
              </div>
            </dl>
          </section>
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
