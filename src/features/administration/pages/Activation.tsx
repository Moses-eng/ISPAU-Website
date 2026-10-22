import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function Activation({ go }: { go: (v: View) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [active, setActive] = useState(false)
  return (
    <Portal go={go} active="Activation" role="Membership coordinator">
      <PortalHeading
        title="Membership Activation"
        text="Activate only after approval and Accounts confirmation."
      />
      {active ? (
        <div className="success-panel">
          <Icon name="check" size={30} />
          <h2>Membership activated</h2>
          <p>
            Stable member ID <strong>ISPAU-M-0018</strong> issued. Welcome
            notice prepared for Example Network Services Ltd.
          </p>
          <Button onClick={() => go("welcome")}>View welcome notice</Button>
        </div>
      ) : (
        <section className="panel activation-detail">
          <div>
            <Tag tone="success">Ready for activation</Tag>
            <h2>Example Network Services Ltd</h2>
            <p>ISPAU-APP-2026-0018 · Silver</p>
          </div>
          <dl>
            <dt>Admission decision</dt>
            <dd>Approved · Decision Maker DM-02</dd>
            <dt>Payment confirmation</dt>
            <dd>Confirmed · Accounts AO-04 · 18 Mar 2026</dd>
            <dt>Membership period</dt>
            <dd>1 Apr 2026 – 31 Mar 2027</dd>
            <dt>Directory publication</dt>
            <dd>Not automatic · separate approval required</dd>
          </dl>
          <Button onClick={() => setConfirming(true)}>
            Activate Membership
          </Button>
        </section>
      )}
      {confirming && !active && (
        <div className="confirmation-panel" role="dialog" aria-modal="true">
          <div>
            <h2>Confirm membership activation</h2>
            <p>
              This issues a stable member ID and welcome notice. It does not
              publish the directory profile.
            </p>
            <div className="button-row">
              <Button kind="secondary" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setActive(true)
                  setConfirming(false)
                }}
              >
                Confirm Activation
              </Button>
            </div>
          </div>
        </div>
      )}
    </Portal>
  )
}
