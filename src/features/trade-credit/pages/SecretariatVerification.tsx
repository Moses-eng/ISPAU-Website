import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function SecretariatVerification({
  go,
}: {
  go: (v: View) => void
}) {
  return (
    <Portal
      go={go}
      active="Trade Credit verification"
      role="Secretariat / Administrator"
    >
      <PortalHeading
        title="Trade Credit Verification"
        text="Verify submissions, issue notices and process authorised updates."
      />
      <div className="stats">
        {[
          ["4", "New submissions", "Identity and evidence review"],
          ["2", "Missing evidence", "Member response required"],
          ["3", "Notices required", "Not yet eligible for sharing"],
          ["5", "Updates to process", "Payment or settlement changes"],
        ].map(([a, b, c]) => (
          <div className="stat" key={b}>
            <span>{b}</span>
            <strong>{a}</strong>
            <small>{c}</small>
          </div>
        ))}
      </div>
      <div className="portal-grid wide-left">
        <section className="panel">
          <div className="table-tools">
            <div>
              <h3>Submission review</h3>
              <p>TC-2026-0042 · Sample data</p>
            </div>
            <Tag tone="info">Under verification</Tag>
          </div>
          {[
            ["Business identity", "Mirembe Business Systems Ltd"],
            ["Contract completeness", "Contract ENS-MBS-2025-144 supplied"],
            ["Overdue amount", "UGX 8,450,000"],
            ["Claim response", "Notice not yet issued"],
          ].map(([a, b]) => (
            <div className="check-row" key={a}>
              <span>
                <strong>{a}</strong>
                <small>{b}</small>
              </span>
              <Tag>Review required</Tag>
              <button>Open</button>
            </div>
          ))}
        </section>
        <aside className="panel decision-summary">
          <h3>Verification outcome</h3>
          <Field
            label="Completeness"
            as="select"
            options={[
              "Complete for notice",
              "Request missing information",
              "Return to submitting member",
            ]}
          />
          <Field
            label="Review note"
            as="textarea"
            placeholder="Record the evidence-based reason"
          />
          <div className="notice">
            <Icon name="shield" />
            <p>
              Verification does not automatically publish or release a record.
              Sharing eligibility remains configurable.
            </p>
          </div>
          <Button>Record Verification Outcome</Button>
        </aside>
      </div>
    </Portal>
  )
}
