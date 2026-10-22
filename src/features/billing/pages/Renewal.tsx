import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function Renewal({ go }: { go: (v: View) => void }) {
  const [stage, setStage] = useState<"review" | "confirmed" | "invoice">(
    "review",
  )
  return (
    <Portal go={go} active="Renewal">
      <PortalHeading
        title="Annual Details Confirmation"
        text="Renew the existing member record without submitting a new application."
      />
      <div className="notice">
        <Icon name="file" />
        <p>
          <strong>Renewal reminder · delivery preview:</strong> Prepared, not
          sent. Scheduled email delivery requires production integration.
        </p>
      </div>
      {stage === "review" && (
        <section className="panel renewal-review">
          <h2>Confirm your organisation details</h2>
          <dl>
            <dt>Member ID</dt>
            <dd>ISPAU-M-0018</dd>
            <dt>Current tier</dt>
            <dd>Silver</dd>
            <dt>Organisation</dt>
            <dd>Example Network Services Ltd</dd>
            <dt>Representative</dt>
            <dd>Amina N. · amina@example-network.test</dd>
          </dl>
          <div className="button-row">
            <Button kind="secondary" onClick={() => go("org-details")}>
              Request corrections
            </Button>
            <Button onClick={() => setStage("confirmed")}>
              Confirm details
            </Button>
          </div>
        </section>
      )}
      {stage === "confirmed" && (
        <div className="success-panel">
          <Icon name="check" />
          <h2>Details confirmed</h2>
          <p>
            The existing member record and stable member ID will be used for
            renewal.
          </p>
          <Button onClick={() => setStage("invoice")}>
            View renewal invoice state
          </Button>
        </div>
      )}
      {stage === "invoice" && (
        <section className="panel payment-card">
          <div>
            <Tag>Not yet issued</Tag>
            <h2>2027/28 renewal proforma</h2>
            <p>Fee, period and terms await approved configuration.</p>
          </div>
          <dl>
            <dt>Member ID</dt>
            <dd>ISPAU-M-0018</dd>
            <dt>Payment status</dt>
            <dd>Not due</dd>
          </dl>
        </section>
      )}
    </Portal>
  )
}
