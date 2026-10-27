import { useState, type FormEvent } from "react"
import type { Actor } from "@/features/membership/types/workspace"
import Button from "@/components/ui/Button"
import Dialog from "@/components/dashboard/Dialog"
import FormField from "@/components/dashboard/FormField"
import Timeline from "@/components/dashboard/Timeline"
import EvidencePreview from "@/components/dashboard/EvidencePreview"
import StatusBadge from "@/components/dashboard/StatusBadge"
import { creditService } from "./service"
import { creditStatuses, type CreditCommand, type CreditRecord } from "./model"
type Intent = "notice" | "verify" | "update" | "dispute" | "assign" | "resolve"
export default function CreditCase({
  record: r,
  actor,
  onClose,
}: {
  record: CreditRecord
  actor: Actor
  onClose: () => void
}) {
  const [intent, setIntent] = useState<Intent | null>(null),
    [error, setError] = useState("")
  const admin = actor.kind === "staff" && actor.roles.includes("secretariat")
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const f = new FormData(event.currentTarget),
      v = (n: string) => String(f.get(n) || "").trim()
    let command: CreditCommand
    if (intent === "notice")
      command = { type: "notice", id: r.id, text: v("text") }
    else if (intent === "verify")
      command = {
        type: "verify",
        id: r.id,
        note: v("note"),
        checks: f.has("checks"),
        status: v("status") as "verified overdue",
      }
    else if (intent === "update")
      command = {
        type: "update",
        id: r.id,
        history: v("history"),
        balance: Number(v("balance")),
        requestedStatus: v("status") as (typeof creditStatuses)[number],
      }
    else if (intent === "dispute")
      command = { type: "dispute", id: r.id, reason: v("reason") }
    else if (intent === "assign")
      command = {
        type: "assign",
        id: r.id,
        reviewer: v("reviewer"),
        declaration: v("declaration"),
        independent: f.has("independent"),
      }
    else
      command = {
        type: "resolve",
        id: r.id,
        outcome: v("outcome"),
        status: v("status") as "settled",
        confirmedIndependent: f.has("independent"),
      }
    try {
      creditService.dispatch(actor, command)
      setIntent(null)
      setError("")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const labels: Record<Intent, string> = {
    notice: "Preview customer notice",
    verify: "Verify payment record",
    update: "Record payment update",
    dispute: "Raise a dispute",
    assign: "Assign independent review",
    resolve: "Record independent outcome",
  }
  return (
    <Dialog title={`${r.id} · Case details`} onClose={onClose}>
      <h2>{r.customer}</h2>
      <StatusBadge status={r.status} />
      <p>
        {r.status === "disputed"
          ? "Contested claim — not a confirmed default."
          : r.approved
            ? "Reviewed by ISPAU. Reference access requires a logged request."
            : "Private submission awaiting ISPAU verification."}
      </p>
      <dl className="workspace-record">
        {Object.entries({
          Contract: r.contract,
          "Invoices / due dates": r.invoices,
          "Payment history": r.history,
          Outstanding: `${r.balance.toLocaleString()} ${r.currency}`,
          Reminders: r.reminders,
          "Last update": new Date(r.updatedAt).toLocaleString(),
          Verification: r.verification || "Pending",
          "Customer notice": r.noticeAt
            ? `Prepared ${new Date(r.noticeAt).toLocaleDateString()}`
            : "Not recorded",
          Dispute: r.appealReason || "None",
          "Independent reviewer": r.reviewer || "Not assigned",
          "Conflict declaration": r.conflictDeclaration || "Not recorded",
          Outcome: r.outcome || "Not recorded",
        }).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <h3>Evidence</h3>
      {r.evidence.length ? (
        r.evidence.map((f) => <EvidencePreview key={f.id} file={f} />)
      ) : (
        <p>No supporting documents are available for this record.</p>
      )}
      <div className="flex flex-wrap gap-3 my-5">
        {(admin
          ? [
              "notice",
              ...(r.status === "disputed" ? ["assign", "resolve"] : ["verify"]),
            ]
          : ["update", "dispute"]
        ).map((x) => (
          <Button
            key={x}
            kind="secondary"
            onClick={() => {
              setError("")
              setIntent(x as Intent)
            }}
          >
            {labels[x as Intent]}
          </Button>
        ))}
      </div>
      <Timeline items={r.activity} />
      {intent && (
        <Dialog title={labels[intent]} onClose={() => setIntent(null)}>
          <form onSubmit={submit}>
            <p>* Required</p>
            {error && (
              <p role="alert" className="workspace-feedback error">
                {error}
              </p>
            )}
            {intent === "notice" && (
              <>
                <FormField
                  name="text"
                  label="Customer notice preview"
                  multiline
                  required
                  value={`A payment record has been submitted for ${r.customer}, reference ${r.id}. Please contact the reporting ISP or Secretariat to pay, correct or dispute the record. `}
                />
                <p>
                  This prepares the customer notice. Email delivery is pending.
                </p>
              </>
            )}
            {intent === "verify" && (
              <>
                <FormField
                  name="note"
                  label="Verification findings"
                  multiline
                  required
                />
                <FormField
                  name="status"
                  label="Verified status"
                  options={[
                    "verified overdue",
                    "disputed",
                    "repayment arrangement",
                    "settled",
                  ]}
                  required
                />
                <label className="flex items-start gap-3 my-5">
                  <input type="checkbox" name="checks" required />
                  <span>
                    I checked customer identity, evidence completeness, invoice
                    due dates and whether the amount is acknowledged or
                    disputed. *
                  </span>
                </label>
                <p>
                  Customer notice must be recorded before approval. Uploaded
                  evidence alone does not prove a default.
                </p>
              </>
            )}
            {intent === "update" && (
              <>
                <FormField
                  name="history"
                  label="Payment history / update"
                  multiline
                  required
                  value={r.history}
                />
                <label className="field">
                  <span>Outstanding balance *</span>
                  <input
                    name="balance"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={r.balance}
                    required
                  />
                </label>
                <FormField
                  name="status"
                  label="Reported payment position"
                  options={[
                    "verified overdue",
                    "disputed",
                    "repayment arrangement",
                    "settled",
                  ]}
                  required
                />
                <p>
                  Updates return for verification. They cannot publish or settle
                  a record automatically.
                </p>
              </>
            )}
            {intent === "dispute" && (
              <FormField
                name="reason"
                label="Dispute or appeal reason"
                multiline
                required
              />
            )}
            {intent === "assign" && (
              <>
                <FormField
                  name="reviewer"
                  label="Independent reviewer name"
                  required
                />
                <FormField
                  name="declaration"
                  label="Reviewer conflict-of-interest declaration"
                  multiline
                  required
                />
                <label className="flex items-start gap-3 my-5">
                  <input name="independent" type="checkbox" required />
                  <span>
                    The assigned reviewer is independent of ISPAU administration
                    and the reporting ISP and has declared conflicts. *
                  </span>
                </label>
              </>
            )}
            {intent === "resolve" && (
              <>
                <FormField
                  name="outcome"
                  label="Independent review outcome and reasons"
                  multiline
                  required
                />
                <FormField
                  name="status"
                  label="Outcome status"
                  options={[
                    "verified overdue",
                    "repayment arrangement",
                    "settled",
                  ]}
                  required
                />
                <label className="flex items-start gap-3 my-5">
                  <input name="independent" type="checkbox" required />
                  <span>
                    I am recording the assigned independent reviewer's
                    documented outcome, not substituting an administrative
                    decision. *
                  </span>
                </label>
              </>
            )}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button type="submit">
                {intent === "notice" ? "Prepare customer notice" : "Confirm"}
              </Button>
              <Button kind="secondary" onClick={() => setIntent(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </Dialog>
  )
}
