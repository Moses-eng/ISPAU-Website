import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function ReferenceResult({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Trade Credit" role="ISP member user">
      <button className="back-link" onClick={() => go("reference")}>
        ← New search
      </button>
      <PortalHeading
        title="Payment Reference Result"
        text="Summit Retail Logistics Ltd · Searched 18 Mar 2026, 11:24 EAT"
      />
      <div className="empty-result">
        <span className="empty-icon">
          <Icon name="search" size={27} />
        </span>
        <Tag>Insufficient information</Tag>
        <h2>No record found.</h2>
        <p>
          No record found. There is insufficient information to assess this
          customer’s payment history.
        </p>
        <Button kind="secondary" onClick={() => go("reference")}>
          Return to search
        </Button>
      </div>
      <section className="panel audit-event">
        <Icon name="shield" />
        <div>
          <strong>Search logged</strong>
          <p>
            Audit ID SRCH-2026-0094 · Purpose: Assessing a new connectivity
            contract · Result: No record found
          </p>
        </div>
        <Tag tone="success">Recorded</Tag>
      </section>
    </Portal>
  )
}
