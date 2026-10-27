import { useState, type FormEvent } from "react"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import EmptyState from "@/components/dashboard/EmptyState"
import FormField from "@/components/dashboard/FormField"
import Dialog from "@/components/dashboard/Dialog"
import StatusBadge from "@/components/dashboard/StatusBadge"
import Button from "@/components/ui/Button"
import CreditSubmission from "./CreditSubmission"
import CreditReferences from "./CreditReferences"
import CreditCase from "./CreditCase"
import useCreditWorkspace, { creditService } from "./service"
import { canParticipate, creditStatuses, memberNotices } from "./model"
export default function TradeWorkspace({
  actor,
  membership,
}: {
  actor: Actor
  membership: WorkspaceState
}) {
  const state = useCreditWorkspace(),
    [tab, setTab] = useState("overview"),
    [selected, setSelected] = useState(""),
    [filter, setFilter] = useState(""),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("")
  const admin = actor.kind === "staff" && actor.roles.includes("secretariat")
  const enrolled = state.enrolments.find(
    (e) => e.organisationId === actor.organisationId,
  )
  if (!admin && !canParticipate(actor, membership.applications))
    return (
      <EmptyState
        title="Trade Credit access unavailable"
        text="ISPAU must provision Trade Credit participation after membership verification. Active membership, current standing and portal access are also required. All provisioned ISPs receive the same tools. Contact the Secretariat to resolve access."
      />
    )
  const own = state.records.filter(
    (r) => admin || r.organisationId === actor.organisationId,
  )
  const rows = own.filter(
    (r) =>
      (!filter || r.status === filter) &&
      `${r.customer} ${r.id}`.toLowerCase().includes(query.toLowerCase()),
  )
  const tabs = admin
    ? [
        ["overview", "Payment records"],
        ["disputes", "Disputes & requests"],
        ["activity", "Activity & reports"],
      ]
    : [
        ["overview", "Payment records"],
        ["references", "References"],
        ["noticeboard", "Member notices"],
      ]
  const selectedRecord = own.find((r) => r.id === selected)
  const organisation = (id: string) =>
    membership.applications.find((a) => a.organisationId === id)
      ?.organisation || id
  function enrol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const f = new FormData(event.currentTarget)
    try {
      creditService.dispatch(actor, {
        type: "enrol",
        officer: String(f.get("officer") || ""),
        contact: String(f.get("contact") || ""),
        accepted: f.has("accepted"),
      })
      setError("")
      setSuccess("Accountable officer details saved.")
      setTab("overview")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function done() {
    setTab("overview")
    setSuccess(
      "Record saved. New and updated payment records require ISPAU verification.",
    )
  }
  return (
    <>
      <PageHeader
        title={
          admin
            ? "Trade Credit administration"
            : "Trade Credit & payment assurance"
        }
        description={
          admin
            ? "Verify evidence, record customer notice and oversee independent review before controlled reference access."
            : `${organisation(actor.organisationId!)} · Private ISP workspace for payment records and authorised reference requests.`
        }
      />
      <nav className="credit-tabs" aria-label="Trade Credit sections">
        {tabs.map(([id, label]) => (
          <Button
            key={id}
            kind={tab === id ? "primary" : "secondary"}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => {
              setTab(id)
              setSuccess("")
              setError("")
            }}
          >
            {label}
          </Button>
        ))}
      </nav>
      {success && (
        <p role="status" className="workspace-feedback">
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="workspace-feedback error">
          {error}
        </p>
      )}
      {!admin && (!enrolled || tab === "enrolment") ? (
        <form onSubmit={enrol} className="workspace-panel">
          <h2>Your ISP's accountable officer</h2>
          <p>
            Appoint the responsible contact before participating. * Required.
            Review the participation requirements before continuing.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              name="officer"
              label="Accountable officer name"
              required
              value={enrolled?.officer}
            />
            <FormField
              name="contact"
              label="Business email"
              type="email"
              required
              value={enrolled?.contact}
            />
          </div>
          <p>
            Submit accurate business-account information and relevant evidence,
            report corrections and settlements promptly, respect disputes, and
            request references only for authorised credit decisions. Customer
            lists must not be redistributed.
          </p>
          <label className="flex items-start gap-3 my-5">
            <input name="accepted" type="checkbox" required />
            <span>
              I acknowledge the participation requirements on behalf of this
              ISP. *
            </span>
          </label>
          <Button type="submit">Save accountable officer</Button>
        </form>
      ) : (
        <>
          {!admin && (
            <div className="workspace-actions mb-5">
              <Button
                kind="secondary"
                onClick={() =>
                  setTab(
                    tab === "submit" || tab === "enrolment"
                      ? "overview"
                      : "submit",
                  )
                }
              >
                {tab === "submit" || tab === "enrolment"
                  ? "Back to payment records"
                  : "Submit payment record"}
              </Button>
              <Button kind="ghost" onClick={() => setTab("enrolment")}>
                Manage accountable officer
              </Button>
            </div>
          )}
          {tab === "submit" && !admin && (
            <CreditSubmission actor={actor} onDone={done} />
          )}
          {tab === "references" && !admin && (
            <details className="workspace-panel">
              <summary className="min-h-11 cursor-pointer font-semibold">
                Record a satisfactory payment history
              </summary>
              <CreditSubmission
                actor={actor}
                satisfactory
                onDone={() => {
                  setSuccess(
                    "Satisfactory reference saved separately from adverse records.",
                  )
                }}
              />
              <section className="workspace-panel">
                <h2>Your satisfactory references</h2>
                <DataTable
                  rows={state.references.filter(
                    (r) => r.organisationId === actor.organisationId,
                  )}
                  rowKey={(r) => r.id}
                  label="Satisfactory histories"
                  columns={[
                    { label: "Customer", cell: (r) => r.customer },
                    { label: "History", cell: (r) => r.summary },
                    {
                      label: "Recorded",
                      cell: (r) => new Date(r.date).toLocaleDateString(),
                    },
                  ]}
                />
              </section>
            </details>
          )}
          {tab === "references" && !admin && <CreditReferences actor={actor} />}
          {tab === "noticeboard" && !admin && (
            <section className="workspace-panel">
              <h2>Member noticeboard</h2>
              <p>
                ISPAU-reviewed payment information is available through
                authorised reference requests. Customer identities and
                confidential terms are not published as a list.
              </p>
              <DataTable
                rows={memberNotices(state)}
                rowKey={(r) => r.id}
                label="ISPAU reviewed member notices"
                columns={[
                  { label: "Case reference", cell: (r) => r.id },
                  {
                    label: "Reviewed status",
                    cell: (r) => (
                      <>
                        <StatusBadge status={r.status} />
                        {r.status === "disputed" && (
                          <small className="block">
                            Contested claim, not a confirmed default.
                          </small>
                        )}
                      </>
                    ),
                  },
                  {
                    label: "Last update",
                    cell: (r) => new Date(r.updatedAt).toLocaleDateString(),
                  },
                ]}
              />
              <Button onClick={() => setTab("references")}>
                Request an authorised reference
              </Button>
            </section>
          )}
          {["overview", "disputes"].includes(tab) && (
            <>
              {tab === "overview" && (
                <div className="credit-summary">
                  {(admin
                    ? ["under verification", "disputed", "verified overdue"]
                    : ["under verification", "repayment arrangement", "settled"]
                  ).map((status) => (
                    <section className="workspace-panel" key={status}>
                      <span>{status}</span>
                      <strong>
                        {own.filter((r) => r.status === status).length}
                      </strong>
                    </section>
                  ))}
                </div>
              )}
              <section className="workspace-panel">
                <h2>
                  {admin
                    ? tab === "disputes"
                      ? "Contested claims and independent review"
                      : "Payment records requiring oversight"
                    : "Your organisation's cases"}
                </h2>
                <div className="flex flex-wrap gap-4 my-5">
                  <label className="field">
                    <span>Search cases</span>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Customer or case reference"
                    />
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {creditStatuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <Button
                    kind="ghost"
                    onClick={() => {
                      setQuery("")
                      setFilter("")
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
                <DataTable
                  rows={rows.filter(
                    (r) => tab !== "disputes" || r.status === "disputed",
                  )}
                  rowKey={(r) => r.id}
                  label="Payment cases"
                  columns={[
                    {
                      label: "Case / customer",
                      cell: (r) => (
                        <>
                          <strong>{r.id}</strong>
                          <span className="block">{r.customer}</span>
                        </>
                      ),
                      sort: (r) => r.customer,
                    },
                    ...(admin
                      ? [
                          {
                            label: "Reporting ISP",
                            cell: (r: (typeof rows)[number]) =>
                              organisation(r.organisationId),
                          },
                        ]
                      : []),
                    {
                      label: "Status",
                      cell: (r) => <StatusBadge status={r.status} />,
                      sort: (r) => r.status,
                    },
                    {
                      label: "Outstanding",
                      cell: (r) =>
                        `${r.balance.toLocaleString()} ${r.currency}`,
                    },
                    {
                      label: "Updated",
                      cell: (r) => new Date(r.updatedAt).toLocaleDateString(),
                      sort: (r) => r.updatedAt,
                    },
                    {
                      label: "Action",
                      cell: (r) => (
                        <Button
                          kind="secondary"
                          onClick={() => setSelected(r.id)}
                        >
                          {admin ? "Review case" : "View / update"}
                        </Button>
                      ),
                    },
                  ]}
                />
              </section>
            </>
          )}
          {tab === "activity" && admin && (
            <section className="workspace-panel">
              <h2>Mandatory credit-reference search log</h2>
              <DataTable
                rows={state.searches}
                rowKey={(r) => r.id}
                label="All logged reference requests"
                columns={[
                  { label: "ISP", cell: (r) => organisation(r.organisationId) },
                  { label: "Customer query", cell: (r) => r.customer },
                  { label: "Declared purpose", cell: (r) => r.purpose },
                  {
                    label: "Requested",
                    cell: (r) => new Date(r.date).toLocaleString(),
                  },
                  { label: "Result count", cell: (r) => r.matches.length },
                ]}
              />
            </section>
          )}
          {tab === "activity" && admin && (
            <section className="workspace-panel">
              <h2>Confidential service performance</h2>
              <p>
                Aggregated counts only. No customer identities, contract terms
                or mixed-currency monetary totals.
              </p>
              <DataTable
                rows={creditStatuses.map((status) => ({
                  status,
                  count: state.records.filter((r) => r.status === status)
                    .length,
                }))}
                rowKey={(r) => r.status}
                label="Aggregated payment outcomes"
                columns={[
                  { label: "Stage", cell: (r) => r.status },
                  { label: "Cases", cell: (r) => r.count },
                ]}
              />
              <p>
                {state.searches.length} logged reference requests ·{" "}
                {state.references.length} satisfactory histories recorded
                separately.
              </p>
            </section>
          )}
          {tab === "disputes" && admin && (
            <section className="workspace-panel">
              <h2>Customer record requests & appeals</h2>
              <p>
                Verify the requester's identity through the approved process
                before releasing any record. No record is returned
                automatically.
              </p>
              <DataTable
                rows={state.requests}
                rowKey={(r) => r.id}
                label="Customer requests"
                columns={[
                  { label: "Reference", cell: (r) => r.id },
                  { label: "Customer", cell: (r) => r.name },
                  { label: "Type", cell: (r) => r.kind },
                  { label: "Status", cell: (r) => r.status },
                  {
                    label: "Action",
                    cell: (r) => (
                      <Button
                        kind="secondary"
                        onClick={() => setSelected(r.id)}
                      >
                        Handle request
                      </Button>
                    ),
                  },
                ]}
              />
            </section>
          )}
        </>
      )}
      {selectedRecord && (
        <CreditCase
          record={selectedRecord}
          actor={actor}
          onClose={() => setSelected("")}
        />
      )}
      {admin && state.requests.some((r) => r.id === selected) && (
        <Dialog title="Handle customer request" onClose={() => setSelected("")}>
          <p>{state.requests.find((r) => r.id === selected)?.reason}</p>
          <p>
            Reply contact:{" "}
            {state.requests.find((r) => r.id === selected)?.contact}
          </p>
          <p>
            Review the request and confirm the response. Saving an update does
            not release private records.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const f = new FormData(event.currentTarget)
              try {
                creditService.dispatch(actor, {
                  type: "request-status",
                  id: selected,
                  status: String(f.get("status")) as "Responded",
                  response: String(f.get("response") || ""),
                })
                setSelected("")
                setSuccess("Request updated. Email delivery is pending.")
              } catch (e) {
                setError((e as Error).message)
              }
            }}
          >
            <FormField
              name="status"
              label="Request status"
              options={["Identity verification needed", "Responded"]}
              required
            />
            <FormField
              name="response"
              label="Response / verification instructions"
              multiline
              required
            />
            <Button type="submit">Save request update</Button>
          </form>
        </Dialog>
      )}
    </>
  )
}
