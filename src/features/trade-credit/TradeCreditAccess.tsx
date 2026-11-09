import { useState, type FormEvent } from "react"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import Button from "@/components/ui/Button"
import FormField from "@/components/dashboard/FormField"
import StatusBadge from "@/components/dashboard/StatusBadge"
import { tradeCreditEligibility } from "./services/access"
import useComplaints from "./services/useComplaints"
import { complaintRequest, downloadEvidence } from "./services/complaintApi"
import type { Review } from "./services/complaints"
import { staffAuditService } from "@/services/staffAuditService"

export default function TradeCreditAccess({
  state,
  actor,
}: {
  state: WorkspaceState
  actor: Actor
}) {
  const { snapshot, error, loading, refresh } = useComplaints(actor)
  const [selected, setSelected] = useState("")
  const [selectedVersion, setSelectedVersion] = useState("")
  const [tab, setTab] = useState("queue")
  const [feedback, setFeedback] = useState("")
  const [failure, setFailure] = useState("")
  const [busy, setBusy] = useState(false)
  const [opened, setOpened] = useState<string[]>([])
  const record = snapshot.records.find((r) => r.id === selected)
  const pending = snapshot.records.filter(
    (r) => !r.approved && !r.reviewOutcome,
  )
  const rows = tab === "queue" ? pending : snapshot.records
  const organisation = (id: string) =>
    state.applications.find((a) => a.organisationId === id)?.organisation || id
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!record || busy) return
    const f = new FormData(event.currentTarget)
    const input: Review = {
      outcome: String(f.get("outcome")) as Review["outcome"],
      note: String(f.get("note") || ""),
      identity: f.has("identity"),
      invoices: f.has("invoices"),
      balance: f.has("balance"),
      notice: f.has("notice"),
      expectedUpdatedAt: selectedVersion,
    }
    if (
      input.outcome === "Approved" &&
      record.evidence.some((f) => !opened.includes(f.id))
    ) {
      setFailure("Open each supporting file before approving this complaint.")
      return
    }
    setBusy(true)
    setFailure("")
    try {
      await complaintRequest(
        actor,
        false,
        `/complaints/${record.id}/review`,
        input,
      )
      staffAuditService.recordTradeCreditReview(actor, record.id, input.outcome)
      await refresh()
      setSelected("")
      setFeedback(
        input.outcome === "Approved"
          ? "Complaint approved. Eligible ISPs can now request a reference."
          : `${input.outcome}. The complaint remains private.`,
      )
    } catch (e) {
      setFailure((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        title="Trade Credit"
        description="Verify private complaints before they become available as authorised references."
      />
      {error && (
        <p className="workspace-feedback error" role="alert">
          {error}{" "}
          <Button kind="ghost" onClick={() => void refresh()}>
            Retry
          </Button>
        </p>
      )}
      {feedback && (
        <p className="workspace-feedback" role="status">
          {feedback}
        </p>
      )}
      <nav className="workspace-actions mb-5" aria-label="Trade Credit views">
        <Button
          kind={tab === "queue" ? "primary" : "secondary"}
          onClick={() => setTab("queue")}
        >
          Awaiting verification
          {pending.length > 0 ? ` (${pending.length})` : ""}
        </Button>
        <Button
          kind={tab === "all" ? "primary" : "secondary"}
          onClick={() => setTab("all")}
        >
          All complaints
        </Button>
        <Button
          kind={tab === "searches" ? "primary" : "secondary"}
          onClick={() => setTab("searches")}
        >
          Reference requests
        </Button>
        <Button
          kind={tab === "isps" ? "primary" : "secondary"}
          onClick={() => setTab("isps")}
        >
          ISP participation
        </Button>
      </nav>
      {(tab === "queue" || tab === "all") && (
        <section className="workspace-panel">
          <h2>
            {tab === "queue"
              ? "Complaints awaiting verification"
              : "Complaint history"}
          </h2>
          {loading ? (
            <p role="status">Loading complaints…</p>
          ) : !rows.length ? (
            <p>
              {tab === "queue"
                ? "No complaints awaiting verification."
                : "No complaints submitted yet."}
            </p>
          ) : (
            <DataTable
              rows={rows}
              rowKey={(r) => r.id}
              label="Private complaint review"
              columns={[
                { label: "Customer", cell: (r) => r.customer },
                {
                  label: "Reporting ISP",
                  cell: (r) => organisation(r.organisationId),
                },
                {
                  label: "Outstanding",
                  cell: (r) => `${r.balance.toLocaleString()} ${r.currency}`,
                },
                {
                  label: "Review",
                  cell: (r) => r.reviewOutcome || "Awaiting verification",
                },
                {
                  label: "Action",
                  cell: (r) => (
                    <Button
                      kind="secondary"
                      onClick={() => {
                        setSelected(r.id)
                        setSelectedVersion(r.updatedAt)
                        setOpened([])
                        setFailure("")
                      }}
                    >
                      Review complaint
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </section>
      )}
      {tab === "searches" && (
        <section className="workspace-panel">
          <h2>Reference request log</h2>
          <DataTable
            rows={snapshot.searches}
            rowKey={(r) => r.id}
            label="Logged credit reference requests"
            columns={[
              { label: "ISP", cell: (r) => organisation(r.organisationId) },
              { label: "Customer", cell: (r) => r.customer },
              { label: "Purpose", cell: (r) => r.purpose },
              {
                label: "Requested",
                cell: (r) => new Date(r.date).toLocaleString(),
              },
              { label: "Matches", cell: (r) => r.matches.length },
            ]}
          />
        </section>
      )}
      {tab === "isps" && (
        <section className="workspace-panel">
          <h2>ISP participation</h2>
          <DataTable
            rows={state.applications.filter((a) => a.stage === "Active")}
            rowKey={(a) => a.id}
            label="ISP Trade Credit access"
            columns={[
              { label: "Organisation", cell: (a) => a.organisation },
              {
                label: "Subscription through",
                cell: (a) =>
                  tradeCreditEligibility(a, state.invoices).validThrough ||
                  a.periodEnd,
              },
              {
                label: "Access",
                cell: (a) =>
                  tradeCreditEligibility(a, state.invoices).allowed
                    ? "Enrolled"
                    : "Paused",
              },
            ]}
          />
        </section>
      )}
      {record && (
        <Dialog
          title="Review complaint"
          onClose={() => {
            if (!busy) setSelected("")
          }}
        >
          <h3>{record.customer}</h3>
          <p>{organisation(record.organisationId)}</p>
          <StatusBadge status={record.status} />
          <dl className="workspace-record">
            {Object.entries({
              Case: record.id,
              Contract: record.contract,
              "Invoices and due dates": record.invoices,
              "Payment history": record.history,
              Outstanding: `${record.balance.toLocaleString()} ${record.currency}`,
              "Reminders and customer response": record.reminders,
              Review: record.reviewOutcome || "Awaiting verification",
              Findings: record.verification || "Not reviewed",
            }).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <h3>Supporting evidence</h3>
          {record.evidence.map((f) => (
            <p key={f.id}>
              <Button
                kind="secondary"
                onClick={async () => {
                  try {
                    await downloadEvidence(
                      actor,
                      false,
                      record.id,
                      f.id,
                      f.name,
                    )
                    setOpened((old) => [...old, f.id])
                    setFailure("")
                  } catch (e) {
                    setFailure((e as Error).message)
                  }
                }}
              >
                Download {f.name}
              </Button>
            </p>
          ))}
          {failure && (
            <p role="alert" className="workspace-feedback error">
              {failure}
            </p>
          )}
          {!record.approved && record.reviewOutcome !== "Declined" && (
            <form onSubmit={review}>
              <FormField
                name="outcome"
                label="Review outcome"
                options={["Approved", "Clarification needed", "Declined"]}
                required
              />
              <FormField
                name="note"
                label="Review findings / reason"
                multiline
                required
              />
              <fieldset className="my-5">
                <legend>Required for approval</legend>
                {[
                  ["identity", "Customer identity and contract checked"],
                  ["invoices", "Invoices, due dates and evidence checked"],
                  [
                    "balance",
                    "Outstanding balance and payment history verified",
                  ],
                  [
                    "notice",
                    "Customer notice and opportunity to respond confirmed",
                  ],
                ].map(([name, label]) => (
                  <label key={name} className="flex items-start gap-3 my-3">
                    <input type="checkbox" name={name} />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              {record.updatedAt !== selectedVersion && (
                <p role="alert">
                  This complaint changed. Close and reopen it before saving a
                  review.
                </p>
              )}
              <Button
                type="submit"
                disabled={busy || record.updatedAt !== selectedVersion}
              >
                {busy ? "Saving…" : "Save review"}
              </Button>
            </form>
          )}
          <h3 className="mt-6">Case activity</h3>
          {record.activity.map((a) => (
            <p key={a.id}>
              <strong>{a.actor}</strong> · {new Date(a.date).toLocaleString()}
              <br />
              {a.text}
            </p>
          ))}
        </Dialog>
      )}
    </>
  )
}
