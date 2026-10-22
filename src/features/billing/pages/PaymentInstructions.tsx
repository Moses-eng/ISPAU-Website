import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import type { View } from "@/types/View"

export default function PaymentInstructions({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Invoices" role="Applicant">
      <button className="back-link" onClick={() => go("invoice-detail")}>
        ← Invoice PF-2026-0018
      </button>
      <PortalHeading
        title="Approved Payment Instructions"
        text="Quote the references exactly so Accounts can reconcile the payment."
      />
      <section className="panel payment-instructions">
        <div className="notice">
          <Icon name="shield" />
          <p>
            Sample instructions only. Production bank details must come from an
            approved, controlled source.
          </p>
        </div>
        <dl>
          <dt>Amount</dt>
          <dd>USD 500</dd>
          <dt>Proforma reference</dt>
          <dd>PF-2026-0018</dd>
          <dt>Application reference</dt>
          <dd>ISPAU-APP-2026-0018</dd>
          <dt>Payment method</dt>
          <dd>Manual transfer using Secretariat-supplied instructions</dd>
        </dl>
        <p>
          Accounts confirms actual receipt. A receipt upload is supporting
          evidence and is not automatic confirmation.
        </p>
      </section>
    </Portal>
  )
}
