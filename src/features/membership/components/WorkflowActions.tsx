import { useEffect, useState, useMemo } from "react"
import Button from "@/components/ui/Button"
import Dialog from "@/components/dashboard/Dialog"
import FormField from "@/components/dashboard/FormField"
import { can, tierOptions, verificationLabels } from "@/config/workspace"
import { membershipService } from "@/services/membershipService"
import { acceptFile } from "@/features/membership/services/files"
import applicationService, {
  type ApplicationStatus,
} from "@/apiServices/applicationService"
import systemUserAuthStore from "@/apiServices/systemUserAuthStore"
import type {
  Actor,
  Application,
  Command,
  Invoice,
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
  const [busy, setBusy] = useState(false)

  useEffect(() => setError(""), [intent])

  // ------------------------------------------------------------------
  // Role helpers — read directly from the system user store so the
  // visibility rules are tied to the signed-in system user, not the
  // loosely-typed `actor` prop.
  // ------------------------------------------------------------------
  const currentUser = systemUserAuthStore.getUser()
  const currentRole = currentUser?.role ?? ""

  const isSuperAdmin = currentRole === "super_admin"
  const isOperationsOfficer = currentRole === "operations_officer"

  // Record verification / Request clarification: operations_officer + super_admin
  const canRecordVerification = isSuperAdmin || isOperationsOfficer
  const canRequestClarification = isSuperAdmin || isOperationsOfficer

  // Confirm Application: super_admin only
  const canConfirmApplication = isSuperAdmin

  // ------------------------------------------------------------------
  // Verification completeness — all three checks must be "Verified":
  //   registration, authority, regulatory.
  //
  // Primary source: the raw backend shape under `verifications[last].checks`.
  // Fallback: the flattened `a.verifications` array (label-based), with a
  // correct fragment map — the regulatory check's human label contains
  // "licence"/"license", not "regulatory".
  // ------------------------------------------------------------------
  const verificationComplete = useMemo(() => {
    const required = ["registration", "authority", "regulatory"] as const

    // 1) Raw backend shape — matches the API payload exactly.
    const rawSource: any = (a as any)?.raw ?? a
    const rawVerifs: any[] = rawSource?.verifications ?? []
    const latest = rawVerifs.length ? rawVerifs[rawVerifs.length - 1] : null
    const checks = latest?.checks

    if (checks && typeof checks === "object") {
      return required.every((key) => checks[key]?.result === "Verified")
    }

    // 2) Fallback — flattened list from ApplicationReview's
    //    flattenVerifications(), matched by label fragments.
    const flattened: any[] = Array.isArray(a.verifications)
      ? a.verifications
      : []

    const keyToLabel: Record<(typeof required)[number], string[]> = {
      registration: ["registration", "establishment"],
      authority: ["authority"],
      regulatory: ["regulatory", "licence", "license"],
    }

    return required.every((key) =>
      flattened.some((v) => {
        const label = String(v.label || "").toLowerCase()
        const matches = keyToLabel[key].some((frag) => label.includes(frag))
        return matches && v.result === "Verified"
      }),
    )
  }, [a])

  const isActive = a.stage === "Active"

  /** Legacy store dispatch — used only for intents with no API yet. */
  const executeStore = (command: Command) => {
    try {
      membershipService.dispatch(actor, command)
      feedback("Changes saved. Related records have been updated.")
      setIntent("")
    } catch (e) {
      setError((e as Error).message)
      feedback((e as Error).message, true)
    }
  }

  const submit = async (form: HTMLFormElement) => {
    const data = new FormData(form)
    const text = (name: string) => String(data.get(name) || "")

    setBusy(true)
    setError("")

    try {
      // ---------------------------- VERIFICATION ----------------------------
      if (intent === "Record verification") {
        if (verificationComplete) {
          throw new Error(
            "Verification is already complete for this application.",
          )
        }

        const payload = {
          applicationId: a.id,
          reviewerId: actor.id,
          reviewerName: actor.name,
          assignedByName: actor.name,
          assigned_by: actor.id,
          "result-0": text("result-0") || "",
          "note-0": text("note-0"),
          "result-1": text("result-1") || "",
          "note-1": text("note-1"),
          "result-2": text("result-2") || "",
          "note-2": text("note-2"),
        }

        if (
          !payload["note-0"].trim() ||
          !payload["note-1"].trim() ||
          !payload["note-2"].trim()
        ) {
          throw new Error("A note is required for every verification item.")
        }

        const res = await applicationService.recordVerification(payload)
        if (!res.success) throw new Error(res.message)

        feedback("Verification recorded.")
        setIntent("")
        return
      }

      // --------------------------- CLARIFICATION ---------------------------
      if (intent === "Request clarification") {
        if (isActive) {
          throw new Error(
            "Clarifications cannot be requested for an Active application.",
          )
        }

        const items = text("corrections")
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean)

        if (!items.length) throw new Error("Add at least one correction.")

        const applicantEmail =
          String(a.values?.applicantEmail || a.values?.businessEmail || "").trim()

        const applicantName =
          String(a.values?.applicantName || a.organisation || "Applicant").trim()

        const res = await applicationService.raiseClarification({
          applicationId: a.id,
          assigned_by: actor.id,
          reviewerId: actor.id,
          reviewerName: actor.name,
          assignedByName: actor.name,
          subject: text("subject") || "Clarification requested",
          message: items.join("\n"),
          items,
          applicantEmail,
          applicantName,
        })
        if (!res.success) throw new Error(res.message)

        feedback("Clarification request sent to applicant.")
        setIntent("")
        return
      }

      // ------------------------ CONFIRM APPLICATION ------------------------
      if (intent === "Confirm Application") {
        if (isActive) {
          throw new Error("Application is already Active.")
        }
        if (!verificationComplete) {
          throw new Error(
            "Record a verification with all checks marked Verified before confirming.",
          )
        }

        const nextStatus = (
          text("status") || "Decision pending"
        ) as ApplicationStatus

        const res = await applicationService.update(a.id, {
          status: nextStatus,
        })
        if (!res.success) throw new Error(res.message)

        feedback(`Application status updated to "${nextStatus}".`)
        setIntent("")
        return
      }

      // ---------------------- LEGACY / NON-SATELLITE ----------------------
      let command: Command

      if (["Approve", "Defer", "Decline"].includes(intent)) {
        command = {
          type: "decide",
          id: a.id,
          outcome: intent as "Approve" | "Defer" | "Decline",
          reason: text("reason"),
          tier: text("tier"),
          amount: Number(text("amount")),
          currency: text("currency"),
        }
      } else if (intent === "Record payment details") {
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
        if (!file?.size) throw new Error("Choose the tax invoice file.")
        command = {
          type: "tax-invoice",
          id: a.id,
          file: acceptFile(file, "taxInvoice"),
        }
      } else if (
        intent === "Activate membership" ||
        intent === "Confirm payment received"
      ) {
        command = {
          type: intent === "Activate membership" ? "activate" : "confirm-payment",
          id: a.id,
        }
      } else {
        return
      }

      executeStore(command)
    } catch (e) {
      const message = (e as Error).message
      setError(message)
      feedback(message, true)
    } finally {
      setBusy(false)
    }
  }

  // ------------------------------------------------------------------
  // Determine available workflow action buttons (role-gated)
  // ------------------------------------------------------------------
  const buttons: string[] = []

  if (can(actor, "applications.review")) {
    if (canRecordVerification) buttons.push("Record verification")
    if (canRequestClarification) buttons.push("Request clarification")
    if (canConfirmApplication) buttons.push("Confirm Application")

    if (
      can(actor, "membership.activate") &&
      a.stage === "Approved awaiting payment"
    )
      buttons.push("Activate membership")
  }
  if (can(actor, "applications.decide") && a.stage === "Decision pending")
    buttons.push("Approve", "Defer", "Decline")
  if (invoice && invoice.status !== "Confirmed" && can(actor, "billing.manage"))
    buttons.push("Record payment details")
  if (invoice?.status === "Receipt submitted" && can(actor, "payments.confirm"))
    buttons.push("Confirm payment received")
  if (invoice?.status === "Confirmed" && can(actor, "billing.manage"))
    buttons.push("Upload tax invoice")

  // ------------------------------------------------------------------
  // Per-button disabled logic
  // ------------------------------------------------------------------
  const isButtonDisabled = (label: string): boolean => {
    if (busy) return true

    if (label === "Record verification") {
      // Disabled only when ALL three checks are Verified.
      // Stays enabled if any check is not Verified.
      return verificationComplete
    }

    if (label === "Request clarification") {
      // Clarifications are not raised against an Active application.
      return isActive
    }

    if (label === "Confirm Application") {
      // Cannot confirm an application that's already Active, and cannot
      // confirm until all three verification checks are Verified.
      if (isActive) return true
      if (!verificationComplete) return true
    }

    if (label === "Activate membership") {
      return (
        invoice?.status !== "Confirmed" ||
        !a.decisions.some((d) => d.outcome === "Approve")
      )
    }

    return false
  }

  const buttonTitle = (label: string): string | undefined => {
    if (label === "Record verification" && verificationComplete)
      return "All verification checks are already Verified."
    if (label === "Request clarification" && isActive)
      return "Clarifications cannot be requested for an Active application."
    if (label === "Confirm Application") {
      if (isActive) return "This application is already Active."
      if (!verificationComplete)
        return "Record a verification with all checks Verified first."
    }
    if (label === "Activate membership" && invoice?.status !== "Confirmed")
      return "Accounts must confirm payment first"
    return undefined
  }

  return (
    <>
      <div className="workspace-actions">
        {buttons.map((label) => (
          <Button
            key={label}
            kind={label === "Decline" ? "danger" : "secondary"}
            disabled={isButtonDisabled(label)}
            title={buttonTitle(label)}
            onClick={() => setIntent(label)}
          >
            {label}
          </Button>
        ))}
      </div>

      {can(actor, "membership.activate") &&
        a.stage === "Approved awaiting payment" &&
        (invoice?.status !== "Confirmed" ||
          !a.decisions.some((d) => d.outcome === "Approve")) && (
          <p className="workspace-help">
            An approved admission decision and confirmed payment are required
            before activation.
          </p>
        )}

      {intent && (
        <Dialog
          title={intent}
          onClose={() => (busy ? undefined : setIntent(""))}
        >
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
              if (!busy) submit(event.currentTarget)
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
                  name="subject"
                  label="Subject"
                  required
                  value="Clarification requested"
                />
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

            {intent === "Confirm Application" && (
              <>
                <FormField
                  name="status"
                  label="Application status"
                  required
                  options={[
                    "Decision pending",
                    "Under review",
                    "Approved awaiting payment",
                    "Active",
                    "Deferred",
                    "Declined",
                  ]}
                  value={a.stage === "Submitted" ? "Decision pending" : a.stage}
                />
                <p>
                  Confirming this application updates its status in the system to
                  allow the next workflow stage.
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

            {["Activate membership", "Confirm payment received"].includes(
              intent,
            ) && (
              <p>
                Confirm this action for {a.organisation}. Permission and
                workflow conditions are checked before saving.
              </p>
            )}

            <div className="workspace-actions">
              <Button
                kind="secondary"
                onClick={() => (busy ? undefined : setIntent(""))}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy
                  ? "Saving…"
                  : intent === "Confirm Application"
                    ? "Confirm application"
                    : `Confirm ${intent.toLowerCase()}`}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  )
}
