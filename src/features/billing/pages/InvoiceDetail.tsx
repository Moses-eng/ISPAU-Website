import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import downloadProforma from "@/features/billing/utils/downloadProforma"
import { useState } from "react"

export default function InvoiceDetail({ go }: { go: (v: View) => void }) {
  const [receipt, setReceipt] = useState(false)
  return (
    <Portal go={go} active="Invoices" role="Applicant">
      <button className="back-link" onClick={() => go("applicant-invoices")}>
        ← Invoices
      </button>
      <PortalHeading
        eyebrow="Non-tax proforma invoice"
        title="PF-2026-0018"
        text="Example Network Services Ltd"
        action={
          <Button kind="secondary" onClick={downloadProforma}>
            Download Proforma
          </Button>
        }
      />
      <div className="portal-grid wide-left">
        <section className="panel document-view">
          <Logo />
          <span>PROFORMA · NOT A TAX INVOICE</span>
          <h2>Membership fee</h2>
          <dl>
            <dt>Application</dt>
            <dd>ISPAU-APP-2026-0018</dd>
            <dt>Approved tier</dt>
            <dd>Silver</dd>
            <dt>Currency and fee</dt>
            <dd>USD 500</dd>
            <dt>Membership period</dt>
            <dd>1 Apr 2026 – 31 Mar 2027</dd>
          </dl>
          <strong className="document-total">Total · USD 500</strong>
        </section>
        <aside className="panel">
          <h3>Payment status</h3>
          <Tag tone={receipt ? "info" : "warning"}>
            {receipt
              ? "Receipt uploaded · awaiting Accounts confirmation"
              : "Awaiting payment"}
          </Tag>
          <p>
            Payment is manual. Use only the approved instructions supplied by
            ISPAU.
          </p>
          <Button onClick={() => go("payment-instructions")}>
            View Payment Instructions
          </Button>
          <div className="upload-control receipt-upload">
            <span>
              <strong>Payment receipt (optional)</strong>
              <small>Supporting evidence only · PDF, JPG or PNG</small>
            </span>
            <Button kind="secondary" onClick={() => setReceipt(true)}>
              {receipt ? "Replace receipt" : "Upload receipt"}
            </Button>
          </div>
          {receipt && (
            <div className="notice">
              <Icon name="shield" />
              <p>
                Uploading a receipt does not confirm payment or activate
                membership.
              </p>
            </div>
          )}
        </aside>
      </div>
    </Portal>
  )
}
