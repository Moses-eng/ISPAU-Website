import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import Dialog from "@/components/dashboard/Dialog"
import FormField from "@/components/dashboard/FormField"
import { can, tierOptions, verificationLabels } from "@/config/workspace"
import { membershipService } from "@/services/membershipService"
import { acceptFile } from "@/features/membership/services/files"
import type {
  Actor,
  Application,
  Command,
  Invoice,
  Verification,
} from "../types/workspace"
export default function WorkflowActions({
  application: a,
  actor,
  invoice,
  feedback,
}: {
  application: Application
  actor: Actor
  invoice?: Invoice
  feedback: (message: string, error?: boolean) => void
}) {
  const [intent, setIntent] = useState("")
  const [error, setError] = useState("")
  useEffect(() => setError(""), [intent])
  const execute = (command: Command) => {
    try {
      membershipService.dispatch(actor, command)
      feedback("Changes saved. Related records have been updated.")
      setIntent("")
    } catch (e) {
      setError((e as Error).message)
      feedback((e as Error).message, true)
    }
  }
  const submit = (form: HTMLFormElement) => {
    const data = new FormData(form),
      text = (name: string) => String(data.get(name) || "")
    let command: Command
    try {
      if (intent === "Record verification")
        command = {
          type: "verify",
          id: a.id,
          results: verificationLabels.map((label, i) => ({
            label,
            result: text(`result-${i}`) as Verification["result"],
            note: text(`note-${i}`),
            reviewer: actor.name,
            date: new Date().toISOString(),
          })),
        }
      else if (intent === "Request clarification")
        command = {
          type: "clarify",
          id: a.id,
          items: text("corrections")
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean),
        }
      else if (["Approve", "Defer", "Decline"].includes(intent))
        command = {
          type: "decide",
          id: a.id,
          outcome: intent as "Approve" | "Defer" | "Decline",
          reason: text("reason"),
          tier: text("tier"),
          amount: Number(text("amount")),
          currency: text("currency"),
        }
      else if (intent === "Record payment details") {
        const file = data.get("file") as File
        command = {
          type: "payment",
          id: a.id,
          reference: text("reference"),
          date: text("date"),
          receipt: file?.size ? acceptFile(file, "paymentReceipt") : undefined,
        }
      } else if (intent === "Upload tax invoice") {
        const file = data.get("file") as File
        if (!file?.size) throw Error("Choose the tax invoice file.")
        command = {
          type: "tax-invoice",
          id: a.id,
          file: acceptFile(file, "taxInvoice"),
        }
      } else if (intent === "Respond to request")
        command = { type: "respond", id: a.id, response: text("response") }
      else if (intent === "Assign reviewer")
        command = { type: "reviewer", id: a.id, reviewer: text("reviewer") }
      else
        command = {
          type:
            intent === "Activate membership"
              ? "activate"
              : intent === "Confirm payment received"
                ? "confirm-payment"
                : "send-decision",
          id: a.id,
        }
      execute(command)
    } catch (e) {
      setError((e as Error).message)
      feedback((e as Error).message, true)
    }
  }
  const buttons: string[] = []
  if (can(actor, "membership")) {
    if (a.stage === "Submitted") buttons.push("Start review")
    if (["Under review", "Clarification needed"].includes(a.stage))
      buttons.push("Record verification", "Request clarification")
    if (a.stage === "Under review") buttons.push("Send for decision")
    if (a.stage === "Approved awaiting payment")
      buttons.push("Activate membership")
    buttons.push("Assign reviewer")
  }
  if (can(actor, "decision") && a.stage === "Decision pending")
    buttons.push("Approve", "Defer", "Decline")
  if (
    invoice &&
    invoice.status !== "Confirmed" &&
    (can(actor, "accounts") || actor.kind === "organisation")
  )
    buttons.push("Record payment details")
  if (invoice?.status === "Receipt submitted" && can(actor, "accounts"))
    buttons.push("Confirm payment received")
  if (invoice?.status === "Confirmed" && can(actor, "secretariat"))
    buttons.push("Upload tax invoice")
  if (actor.kind === "organisation" && a.stage === "Clarification needed")
    buttons.push("Respond to request")
  return (
    <>
      <div className="workspace-actions">
        {buttons.map((label) => (
          <Button
            key={label}
            kind={label === "Decline" ? "danger" : "secondary"}
            disabled={
              label === "Activate membership" && invoice?.status !== "Confirmed"
            }
            title={
              label === "Activate membership" && invoice?.status !== "Confirmed"
                ? "Accounts must confirm payment first"
                : undefined
            }
            onClick={() =>
              label === "Start review"
                ? execute({ type: "start-review", id: a.id })
                : setIntent(label)
            }
          >
            {label}
          </Button>
        ))}
      </div>
      {intent && (
        <Dialog title={intent} onClose={() => setIntent("")}>
          <p className="workspace-help">
            {a.organisation} · {a.id} · * Required.
          </p>
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit(event.currentTarget)
            }}
            className="workspace-form"
          >
            {intent === "Record verification" &&
              verificationLabels.map((label, i) => (
                <fieldset key={label}>
                  <legend>{label}</legend>
                  <FormField
                    name={`result-${i}`}
                    label="Result"
                    required
                    options={[
                      "Verified",
                      "Clarification needed",
                      "Not applicable",
                    ]}
                    value={
                      a.verifications.find((v) => v.label === label)?.result ||
                      "Clarification needed"
                    }
                  />
                  <FormField
                    name={`note-${i}`}
                    label="Review note / explanation"
                    required
                    multiline
                    value={a.verifications.find((v) => v.label === label)?.note}
                  />
                </fieldset>
              ))}
            {intent === "Request clarification" && (
              <>
                <FormField
                  name="corrections"
                  label="Requested corrections (one per line)"
                  required
                  multiline
                />
                <p>
                  The consolidated message above is the applicant's request
                  preview. Confirm only after reviewing every correction. The
                  message will be prepared for delivery.
                </p>
              </>
            )}
            {["Approve", "Defer", "Decline"].includes(intent) && (
              <>
                <FormField
                  name="reason"
                  label="Decision reason communicated to applicant"
                  required
                  multiline
                />
                {intent === "Approve" && (
                  <>
                    <FormField
                      name="tier"
                      label="Confirmed final tier"
                      required
                      options={tierOptions}
                      value={a.requestedTier}
                    />
                    <FormField
                      name="amount"
                      label="Approved membership fee"
                      required
                      type="number"
                    />
                    <FormField
                      name="currency"
                      label="Currency"
                      required
                      options={["UGX", "USD"]}
                      value="UGX"
                    />
                    <p>
                      Confirm the approved fee and currency before recording the
                      decision.
                    </p>
                  </>
                )}
              </>
            )}
            {intent === "Record payment details" && (
              <>
                <FormField
                  name="reference"
                  label="Payment reference"
                  required
                  value={invoice?.paymentReference}
                />
                <FormField
                  name="date"
                  label="Payment date"
                  required
                  type="date"
                  value={invoice?.paymentDate}
                />
                <label className="field">
                  Receipt (optional; PDF/JPG/PNG, up to 10 MB)
                  <input
                    type="file"
                    name="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                <p>
                  A receipt alone does not confirm payment or activate
                  membership.
                </p>
              </>
            )}
            {intent === "Upload tax invoice" && (
              <label className="field">
                Tax invoice *
                <input
                  name="file"
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <small>
                  PDF/JPG/PNG, up to 10 MB. Re-select the file after refreshing
                  the page.
                </small>
              </label>
            )}
            {intent === "Respond to request" && (
              <>
                {a.clarifications
                  .filter((c) => !c.response)
                  .map((c) => (
                    <ul key={c.id}>
                      {c.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ))}
                <FormField
                  name="response"
                  label="Consolidated response to all requested corrections"
                  required
                  multiline
                />
              </>
            )}
            {intent === "Assign reviewer" && (
              <FormField
                name="reviewer"
                label="Assigned reviewer"
                required
                value={a.reviewer === "Unassigned" ? "" : a.reviewer}
              />
            )}
            {[
              "Activate membership",
              "Confirm payment received",
              "Send for decision",
            ].includes(intent) && (
              <p>
                Confirm this action for {a.organisation}. Permission and
                workflow conditions are checked before saving.
              </p>
            )}
            <div className="workspace-actions">
              <Button kind="secondary" onClick={() => setIntent("")}>
                Cancel
              </Button>
              <Button type="submit">Confirm {intent.toLowerCase()}</Button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  )
}
