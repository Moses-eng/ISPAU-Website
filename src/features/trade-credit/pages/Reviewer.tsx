import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function Reviewer({ go }: { go: (v: View) => void }) {
  const [conflict, setConflict] = useState(false)
  return (
    <Portal go={go} active="Assigned disputes" role="Independent reviewer">
      <PortalHeading
        title="Assigned Disputes"
        text="Review evidence, declarations and case history independently."
      />
      {conflict ? (
        <div className="success-panel">
          <Icon name="check" />
          <h2>Conflict declared. Reassignment requested.</h2>
          <p>
            Case TC-2026-0038 is no longer available for outcome recording by
            this reviewer.
          </p>
          <Button kind="secondary" onClick={() => setConflict(false)}>
            Return to assignments
          </Button>
        </div>
      ) : (
        <>
          <section className="panel dispute-head">
            <div>
              <Tag tone="warning">Disputed</Tag>
              <h2>Cobalt Office Parks Ltd</h2>
              <p>TC-2026-0038 · Repayment arrangement challenged</p>
            </div>
            <Button kind="danger" onClick={() => setConflict(true)}>
              Declare a Conflict
            </Button>
          </section>
          <div className="portal-grid wide-left">
            <section className="panel">
              <h3>Customer explanation</h3>
              <p>
                The customer states that a payment made on 10 March has not been
                allocated and asks for the current balance to be corrected.
              </p>
              <div className="file-row">
                <Icon name="lock" />
                <span>
                  <strong>payment-advice-100326.pdf</strong>
                  <small>Customer evidence · Restricted</small>
                </span>
                <button>View</button>
              </div>
              <h3>Case evidence and timeline</h3>
              <div className="timeline compact">
                <div className="done">
                  <span>
                    <Icon name="check" size={13} />
                  </span>
                  <strong>Record verified overdue</strong>
                  <small>28 Feb 2026</small>
                </div>
                <div className="done">
                  <span>
                    <Icon name="check" size={13} />
                  </span>
                  <strong>Repayment arrangement recorded</strong>
                  <small>5 Mar 2026</small>
                </div>
                <div className="current">
                  <span />
                  <strong>Dispute received</strong>
                  <small>12 Mar 2026</small>
                </div>
              </div>
            </section>
            <aside className="panel">
              <h3>Record outcome</h3>
              <Field
                label="Outcome"
                as="select"
                options={[
                  "Uphold record",
                  "Correct record",
                  "Return for more information",
                ]}
              />
              <Field
                label="Reason and instructions"
                as="textarea"
                placeholder="Required decision record"
              />
              <label className="checkbox">
                <input type="checkbox" />
                <span>
                  I declare no conflict and confirm an independent review.
                </span>
              </label>
              <Button>Record Outcome</Button>
            </aside>
          </div>
        </>
      )}
    </Portal>
  )
}
