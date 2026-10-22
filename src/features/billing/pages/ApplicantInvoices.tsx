import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function ApplicantInvoices({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Invoices" role="Applicant">
      <PortalHeading
        title="Invoices & Payment"
        text="Application ISPAU-APP-2026-0018 · Payment remains separate from admission."
      />
      <div className="notice">
        <Icon name="shield" />
        <p>
          <strong>Awaiting payment.</strong> Membership activates only after
          Accounts confirms actual receipt and the membership team completes
          activation.
        </p>
      </div>
      <section className="panel invoice-list-panel">
        <div className="invoice-list-row">
          <span>
            <Tag tone="warning">Awaiting payment</Tag>
            <strong>PF-2026-0018</strong>
            <small>Non-tax proforma · Silver membership</small>
          </span>
          <dl>
            <dt>Amount</dt>
            <dd>USD 500</dd>
            <dt>Membership period</dt>
            <dd>1 Apr 2026 – 31 Mar 2027</dd>
          </dl>
          <Button onClick={() => go("invoice-detail")}>View invoice</Button>
        </div>
      </section>
    </Portal>
  )
}
