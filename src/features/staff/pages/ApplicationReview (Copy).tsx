import { useEffect, useState, useMemo } from "react"
import PdfDownload from "@/components/dashboard/PdfDownload"
import type {
  Actor,
  Application as WorkspaceApplication,
  FileRecord,
  StaffRole,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Timeline from "@/components/dashboard/Timeline"
import EvidencePreview from "@/components/dashboard/EvidencePreview"
import WorkflowActions from "@/features/membership/components/WorkflowActions"
import { verificationLabels } from "@/config/workspace"
import { membershipFormSchema } from "@/features/membership/data/membershipFormSchema"
import applicationService, {
  type Application as BackendApplication,
  type ApplicationStatus,
  type Reviewer as BackendReviewer,
  type Clarification as BackendClarification,
  type Verification as BackendVerification,
} from "@/apiServices/applicationService"
import systemUserAuthStore from "@/apiServices/systemUserAuthStore"

const EVIDENCE_TITLES: Record<string, string> = {
  registrationEvidence: "Registration or establishment evidence",
  licenceEvidence: "Relevant licence evidence",
  authorityEvidence: "Authority document or confirmed officer approval",
  pdpoEvidence: "PDPO evidence",
  publicLogo: "Public company logo",
}

const getBackendBaseUrl = (): string => {
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL
  if (envUrl) return envUrl.replace(/\/+$/, "").replace(/\/api(\/v\d+)?$/i, "")
  if (typeof window !== "undefined") {
    if (window.location.port === "5173" || window.location.port === "3000") {
      return `${window.location.protocol}//${window.location.hostname}:8000`
    }
    return window.location.origin
  }
  return "http://localhost:8000"
}

const getFileUrl = (path: string): string => {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${getBackendBaseUrl()}/${path.replace(/^\/+/, "")}`
}

/**
 * Backend verifications come as `{ checks: { registration, authority, regulatory } }`.
 * Flatten the most recent verification record.
 *
 * Notes are kept as an array (or normalized from a string) so the UI can
 * render each line individually, mirroring the Clarification history list.
 */
function flattenVerifications(
  rawApp: BackendApplication | null,
  fallback: any[] | undefined,
): any[] {
  const source: any = rawApp as any
  const backendRows: BackendVerification[] = source?.verifications ?? []
  const active =
    backendRows.find((v) => v.status === "Recorded") ||
    backendRows[backendRows.length - 1]

  if (active && active.checks) {
    return Object.entries(active.checks).map(([key, check]: [string, any]) => ({
      label:
        check.label ||
        verificationLabels.find(
          (l) => l.toLowerCase().includes(key.toLowerCase())
        ) ||
        key,
      result: check.result,
      // Preserve array shape so each note renders on its own line.
      note: Array.isArray(check.note)
        ? check.note
        : check.note
          ? [check.note]
          : [],
      reviewer: active.reviewer_name,
      date: active.recorded_at,
    }))
  }
  return fallback || []
}

function adaptClarifications(rawApp: BackendApplication | null): any[] {
  const rows: BackendClarification[] = ((rawApp as any)?.clarifications ?? []) as any
  return rows.map((c) => ({
    id: c.id,
    items: c.items && c.items.length ? c.items : [c.subject || "Clarification"],
    requestedBy: c.reviewer_name,
    date: c.requested_at,
    response: c.response || undefined,
    respondedAt: c.responded_at || undefined,
    status: c.status,
  }))
}

function adaptReviewers(rawApp: BackendApplication | null): BackendReviewer[] {
  return (((rawApp as any)?.reviewers ?? []) as BackendReviewer[])
    .slice()
    .sort((a, b) => (a.assigned_at < b.assigned_at ? 1 : -1))
}

export default function ApplicationReview({
  application: initialApp,
  applicationId: propId,
  state,
  actor: propActor,
  feedback,
}: {
  application?: any
  applicationId?: string
  state?: WorkspaceState
  actor?: Actor
  feedback?: (message: string, error?: boolean) => void
}) {
  const actor: Actor = useMemo(() => {
    if (propActor) return propActor
    const user = systemUserAuthStore.getUser()
    return {
      id: user?.id ?? "",
      name: user?.full_name || user?.name || "Staff",
      kind: "staff",
      roles: user ? [(user.role as StaffRole) || "membership_admin"] : [],
    }
  }, [propActor])

  const resolvedId = useMemo(() => {
    if (propId) return propId
    if (initialApp?.id) return String(initialApp.id)
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash.includes("applications/"))
        return hash.split("applications/")[1]?.split("?")[0]?.split("/")[0]
      const path = window.location.pathname
      if (path.includes("applications/"))
        return path.split("applications/")[1]?.split("?")[0]?.split("/")[0]
    }
    return ""
  }, [propId, initialApp])

  const [rawApp, setRawApp] = useState<BackendApplication | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(resolvedId))
  const [localStage, setLocalStage] = useState<ApplicationStatus>("Submitted")
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null)

  useEffect(() => {
    if (!resolvedId) {
      setLoading(false)
      return
    }
    let isMounted = true
    const fetchRecord = async () => {
      setLoading(true)
      try {
        const res = await applicationService.show(resolvedId)
        if (isMounted && res.success && res.data) {
          const appData =
            ((res.data as any)?.application ?? res.data) as BackendApplication
          setRawApp(appData)
          setLocalStage(appData.status)
        }
      } catch (err) {
        console.error("Failed to fetch application:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchRecord()
    return () => {
      isMounted = false
    }
  }, [resolvedId])

  // Extract raw verifications list
  const verifications: BackendVerification[] = useMemo(() => {
    const source: any = rawApp || (initialApp as any)?.application || initialApp
    return source?.verifications ?? []
  }, [rawApp, initialApp])

  const a: WorkspaceApplication = useMemo(() => {
    const source: any = rawApp || (initialApp as any)?.application || initialApp

    if (source && (source.legal_name || source.values || source.attachments)) {
      const values: Record<string, any> = source.values || {
        legalName: source.legal_name,
        tradingName: source.trading_name,
        entityType: source.entity_type,
        registrationCountry: source.registration_country,
        registrationReference: source.registration_reference,
        registeredAddress: source.registered_address,
        ugandaAddress: source.uganda_address,
        businessEmail: source.business_email,
        businessPhone: source.business_phone,
        website: source.website,
        category: source.category,
        services: source.organisation_details?.services,
        operationalStatus: source.operational_status,
        regions: source.organisation_details?.regions,
        requestedTier: source.requested_tier,
        pdpoStatus: source.pdpo_status,
        pdpoReference: source.compliance_details?.pdpo_reference,
        pdpoValidity: source.compliance_details?.pdpo_validity,
        pdpoExplanation: source.compliance_details?.pdpo_explanation,
        licenceRelevant: source.licence_relevant,
        licenceType: source.compliance_details?.licence_type,
        licenceStatus: source.compliance_details?.licence_status,
        licenceNumber: source.compliance_details?.licence_number,
        licenceHolder: source.compliance_details?.licence_holder,
        licenceValidity: source.compliance_details?.licence_validity,
        licenceType2: source.compliance_details?.licence_type_2,
        licenceStatus2: source.compliance_details?.licence_status_2,
        licenceNumber2: source.compliance_details?.licence_number_2,
        licenceHolder2: source.compliance_details?.licence_holder_2,
        applicantName: source.applicant_name,
        applicantRole: source.applicant_role,
        applicantEmail: source.applicant_email,
        applicantPhone: source.applicant_phone,
        sameRepresentative: source.applicant_details?.same_representative,
        representativeName: source.representative_name,
        representativeRole: source.representative_role,
        representativeEmail: source.representative_email,
        representativePhone: source.representative_phone,
        alternateRepresentative:
          source.applicant_details?.alternate_representative,
        authorityConfirmed: source.applicant_details?.authority_confirmed,
        billingEmail: source.billing_email,
        billingContact: source.billing_contact,
        invoiceAddress: source.invoice_address,
        tin: source.billing_details?.tin,
        purchaseOrder: source.billing_details?.purchase_order,
        customerFacing: source.customer_facing,
        supportContact: source.billing_details?.support_contact,
        hasRestrictions: source.restrictions?.has_restrictions,
        restrictionDetails: source.restrictions?.restriction_details,
        joiningReasons: source.profile_optional?.joining_reasons,
        priorities: source.profile_optional?.priorities,
        workingGroups: source.profile_optional?.working_groups,
        publicName: source.profile_optional?.public_name,
        publicDescription: source.profile_optional?.public_description,
        publicServices: source.profile_optional?.public_services,
        publicCoverage: source.profile_optional?.public_coverage,
        publicWebsite: source.profile_optional?.public_website,
        publicContact: source.profile_optional?.public_contact,
        accuracyDeclaration: source.declarations?.accuracy,
        authorityDeclaration: source.declarations?.authority,
        rulesDeclaration: source.declarations?.rules,
        restrictionsDeclaration: source.declarations?.restrictions,
        privacyDeclaration: source.declarations?.privacy,
        directoryConsent: source.declarations?.directory,
        promotionalConsent: source.declarations?.promotional,
      }

      const rawAttachments = source.attachments || {}
      const evidence: (FileRecord & {
        path: string
        url: string
        isPdf: boolean
        isImage: boolean
        filename: string
      })[] = Object.entries(rawAttachments)
        .filter(([_, path]) => Boolean(path))
        .map(([key, path]) => {
          const pathStr = String(path)
          const filename = pathStr.split("/").pop() || `${key}.pdf`
          const ext = filename.split(".").pop()?.toLowerCase() || ""
          const isPdf = ext === "pdf"
          const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext)
          const fileUrl = getFileUrl(pathStr)
          return {
            id: key,
            name: EVIDENCE_TITLES[key] || key.replace(/([A-Z])/g, " $1").trim(),
            filename,
            size: 1024 * 250,
            type: isPdf
              ? "application/pdf"
              : isImage
                ? `image/${ext === "png" ? "png" : "jpeg"}`
                : "application/octet-stream",
            category: "Supporting Evidence",
            path: pathStr,
            url: fileUrl,
            href: fileUrl,
            previewUrl: fileUrl,
            isPdf,
            isImage,
          }
        })

      const reviewers = adaptReviewers(rawApp)
      const rawVerifList = source?.verifications ?? []
      const latestVerification = rawVerifList[rawVerifList.length - 1]

      const activeReviewer =
        reviewers.find((r) => r.status === "Assigned" || r.status === "In review")
          ?.reviewer_name ??
        latestVerification?.reviewer_name ??
        null

      return {
        id: source.id || resolvedId,
        organisationId: source.id || resolvedId,
        organisation:
          source.legal_name || values.legalName || "Untitled Organisation",
        requestedTier:
          source.requested_tier || values.requestedTier || "Unassigned",
        confirmedTier:
          source.confirmed_tier || source.requested_tier || "not yet decided",
        reviewer: activeReviewer || "Unassigned",
        stage: (localStage || source.status) as any,
        submittedAt: source.created_at || new Date().toISOString(),
        updatedAt:
          source.updated_at || source.created_at || new Date().toISOString(),
        values,
        evidence,
        clarifications: adaptClarifications(rawApp),
        decisions: source.decisions || initialApp?.decisions || [],
        verifications: flattenVerifications(rawApp, initialApp?.verifications),
        activity: source.activity || [
          {
            id: "act-1",
            actor: source.applicant_name || "Applicant",
            text: `Submitted membership application for ${
              source.legal_name || "Organisation"
            }`,
            date: source.created_at || new Date().toISOString(),
          },
        ],
        eligible: true,
        profileApproved: false,
        consent: Boolean(source.declarations?.directory),
        profile: {
          name: source.profile_optional?.public_name || source.legal_name || "",
          description: source.profile_optional?.public_description || "",
          services: source.profile_optional?.public_services || "",
          coverage: source.profile_optional?.public_coverage || "",
          website: source.profile_optional?.public_website || source.website || "",
          contact:
            source.profile_optional?.public_contact || source.business_email || "",
        },
        standing: "Current",
        portalAccess: true,
        periodStart: new Date().toISOString(),
        periodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
      }
    }

    return {
      id: resolvedId,
      organisationId: resolvedId,
      organisation: "Loading…",
      requestedTier: "",
      confirmedTier: "not yet decided",
      reviewer: "Unassigned",
      stage: localStage as any,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      values: {},
      evidence: [],
      clarifications: [],
      decisions: [],
      verifications: [],
      activity: [],
      eligible: false,
      profileApproved: false,
      consent: false,
      profile: {
        name: "",
        description: "",
        services: "",
        coverage: "",
        website: "",
        contact: "",
      },
      standing: "Current",
      portalAccess: false,
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
    }
  }, [rawApp, initialApp, resolvedId, localStage])

  const handleFeedback = (message: string, error?: boolean) => {
    if (feedback) feedback(message, error)
    if (!error && a.id) {
      applicationService.show(a.id).then((res) => {
        if (res.success && res.data) {
          const appData =
            ((res.data as any)?.application ?? res.data) as BackendApplication
          setRawApp(appData)
          setLocalStage(appData.status)
        }
      })
    }
  }

  const invoice = useMemo(
    () => state?.invoices?.find((i) => i.applicationId === a.id),
    [state, a.id],
  )

  if (loading) {
    return (
      <div
        className="workspace-panel"
        style={{ padding: "3rem", textAlign: "center" }}
      >
        <p>Loading application review…</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        action={
          <PdfDownload
            request={{ applicationId: a.id, legalName: a.organisation }}
            label="Download application summary PDF"
          />
        }
        title={a.organisation}
        description={`${a.id} · Requested ${a.requestedTier} · Confirmed ${
          a.confirmedTier || "not yet decided"
        } · Reviewer: ${a.reviewer}`}
      />

      <div className="workspace-review-status">
        <StatusBadge status={a.stage} />
        <span>Updated {new Date(a.updatedAt).toLocaleString("en-GB")}</span>
      </div>

      <WorkflowActions
        application={a}
        actor={actor}
        invoice={invoice}
        feedback={handleFeedback}
      />

      <div className="workspace-review-grid">
        {/* Left Column */}
        <div>
          <section className="workspace-panel">
            <h2>Application information</h2>
            <dl className="workspace-record">
              {Object.entries(a.values).map(([key, value]) => (
                <div key={key}>
                  <dt>
                    {membershipFormSchema.find((field) => field.name === key)
                      ?.label || key.replace(/([A-Z])/g, " $1")}
                  </dt>
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
          </section>

          <section className="workspace-panel">
            <h2>Clarification history</h2>
            {a.clarifications && a.clarifications.length ? (
              a.clarifications.map((c: any) => (
                <article className="workspace-history" key={c.id}>
                  <strong>
                    {c.requestedBy} ·{" "}
                    {new Date(c.date).toLocaleDateString("en-GB")}
                    {c.status && (
                      <>
                        {" · "}
                        <StatusBadge status={c.status} />
                      </>
                    )}
                  </strong>
                  <ul>
                    {c.items.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p>
                    <b>Applicant response:</b>{" "}
                    {c.response || "Awaiting a consolidated response"}
                  </p>
                  {c.respondedAt && (
                    <small>
                      Received{" "}
                      {new Date(c.respondedAt).toLocaleString("en-GB")}
                    </small>
                  )}
                </article>
              ))
            ) : (
              <p>No clarification requests.</p>
            )}
          </section>

          <section className="workspace-panel">
            <h2>Decision history</h2>
            {a.decisions && a.decisions.length ? (
              a.decisions.map((d, i) => (
                <article key={i} className="workspace-history">
                  <StatusBadge status={d.outcome} />
                  <p>{d.reason}</p>
                  <small>
                    {d.actor} · {new Date(d.date).toLocaleDateString("en-GB")}{" "}
                    · Tier: {d.tier || "Not assigned"}
                  </small>
                </article>
              ))
            ) : (
              <p>No admission decision recorded.</p>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div>
          <section className="workspace-panel">
            <h2>Supporting evidence</h2>
            <p>
              Review context and authenticity independently. Uploaded documents
              do not automatically prove eligibility.
            </p>

            {a.evidence && a.evidence.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                {a.evidence.map((file: any) => {
                  const isPreviewOpen = activePreviewId === file.id
                  return (
                    <div
                      key={file.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "1rem",
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              fontSize: "0.95rem",
                              display: "block",
                              color: "#1e293b",
                            }}
                          >
                            {file.name}
                          </strong>
                          <span
                            style={{ fontSize: "0.8rem", color: "#64748b" }}
                          >
                            {file.filename} ·{" "}
                            {file.isPdf
                              ? "PDF Document"
                              : file.isImage
                                ? "Image file"
                                : "File"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActivePreviewId(isPreviewOpen ? null : file.id)
                            }
                            style={{
                              padding: "0.3rem 0.65rem",
                              fontSize: "0.8rem",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              background: isPreviewOpen ? "#f1f5f9" : "#ffffff",
                              cursor: "pointer",
                              fontWeight: 500,
                            }}
                          >
                            {isPreviewOpen ? "Close preview" : "Preview"}
                          </button>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link"
                            style={{
                              fontSize: "0.82rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontWeight: 500,
                            }}
                          >
                            Open original ↗
                          </a>
                        </div>
                      </div>

                      <div style={{ marginTop: "0.75rem" }}>
                        <EvidencePreview file={file} inline />
                      </div>

                      {isPreviewOpen && (
                        <div
                          style={{
                            marginTop: "0.85rem",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            overflow: "hidden",
                            background: "#f8fafc",
                          }}
                        >
                          {file.isImage ? (
                            <div style={{ padding: "1rem", textAlign: "center" }}>
                              <img
                                src={file.url}
                                alt={file.name}
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "450px",
                                  objectFit: "contain",
                                  borderRadius: "4px",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                }}
                              />
                            </div>
                          ) : file.isPdf ? (
                            <iframe
                              src={`${file.url}#toolbar=1`}
                              title={file.name}
                              style={{
                                width: "100%",
                                height: "480px",
                                border: "none",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div style={{ padding: "1.5rem", textAlign: "center" }}>
                              <p
                                style={{
                                  margin: 0,
                                  color: "#64748b",
                                  fontSize: "0.9rem",
                                }}
                              >
                                Direct inline preview unavailable for this file
                                type.
                              </p>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-block",
                                  marginTop: "0.5rem",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                }}
                              >
                                Download or view in new tab ↗
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ marginTop: "1rem", color: "#64748b" }}>
                No uploaded evidence found for this application.
              </p>
            )}
          </section>

          <section className="workspace-panel">
            <h2>Verification checklist</h2>
            {verificationLabels.map((label) => {
              const result = a.verifications?.find((v) => v.label === label)
              return (
                <div key={label} className="workspace-history">
                  <strong>{label}</strong>
                  <div>
                    <StatusBadge status={result?.result || "Not reviewed"} />
                  </div>
                  {result && (
                    <>
                      {Array.isArray(result.note) && result.note.length > 0 ? (
                        <ul>
                          {result.note.map((line: string, idx: number) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      ) : result.note ? (
                        <p>{result.note}</p>
                      ) : null}
                      <small>
                        {result.reviewer} ·{" "}
                        {new Date(result.date).toLocaleDateString("en-GB")}
                      </small>
                    </>
                  )}
                </div>
              )
            })}
          </section>

          {/* Verified / Reviewed by */}
          <section className="workspace-panel">
            <h2>Verified / Reviewed by</h2>
            {verifications && verifications.length > 0 ? (
              verifications.map((v: any, index: number) => (
                <div key={v.id || index} className="workspace-history">
                  <strong>{v.reviewer_name || "Unassigned"}</strong>
                  <div>
                    <StatusBadge status={v.status || "Recorded"} />
                  </div>
                  {v.recorded_at && (
                    <small>
                      {new Date(v.recorded_at).toLocaleDateString("en-GB")}
                    </small>
                  )}
                </div>
              ))
            ) : (
              <p>No verifications recorded.</p>
            )}
          </section>

          <section className="workspace-panel">
            <h2>Activity timeline</h2>
            <Timeline items={a.activity || []} />
          </section>
        </div>
      </div>
    </>
  )
}
