import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import FormCard from "@/components/ui/FormCard"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function RecordRequest({ go }: { go: (v: View) => void }) {
  const [sent, setSent] = useState(false)
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Confidential customer request"
        title={
          sent ? "Your request is pending verification." : "Request My Record"
        }
        text={
          sent
            ? "Your request has been received. ISPAU will verify your identity and authority before releasing any confidential information."
            : "Request information held about your own business. You do not need an association membership or portal account."
        }
      />
      {sent ? (
        <section className="section success-panel centered">
          <Icon name="shield" size={30} />
          <Tag tone="info">Pending identity verification</Tag>
          <h2>Request MR-2026-0024</h2>
          <p>
            No record has been displayed. The final identity-verification method
            remains an implementation decision requiring confirmation.
          </p>
          <Button onClick={() => go("trade")}>
            Return to Service Information
          </Button>
        </section>
      ) : (
        <section className="section narrow">
          <FormCard title="Business and authorised contact">
            <div className="field-grid">
              <Field
                label="Legal business name"
                placeholder="Registered name"
              />
              <Field
                label="Registration or establishment reference"
                placeholder="Available business reference"
              />
              <Field label="Authorised contact name" placeholder="Full name" />
              <Field label="Work email" placeholder="name@business.ug" />
              <Field label="Telephone" placeholder="+256" />
              <Field
                label="Record reference (optional)"
                placeholder="If one was supplied to you"
              />
            </div>
            <Field
              label="Reason for request"
              as="textarea"
              placeholder="Explain your relationship to the business and request"
            />
            <div className="notice">
              <Icon name="lock" />
              <p>
                These details begin a controlled request. They do not reveal
                whether a record exists.
              </p>
            </div>
            <Button onClick={() => setSent(true)}>Submit Record Request</Button>
          </FormCard>
        </section>
      )}
    </PublicShell>
  )
}
