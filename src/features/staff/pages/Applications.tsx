import { useCallback, useEffect, useState } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Button from "@/components/ui/Button"
import applicationService, {
  type Application,
  type ApplicationStatus,
} from "@/apiServices/applicationService"
import tierService, { type Tier } from "@/apiServices/tierService"

const ALL_STAGES: ApplicationStatus[] = [
  "Submitted",
  "Under review",
  "Clarification needed",
  "Decision pending",
  "Approved awaiting payment",
  "Active",
  "Deferred",
  "Declined",
]

export default function Applications({
  navigate,
}: {
  navigate: (route: string) => void
}) {
  const [applications, setApplications] = useState<Application[]>([])
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<
    Partial<Record<ApplicationStatus, number>>
  >({})

  // Filters
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState("")
  const [tier, setTier] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  // Fetch tiers from backend on mount
  useEffect(() => {
    let cancelled = false
    tierService.list().then((res) => {
      if (!cancelled && res.success) {
        setTiers(res.data)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const res = await applicationService.list({
      search: query || undefined,
      status: stage || undefined,
      include_drafts: false,
      requested_tier: tier || undefined,
      from: from || undefined,
      to: to || undefined,
    })

    if (res.success) {
      setApplications(
        res.data.filter((application) => application.status !== "Draft"),
      )
    } else {
      setError(res.message)
    }
    setLoading(false)
  }, [query, stage, tier, from, to])

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 250)
    return () => clearTimeout(timer)
  }, [loadData])

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      ALL_STAGES.map(async (status) => {
        const result = await applicationService.list({
          status,
          include_drafts: false,
        })
        return [status, result.success ? result.total : undefined] as const
      }),
    ).then((results) => {
      if (!cancelled) setCounts(Object.fromEntries(results))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const allCount = ALL_STAGES.every((status) => counts[status] !== undefined)
    ? ALL_STAGES.reduce((sum, status) => sum + (counts[status] ?? 0), 0)
    : undefined

  const clearFilters = () => {
    setQuery("")
    setStage("")
    setTier("")
    setFrom("")
    setTo("")
  }


// Prevents calling update() if already "Under review"
  const handleOpenReview = async (id: string, currentStatus?: ApplicationStatus) => {
    const status = currentStatus ?? applications.find((app) => app.id === id)?.status

    if (status !== "Under review" && status === "Submitted") {
      try {
        await applicationService.update(id, { status: "Under review" })
      } catch (err) {
        console.error("Failed to update status to Under review:", err)
      }
    }

    navigate(`applications/${id}`)
  }
  return (
    <>
      <PageHeader
        title="Applications"
        description="Live queue for incoming membership submissions, compliance verifications and board admission decisions."
      />
      <nav
        className="workspace-actions"
        aria-label="Application status filters"
      >
        <Button
          kind={stage === "" ? "primary" : "secondary"}
          aria-pressed={stage === ""}
          onClick={() => setStage("")}
        >
          All ({allCount ?? "?"})
        </Button>
        {ALL_STAGES.map((status) => (
          <Button
            key={status}
            kind={stage === status ? "primary" : "secondary"}
            aria-pressed={stage === status}
            onClick={() => setStage(status)}
          >
            {status} ({counts[status] ?? "?"})
          </Button>
        ))}
      </nav>
      <section className="workspace-panel">
        <label className="field">
          <span>Search organisation or reference</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by legal name, application number, reference, or email…"
          />
        </label>

        <details className="workspace-filters" open>
          <summary>
            Filters · {applications.length} matching applications
          </summary>
          <div className="workspace-filter-grid">
            <label className="field">
              Stage
              <select value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">All stages</option>
                {ALL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Requested tier
              <select value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="">All tiers</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — USD {Number(t.cost).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Submitted from
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>

            <label className="field">
              Submitted to
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>

            <Button kind="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </details>

        {error && (
          <div className="error-banner" style={{ margin: "1rem 0" }}>
            <p>{error}</p>
            <Button kind="secondary" onClick={loadData}>
              Retry
            </Button>
          </div>
        )}

        <DataTable
          rows={applications}
          label="Membership application queue"
          rowKey={(a) => a.id}
          columns={[
            {
              label: "Organisation",
              cell: (a) => (
                <div>
                  <strong>{a.legal_name || "Untitled Organisation"}</strong>
                  {a.trading_name && (
                    <small
                      style={{
                        display: "block",
                        color: "var(--color-text-muted, #666)",
                      }}
                    >
                      t/a {a.trading_name}
                    </small>
                  )}
                </div>
              ),
              sort: (a) => a.legal_name,
            },
            {
              label: "Application #",
              cell: (a) => {
                const appNumber = (a as any).application_number
                return (
                  <div>
                    <strong style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>
                      {appNumber || a.registration_reference || "—"}
                    </strong>
                    {a.registration_reference && appNumber && (
                      <small
                        style={{
                          display: "block",
                          color: "var(--color-text-muted, #666)",
                        }}
                      >
                        Ref: {a.registration_reference}
                      </small>
                    )}
                  </div>
                )
              },
              sort: (a) => (a as any).application_number || a.registration_reference || a.id,
            },
            {
              label: "Requested tier",
              cell: (a) => a.requested_tier,
              sort: (a) => a.requested_tier,
            },
            {
              label: "Stage",
              cell: (a) => <StatusBadge status={a.status} />,
              sort: (a) => a.status,
            },
            {
              label: "Submitted",
              cell: (a) =>
                a.created_at
                  ? new Date(a.created_at).toLocaleDateString("en-GB")
                  : "—",
              sort: (a) => a.created_at,
            },
            {
              label: "Age",
              cell: (a) => {
                if (!a.created_at) return "0d"
                const days = Math.max(
                  0,
                  Math.floor(
                    (Date.now() - Date.parse(a.created_at)) / 86400000,
                  ),
                )
                return `${days}d`
              },
            },
            {
              label: "Contact",
              cell: (a) => (
                <small>
                  {a.applicant_name} ({a.business_email})
                </small>
              ),
            },
            {
              label: "Next action",
              cell: (a) => (
                <Button
                  kind="ghost"
                  onClick={() => handleOpenReview(a.id)}
                >
                  Open review →
                </Button>
              ),
            },
          ]}
        />
        {loading && (
          <p style={{ padding: "1rem", textAlign: "center" }}>
            Loading applications…
          </p>
        )}
      </section>
    </>
  )
}
