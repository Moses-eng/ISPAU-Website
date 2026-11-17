import { useCallback, useEffect, useMemo, useState } from "react"
import PdfDownload from "@/components/dashboard/PdfDownload"
import { can } from "@/config/permissions"
import OrganisationDetailsEditor from "@/features/membership/components/OrganisationDetailsEditor"
import { membershipService } from "@/services/membershipService"
import type {
  Actor,
  Application as WorkspaceApplication,
  StaffRole,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { published } from "@/features/membership/services/workflow"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Timeline from "@/components/dashboard/Timeline"
import Button from "@/components/ui/Button"
import ProfileEditor from "@/features/membership/components/ProfileEditor"
import applicationService, {
  type Application as BackendApplication,
} from "@/apiServices/applicationService"
import systemUserAuthStore from "@/apiServices/systemUserAuthStore"

export default function Members({
  state,
  actor: propActor,
  feedback,
}: {
  state?: WorkspaceState
  actor?: Actor
  feedback: (message: string, error?: boolean) => void
}) {
  // 1. Resolve logged-in administrator from systemUserAuthStore
  const actor: Actor = useMemo(() => {
    if (propActor) return propActor
    const user = systemUserAuthStore.getUser()
    if (user) {
      return {
        id: user.id,
        name: user.full_name || user.name || "Staff Admin",
        kind: "staff",
        roles: [(user.role as StaffRole) || "membership_admin"],
      }
    }
    return {
      id: "ispau-super",
      name: "ISPAU Admin",
      kind: "staff",
      roles: ["super_admin", "membership_admin"],
    }
  }, [propActor])

  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState("")
  const [rawMembers, setRawMembers] = useState<BackendApplication[]>([])
  const [loading, setLoading] = useState(true)

  // 2. Fetch Active members from backend API using applicationService.list
  const fetchActiveMembers = useCallback(async (searchQuery = "") => {
    setLoading(true)
    // const res = await applicationService.list({
    //   status: "Active",
    //   search: searchQuery || undefined,
    // })
     const res = await applicationService.list()

    if (res.success && res.data) {
      setRawMembers(res.data)
    }
    setLoading(false)
  }, [])

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActiveMembers(query)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, fetchActiveMembers])

  const storageBase = import.meta.env.VITE_STORAGE_URL || "/storage/"

  // 3. Map backend database records to WorkspaceApplication shape for full UI compatibility
  const members: WorkspaceApplication[] = useMemo(() => {
    return rawMembers.map((raw, index) => {
      const local = state?.applications?.find((item) => item.id === raw.id)
      const memberNumber = String(index + 1).padStart(4, "0")
      const memberId = local?.memberId || `ISPAU-MEM-${memberNumber}`
      const organisation = raw.legal_name || local?.organisation || "Member Organisation"

      const values: Record<string, any> = {
        registeredAddress: raw.registered_address || "",
        ugandaAddress: raw.uganda_address || "",
        businessEmail: raw.business_email || "",
        businessPhone: raw.business_phone || "",
        representativeName: raw.representative_name || "",
        representativeRole: raw.representative_role || "",
        representativeEmail: raw.representative_email || "",
        representativePhone: raw.representative_phone || "",
        billingEmail: raw.billing_email || "",
        billingContact: raw.billing_contact || "",
        invoiceAddress: raw.invoice_address || "",
        legalName: raw.legal_name || "",
        tradingName: raw.trading_name || "",
        category: raw.category || "",
        requestedTier: raw.requested_tier || "",
        ...local?.values,
      }

      return {
        id: raw.id,
        organisationId: raw.id,
        organisation,
        memberId,
        stage: "Active",
        requestedTier: raw.requested_tier || "Standard",
        confirmedTier: raw.requested_tier || "Standard",
        reviewer: raw.applicant_name || local?.reviewer || "Staff Admin",
        submittedAt: raw.created_at || local?.submittedAt,
        updatedAt: raw.updated_at || raw.created_at || local?.updatedAt || new Date().toISOString(),
        periodStart: local?.periodStart || "2026-01-01",
        periodEnd: local?.periodEnd || "2026-12-31",
        standing: local?.standing || "Current",
        portalAccess: local?.portalAccess !== false,
        eligible: local?.eligible !== false,
        profileApproved: local?.profileApproved !== false,
        consent: local?.consent !== false,
        profile: local?.profile || {
          name: raw.profile_optional?.public_name || organisation,
          description: raw.profile_optional?.public_description || "ISPAU Active Member",
          services: raw.profile_optional?.public_services || raw.organisation_details?.services || "",
          coverage: raw.profile_optional?.public_coverage || raw.organisation_details?.regions || "Uganda",
          website: raw.profile_optional?.public_website || raw.website || "",
          contact: raw.profile_optional?.public_contact || raw.business_email || "",
          logo: raw.attachments?.publicLogo ? `${storageBase}${raw.attachments.publicLogo}` : undefined,
        },
        values,
        evidence: local?.evidence || [],
        clarifications: local?.clarifications || [],
        decisions: local?.decisions || [],
        verifications: local?.verifications || [],
        activity: local?.activity || [
          {
            id: `act-${raw.id}`,
            date: raw.updated_at || raw.created_at,
            actor: "Membership Committee",
            text: "Membership activated and registered in the active directory.",
          },
        ],
      }
    })
  }, [rawMembers, state?.applications, storageBase])

  // Selected member detail record
  const a = members.find((item) => item.id === selected)

  return (
    <>
      <PageHeader
        action={
          can(actor, "members.manage") ? (
             <PdfDownload
                        request={{ applicationId: "a.id", legalName: "organisation" }}
                        label="Download application summary PDF"
                      />
          ) : undefined
        }
        title="Member register"
        description="Membership standing, portal access and directory publication are tracked separately."
      />

      {a ? (
        <>
          <Button kind="ghost" onClick={() => setSelected("")}>
            ← Member register
          </Button>
          <h2>
            {a.organisation} · {a.memberId}
          </h2>
          <div className="workspace-panel">
            <h3>
              {can(actor, "members.manage")
                ? "Organisation & representatives"
                : "Billing details"}
            </h3>
            <dl className="workspace-record">
              {(can(actor, "members.manage")
                ? [
                    "registeredAddress",
                    "businessEmail",
                    "representativeName",
                    "representativeEmail",
                  ]
                : ["registeredAddress", "billingEmail"]
              ).map((key) => (
                <div key={key}>
                  <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd>{String(a.values[key] || "Not provided")}</dd>
                </div>
              ))}
            </dl>
            <h3>Membership history</h3>
            <p>
              {a.confirmedTier} · {a.periodStart} to {a.periodEnd}
            </p>
            <h3>Billing history</h3>
            {(state?.invoices || [])
              .filter((i) => i.applicationId === a.id)
              .map((i) => (
                <p key={i.id}>
                  {i.id} · {i.currency} {i.amount.toLocaleString()} · {i.status}
                </p>
              ))}
          </div>

          {can(actor, "members.manage") && (
            <OrganisationDetailsEditor
              application={a}
              actor={actor}
              feedback={feedback}
              section="company"
              compact
            />
          )}

          {can(actor, "renewals.manage") && (
            <Button
              kind="secondary"
              onClick={() => {
                try {
                  membershipService.dispatch(actor, { type: "renew", id: a.id })
                  feedback("Renewal details confirmed.")
                } catch (error) {
                  feedback((error as Error).message, true)
                }
              }}
            >
              Confirm renewal details
            </Button>
          )}

          {can(actor, "directory.manage") && (
            <ProfileEditor application={a} actor={actor} feedback={feedback} />
          )}

          <section className="workspace-panel">
            <h2>Relevant audit history</h2>
            <Timeline items={a.activity} />
          </section>
        </>
      ) : (
        <section className="workspace-panel">
          <label className="field">
            Search members
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Organisation or member ID"
            />
          </label>

          <DataTable
            rows={members}
            label="Active member register"
            rowKey={(m) => m.id}
            columns={[
              {
                label: "Member ID",
                cell: (m) => m.memberId,
                sort: (m) => m.memberId!,
              },
              {
                label: "Organisation",
                cell: (m) => <strong>{m.organisation}</strong>,
                sort: (m) => m.organisation,
              },
              {
                label: "Tier",
                cell: (m) => m.confirmedTier,
                sort: (m) => m.confirmedTier || "",
              },
              {
                label: "Membership period",
                cell: (m) => `${m.periodStart} — ${m.periodEnd}`,
              },
              { label: "Standing", cell: (m) => m.standing },
              ...(can(actor, "directory.manage")
                ? [
                    {
                      label: "Directory visibility",
                      cell: (m: WorkspaceApplication) => (
                        <StatusBadge
                          status={published(m) ? "Published" : "Not published"}
                        />
                      ),
                    },
                  ]
                : []),
              {
                label: "Actions",
                cell: (m) => (
                  <Button kind="ghost" onClick={() => setSelected(m.id)}>
                    Open member →
                  </Button>
                ),
              },
            ]}
          />
          {loading && (
            <p style={{ textAlign: "center", padding: "1rem" }}>
              Loading active members…
            </p>
          )}
        </section>
      )}
    </>
  )
}
