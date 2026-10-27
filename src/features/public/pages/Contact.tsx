import SectionAccent from "@/components/ui/SectionAccent"
import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import FormCard from "@/components/ui/FormCard"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import type { View } from "@/types/View"

export default function Contact({ go }: { go: (v: View) => void }) {
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Contact"
        title="Let’s connect."
        text="Contact the Secretariat for association enquiries, membership guidance or questions about ISPAU services."
      />
      <section className="section contact-grid">
        <div className="contact-details">
          <SectionAccent />
          <h2>Choose the right route</h2>
          <div>
            <span>General enquiries</span>
            <a href="mailto:info@ispau.ug">info@ispau.ug</a>
          </div>
          <div>
            <span>Membership enquiries</span>
            <a href="mailto:membership@ispau.ug">membership@ispau.ug</a>
          </div>
          <div>
            <span>Telephone</span>
            <a href="tel:+256781492412">+256 781 492 412</a>
          </div>
          <div className="notice">
            <Icon name="lock" />
            <p>
              Confidential record requests and disputes require identity
              verification.
            </p>
          </div>
        </div>
        <div>
          <div className="flex flex-wrap gap-3 mb-6">
            <Button kind="secondary" onClick={() => go("record-request")}>
              Request my record
            </Button>
            <Button kind="secondary" onClick={() => go("dispute")}>
              Dispute or appeal
            </Button>
          </div>
          <FormCard title="Send an enquiry">
            <Field label="Name" placeholder="Your full name" />
            <Field label="Work email" placeholder="name@organisation.ug" />
            <Field label="Organisation" placeholder="Organisation name" />
            <Field
              label="Enquiry type"
              as="select"
              options={[
                "General enquiry",
                "Membership guidance",
                "Services & activities",
              ]}
            />
            <Field
              label="Message"
              placeholder="How can we help?"
              as="textarea"
            />
            <Button>Send enquiry</Button>
          </FormCard>
        </div>
      </section>
    </PublicShell>
  )
}
