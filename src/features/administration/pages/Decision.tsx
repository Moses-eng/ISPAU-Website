import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import RequiredText from "@/features/membership/components/RequiredText"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function Decision({
  go,
  mode = "decision",
}: {
  go: (v: View) => void
  mode?: "review" | "decision"
}) {
  const [decision, setDecision] = useState(false)
  const [decisionReason, setDecisionReason] = useState("")
  const [finalTier, setFinalTier] = useState("Silver")
  const [pendingOutcome, setPendingOutcome] = useState<
    "Approve" | "Defer" | "Decline" | null
  >(null)
  const [decisionError, setDecisionError] = useState("")
  const [recordedOutcome, setRecordedOutcome] = useState("")
  const isDecision = mode === "decision"
  const requestOutcome = (outcome: "Approve" | "Defer" | "Decline") => {
    if (!decisionReason.trim() || !finalTier) {
      setDecisionError(
        "Record a reason and confirm the final tier before continuing.",
      )
      return
    }
    setDecisionError("")
    setPendingOutcome(outcome)
  }
  return (
    <Portal
      go={go}
      active={isDecision ? "Awaiting decision" : "Applications"}
      role={isDecision ? "Decision maker" : "Membership coordinator"}
    >
      <button
        className="back-link"
        onClick={() => go(isDecision ? "decision" : "staff")}
      >
        ← {isDecision ? "Decision queue" : "Application queue"}
      </button>
      <PortalHeading
        eyebrow="ISPAU-APP-2026-0018 · Sample data"
        title="Example Network Services Ltd"
        text="Application review and decision record"
        action={
          !isDecision ? (
            <>
              <Button kind="secondary">Request Clarification</Button>
              <Button onClick={() => setDecision(true)}>
                Send for Decision
              </Button>
            </>
          ) : undefined
        }
      />
      {decision && (
        <div className="notice success">
          <Icon name="check" />
          <p>
            <strong>Sent to an authorised decision maker.</strong> The proposed
            final tier is Silver. No automatic approval has occurred.
          </p>
        </div>
      )}
      <div className="detail-tabs">
        <button className="active">Review</button>
        <button>Applicant answers</button>
        <button>Evidence</button>
        <button>Activity history</button>
      </div>
      <div className="portal-grid wide-left">
        <section className="panel">
          <h3>Verification checklist</h3>
          {[
            [
              "Legal entity and registration",
              "Verified",
              "Sarah M. · 14 Mar 2026",
            ],
            ["Operating authorisation", "Verified", "Sarah M. · 14 Mar 2026"],
            ["PDPO evidence", "Not applicable", "Sarah M. · 14 Mar 2026"],
            ["Authority to apply", "Verified", "Sarah M. · 14 Mar 2026"],
          ].map(([a, b, c]) => (
            <div className="check-row" key={a}>
              <span>
                <strong>{a}</strong>
                <small>{c}</small>
              </span>
              <Tag tone={b === "Verified" ? "success" : "neutral"}>{b}</Tag>
              <button>Review</button>
            </div>
          ))}
          {!isDecision && (
            <div className="comparison-panel">
              <span className="eyebrow">Clarification response comparison</span>
              <div>
                <span>
                  <small>Previously supplied</small>
                  <strong>Licence validity not visible</strong>
                </span>
                <span>
                  <small>Applicant response</small>
                  <strong>Valid to 31 Dec 2026 · evidence replaced</strong>
                </span>
              </div>
            </div>
          )}
        </section>
        <aside className="panel decision-summary">
          <h3>Decision summary</h3>
          <dl>
            <dt>Requested tier</dt>
            <dd>Silver</dd>
            <dt>Proposed final tier</dt>
            <dd>Silver</dd>
            <dt>Annual fee</dt>
            <dd>USD 500</dd>
            <dt>Unresolved issues</dt>
            <dd>None</dd>
          </dl>
          {isDecision ? (
            <>
              <RequiredText />
              <label className="field">
                <span>
                  Final membership tier <b aria-hidden="true">*</b>
                </span>
                <select
                  value={finalTier}
                  onChange={(event) => setFinalTier(event.target.value)}
                  required
                >
                  <option>Platinum</option>
                  <option>Silver</option>
                  <option>Associate</option>
                  <option>Affiliate</option>
                </select>
              </label>
              <label className={`field ${decisionError ? "field-error" : ""}`}>
                <span>
                  Recorded reason <b aria-hidden="true">*</b>
                </span>
                <textarea
                  value={decisionReason}
                  onChange={(event) => setDecisionReason(event.target.value)}
                  placeholder="Required for approve, defer or decline"
                  required
                />
                {decisionError && (
                  <small className="inline-error">{decisionError}</small>
                )}
              </label>
              <div className="button-row decision-buttons">
                <Button onClick={() => requestOutcome("Approve")}>
                  Approve
                </Button>
                <Button
                  kind="secondary"
                  onClick={() => requestOutcome("Defer")}
                >
                  Defer
                </Button>
                <Button kind="danger" onClick={() => requestOutcome("Decline")}>
                  Decline
                </Button>
              </div>
              <small>Final tier must be confirmed with every decision.</small>
              {recordedOutcome && (
                <div className="notice success">
                  <Icon name="check" />
                  <p>
                    Decision recorded: <strong>{recordedOutcome}</strong> · Tier{" "}
                    {finalTier}. The membership workflow has been updated.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="notice">
                <Icon name="shield" />
                <p>
                  Admission decisions are restricted to an authorised decision
                  maker. Membership staff can verify and submit only.
                </p>
              </div>
              <RequiredText />
              <Field
                label="Consolidated clarification message"
                as="textarea"
                value="Please provide a current copy of the Public Service Provider licence showing its validity date."
                required
              />
              <div className="template-preview compact">
                <span className="eyebrow">Applicant-facing preview</span>
                <p>
                  We need one consolidated response for application
                  ISPAU-APP-2026-0018. Your existing answers will be preserved.
                </p>
                <Tag>Preview only · not sent</Tag>
              </div>
            </>
          )}
        </aside>
      </div>
      {pendingOutcome && (
        <div className="confirmation-panel" role="dialog" aria-modal="true">
          <div>
            <h2>Confirm {pendingOutcome.toLowerCase()} decision</h2>
            <p>
              This records the outcome, final tier and reason in the authorised
              membership history.
            </p>
            <div className="button-row">
              <Button kind="secondary" onClick={() => setPendingOutcome(null)}>
                Cancel
              </Button>
              <Button
                kind={pendingOutcome === "Decline" ? "danger" : "primary"}
                onClick={() => {
                  setRecordedOutcome(
                    pendingOutcome === "Approve"
                      ? "Approved awaiting payment"
                      : pendingOutcome === "Defer"
                        ? "Deferred"
                        : "Declined",
                  )
                  setPendingOutcome(null)
                }}
              >
                Confirm decision
              </Button>
            </div>
          </div>
        </div>
      )}
    </Portal>
  )
}
