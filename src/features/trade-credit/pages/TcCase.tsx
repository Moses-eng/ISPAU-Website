import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function TcCase({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Trade Credit" role="ISP member user">
      <button className="back-link" onClick={() => go("tc-dashboard")}>
        ← Your organisation’s records
      </button>
      <PortalHeading
        eyebrow="TC-2026-0042 · Fictional business"
        title="Mirembe Business Systems Ltd"
        text="Contract ENS-MBS-2025-144"
        action={<Button kind="secondary">Submit Payment Update</Button>}
      />
      <div className="notice">
        <Icon name="shield" />
        <p>
          <strong>Your record is under verification.</strong> It is not yet
          available as a verified payment reference.
        </p>
      </div>
      <div className="case-summary">
        <div>
          <span>Current status</span>
          <Tag tone="info">Under verification</Tag>
        </div>
        <div>
          <span>Outstanding balance</span>
          <strong>UGX 8,450,000</strong>
        </div>
        <div>
          <span>Last updated</span>
          <strong>18 Mar 2026</strong>
        </div>
        <div>
          <span>Service</span>
          <strong>Business connectivity</strong>
        </div>
      </div>
      <div className="portal-grid">
        <section className="panel">
          <h3>Invoice summary</h3>
          <div className="invoice-row">
            <span>
              <strong>INV-2026-0142</strong>
              <small>Issued 5 Jan 2026 · Due 4 Feb 2026</small>
            </span>
            <strong>UGX 8,450,000</strong>
          </div>
          <h3>Restricted evidence</h3>
          <div className="file-row">
            <Icon name="lock" />
            <span>
              <strong>invoice-and-reminders.pdf</strong>
              <small>Visible to authorised reviewers</small>
            </span>
            <button>View</button>
          </div>
        </section>
        <section className="panel">
          <h3>Case timeline</h3>
          <div className="timeline compact">
            <div className="done">
              <span>
                <Icon name="check" size={13} />
              </span>
              <strong>Record submitted</strong>
              <small>18 Mar · 09:16</small>
            </div>
            <div className="current">
              <span />
              <strong>Secretariat verification</strong>
              <small>Identity and evidence review</small>
            </div>
            <div>
              <span />
              <strong>Notice and resolution</strong>
              <small>Pending</small>
            </div>
          </div>
        </section>
      </div>
    </Portal>
  )
}
