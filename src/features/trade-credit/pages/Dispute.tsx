import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import FormCard from "@/components/ui/FormCard"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import type { View } from "@/types/View"
import { useState } from "react"

export default function Dispute({ go }: { go: (v: View) => void }) {
  const [sent, setSent] = useState(false)
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Confidential request"
        title={
          sent
            ? "Your request has been received."
            : "Dispute or Appeal a Record"
        }
        text={
          sent
            ? "We will verify your identity before releasing confidential information."
            : "Provide essential business details and your explanation. You do not need a portal account."
        }
      />
      {sent ? (
        <section className="section success-panel centered">
          <Icon name="check" size={28} />
          <h2>Request DR-2026-0012</h2>
          <p>
            An acknowledgement has been sent to your contact email. No record is
            exposed at this stage.
          </p>
          <Button onClick={() => go("home")}>Return to Website</Button>
        </section>
      ) : (
        <section className="section narrow">
          <FormCard title="Business and contact details">
            <div className="field-grid">
              <Field
                label="Legal business name"
                value="Cobalt Office Parks Ltd"
              />
              <Field
                label="Registration reference"
                placeholder="Business reference"
              />
              <Field label="Contact name" placeholder="Authorised contact" />
              <Field label="Work email" placeholder="name@business.ug" />
              <Field label="Record reference (optional)" value="TC-2026-0038" />
            </div>
            <Field
              label="Explanation"
              as="textarea"
              placeholder="Explain why you believe the record should be reviewed"
            />
            <div className="upload-zone compact">
              <Icon name="file" />
              <strong>Add relevant evidence</strong>
              <small>PDF, JPG or PNG</small>
            </div>
            <div className="notice">
              <Icon name="lock" />
              <p>
                Submitting this form does not create a portal account or
                immediately expose a confidential record.
              </p>
            </div>
            <Button onClick={() => setSent(true)}>
              Submit Dispute Request
            </Button>
          </FormCard>
        </section>
      )}
    </PublicShell>
  )
}
