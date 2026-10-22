import type { ApplicationStatus } from "@/types/ApplicationStatus"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { applicationStatusContent } from "@/features/membership/data/applicationStatusContent"
import { useState } from "react"

export default function ApplicantStateWorkspace({
  go,
}: {
  go: (v: View) => void
}) {
  const [status, setStatus] = useState<ApplicationStatus>(
    "Clarification needed",
  )
  const content = applicationStatusContent[status]
  const paymentStatus =
    status === "Approved awaiting payment"
      ? "Awaiting payment"
      : status === "Active"
        ? "Confirmed by Accounts"
        : "Not yet due"
  return (
    <Portal go={go} active="My application" role="Applicant">
      <PortalHeading
        eyebrow="ISPAU-APP-2026-0018 · Sample data"
        title="Your Membership Application"
        text="Example Network Services Ltd"
      />
      <div className="state-preview-control">
        <label>
          <span>Application state preview</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ApplicationStatus)
            }
          >
            {Object.keys(applicationStatusContent).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <small>
          State preview for this front-end. Production status changes require an
          authorised workflow action.
        </small>
      </div>
      <div className="status-panel">
        <div>
          <Tag tone={content.tone}>{status}</Tag>
          <h2>{content.title}</h2>
          <p>{content.text}</p>
          {status === "Draft" && (
            <Button onClick={() => go("apply")}>Resume application</Button>
          )}
          {status === "Clarification needed" && (
            <Button onClick={() => go("clarification")}>
              Review requested changes
            </Button>
          )}
          {status === "Approved awaiting payment" && (
            <Button onClick={() => go("applicant-invoices")}>
              View proforma invoice
            </Button>
          )}
          {status === "Active" && (
            <Button onClick={() => go("welcome")}>Open welcome notice</Button>
          )}
        </div>
        <dl>
          <dt>Application reference</dt>
          <dd>ISPAU-APP-2026-0018</dd>
          <dt>Requested tier</dt>
          <dd>Silver</dd>
          <dt>Approved tier</dt>
          <dd>
            {["Approved awaiting payment", "Active"].includes(status)
              ? "Silver"
              : "Pending decision"}
          </dd>
          <dt>Application status</dt>
          <dd>{status}</dd>
          <dt>Payment status</dt>
          <dd>{paymentStatus}</dd>
        </dl>
      </div>
      <div className="portal-grid">
        <section className="panel">
          <h3>Recorded progress</h3>
          <div className="timeline">
            <div className="done">
              <span>
                <Icon name="check" size={14} />
              </span>
              <strong>Application created</strong>
              <small>6 Mar 2026</small>
            </div>
            {status !== "Draft" && (
              <div className="done">
                <span>
                  <Icon name="check" size={14} />
                </span>
                <strong>Submitted</strong>
                <small>8 Mar 2026</small>
              </div>
            )}
            <div className="current">
              <span />
              <strong>{status}</strong>
              <small>Current recorded state</small>
            </div>
          </div>
        </section>
        <section className="panel">
          <h3>Documents and correspondence</h3>
          <div className="applicant-links">
            <button onClick={() => go("applicant-invoices")}>
              <Icon name="file" />
              <span>
                <strong>Invoices and payment</strong>
                <small>Proforma, payment status and tax invoice</small>
              </span>
              <Icon name="arrow" />
            </button>
            <button>
              <Icon name="file" />
              <span>
                <strong>Acknowledgement</strong>
                <small>Application receipt · 8 Mar 2026</small>
              </span>
              <Icon name="arrow" />
            </button>
          </div>
        </section>
      </div>
    </Portal>
  )
}
