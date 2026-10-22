import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function Profile({ go }: { go: (v: View) => void }) {
  const [published, setPublished] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  return (
    <Portal go={go} active="Public profile">
      <button className="back-link" onClick={() => go("member")}>
        ← Membership overview
      </button>
      <PortalHeading
        title="Public profile preview"
        text="Review exactly what can appear in the member directory."
        action={
          <Button
            onClick={() =>
              published ? setConfirmWithdraw(true) : setPublished(true)
            }
          >
            {published
              ? "Withdraw Publication Permission"
              : "Give Publication Permission"}
          </Button>
        }
      />
      <div className="notice">
        <Icon name="lock" />
        <p>
          Private contacts, evidence and billing details never appear in the
          public profile. Publication also requires active status, eligibility
          and ISPAU approval.
        </p>
      </div>
      <div className="profile-preview">
        <span className="preview-label">Public profile preview</span>
        <div className="company-logo large">EN</div>
        <div>
          <Tag tone={published ? "success" : "warning"}>
            {published ? "Permission granted" : "Not published"}
          </Tag>
          <h1>Example Network Services</h1>
          <p>
            Reliable business connectivity and managed network services for
            growing organisations.
          </p>
          <dl>
            <dt>Services</dt>
            <dd>Business fibre · Managed connectivity</dd>
            <dt>Coverage</dt>
            <dd>Central and Eastern Uganda</dd>
            <dt>Website</dt>
            <dd>example-network.test</dd>
            <dt>Business contact</dt>
            <dd>hello@example-network.test</dd>
          </dl>
        </div>
        <Button kind="secondary" onClick={() => go("org-details")}>
          Request Correction
        </Button>
      </div>
      {confirmWithdraw && (
        <div className="confirmation-panel" role="dialog" aria-modal="true">
          <div>
            <h2>Withdraw publication permission?</h2>
            <p>
              The public profile must be removed from the directory. Membership
              remains active.
            </p>
            <div className="button-row">
              <Button
                kind="secondary"
                onClick={() => setConfirmWithdraw(false)}
              >
                Keep published
              </Button>
              <Button
                kind="danger"
                onClick={() => {
                  setPublished(false)
                  setConfirmWithdraw(false)
                }}
              >
                Withdraw Permission
              </Button>
            </div>
          </div>
        </div>
      )}
    </Portal>
  )
}
