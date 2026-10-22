import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function Clarification({ go }: { go: (v: View) => void }) {
  const [done, setDone] = useState(false)
  return (
    <Portal go={go} active="Clarifications" role="Applicant">
      <button className="back-link" onClick={() => go("applicant")}>
        ← Back to application
      </button>
      <PortalHeading
        title={
          done ? "Clarification response submitted" : "Respond to clarification"
        }
        text={
          done
            ? "Your application has returned to the membership team for review."
            : "One consolidated request from the membership team · 12 March 2026"
        }
      />
      {done ? (
        <div className="success-panel">
          <Icon name="check" size={28} />
          <h2>Thank you. Your response is under review.</h2>
          <p>
            All previous answers remain part of application ISPAU-APP-2026-0018.
          </p>
          <Button onClick={() => go("applicant")}>Return to application</Button>
        </div>
      ) : (
        <div className="portal-grid wide-left">
          <section className="panel">
            <div className="request-note">
              <strong>Message from Membership Team</strong>
              <p>
                Please provide a current copy of the Public Service Provider
                licence showing its validity date. No other changes are
                required.
              </p>
              <small>Sarah M. · Membership Coordinator</small>
            </div>
            <h3>Requested correction</h3>
            <div className="field-highlight">
              <Field label="Licence validity" placeholder="DD / MM / YYYY" />
              <div className="file-row">
                <Icon name="file" />
                <span>
                  <strong>updated-psp-licence.pdf</strong>
                  <small>2.4 MB</small>
                </span>
                <Tag tone="success">Accepted</Tag>
              </div>
              <Field
                as="textarea"
                label="Note to reviewer (optional)"
                placeholder="Add useful context"
              />
            </div>
            <Button onClick={() => setDone(true)}>
              Resubmit clarification
            </Button>
          </section>
          <aside className="panel">
            <h3>Before you submit</h3>
            <ul className="check-list">
              <li>
                <Icon name="check" />
                Only this requested field will change
              </li>
              <li>
                <Icon name="check" />
                All previous answers are preserved
              </li>
              <li>
                <Icon name="check" />
                Your response is recorded in the activity history
              </li>
            </ul>
          </aside>
        </div>
      )}
    </Portal>
  )
}
