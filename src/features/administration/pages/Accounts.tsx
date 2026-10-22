import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import RequiredText from "@/features/membership/components/RequiredText"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function Accounts({ go }: { go: (v: View) => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentError, setPaymentError] = useState("")
  return (
    <Portal go={go} active="Membership payments" role="Accounts staff">
      <PortalHeading
        title="Membership Payments"
        text="Confirm receipts and maintain a clear, role-restricted audit trail."
      />
      <section className="panel payment-card">
        <div>
          <Tag tone={confirmed ? "success" : "warning"}>
            {confirmed ? "Payment confirmed" : "Awaiting confirmation"}
          </Tag>
          <h2>Example Network Services Ltd</h2>
          <p>ISPAU-APP-2026-0018 · Proforma PF-2026-0018</p>
        </div>
        <dl>
          <dt>Amount</dt>
          <dd>USD 500</dd>
          <dt>Membership period</dt>
          <dd>1 Apr 2026 – 31 Mar 2027</dd>
          <dt>Uploaded receipt</dt>
          <dd>
            receipt-180326.pdf <small>Not proof of confirmation</small>
          </dd>
        </dl>
        <Button onClick={() => !confirmed && setConfirming(true)}>
          {confirmed ? "Payment Received" : "Confirm Payment Received"}
        </Button>
      </section>
      {confirmed && (
        <>
          <div className="notice success">
            <Icon name="check" />
            <p>
              <strong>Payment receipt confirmed by Accounts.</strong> Audit
              event recorded: 18 Mar 2026, 10:42 EAT · Accounts Officer AO-04.
            </p>
          </div>
          <section className="panel activation-card">
            <div>
              <h3>Ready for membership activation</h3>
              <p>
                Approval and payment requirements are satisfied. Secretariat may
                upload the tax invoice when available.
              </p>
            </div>
            <Button>Notify Membership Team</Button>
          </section>
        </>
      )}
      {confirming && (
        <div className="confirmation-panel" role="dialog" aria-modal="true">
          <div>
            <h2>Confirm actual payment receipt</h2>
            <RequiredText />
            <label className={`field ${paymentError ? "field-error" : ""}`}>
              <span>
                Bank or reconciliation reference <b aria-hidden="true">*</b>
              </span>
              <input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
              />
            </label>
            <label className={`field ${paymentError ? "field-error" : ""}`}>
              <span>
                Date received <b aria-hidden="true">*</b>
              </span>
              <input
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
              {paymentError && (
                <small className="inline-error">{paymentError}</small>
              )}
            </label>
            <div className="button-row">
              <Button kind="secondary" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!paymentReference || !paymentDate) {
                    setPaymentError(
                      "Enter the reconciliation reference and received date.",
                    )
                    return
                  }
                  setConfirmed(true)
                  setConfirming(false)
                  setPaymentError("")
                }}
              >
                Confirm Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </Portal>
  )
}
