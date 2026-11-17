import { useState } from "react"
import SectionAccent from "@/components/ui/SectionAccent"
import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import FormCard from "@/components/ui/FormCard"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import contactService, { type ContactPayload } from "@/apiServices/contactService"
import type { View } from "@/types/View"

const INITIAL_FORM: ContactPayload = {
  name: "",
  work_email: "",
  organisation: "",
  enquiry_type: "General enquiry",
  message: "",
}

export default function Contact({ go }: { go: (v: View) => void }) {
  const [formData, setFormData] = useState<ContactPayload>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)

  const handleChange = (field: keyof ContactPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors?.[field]) {
      setFieldErrors((prev) => {
        if (!prev) return null
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)
    setFieldErrors(null)

    const res = await contactService.create(formData)

    if (res.success) {
      setSuccessMessage("Thank you for reaching out. Your enquiry has been received.")
      setFormData(INITIAL_FORM)
    } else {
      setErrorMessage(res.message || "Something went wrong. Please check your submission.")
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors)
      }
    }

    setLoading(false)
  }

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
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {successMessage && (
                <div
                  className="p-3 rounded text-sm"
                  style={{
                    backgroundColor: "var(--success-bg)",
                    color: "var(--success)",
                  }}
                >
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div
                  className="p-3 rounded text-sm"
                  style={{
                    backgroundColor: "var(--danger-bg)",
                    color: "var(--danger)",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <Field
                label="Name"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={fieldErrors?.name}
                required
              />

              <Field
                label="Work email"
                type="email"
                placeholder="name@organisation.ug"
                value={formData.work_email}
                onChange={(e) => handleChange("work_email", e.target.value)}
                error={fieldErrors?.work_email}
                required
              />

              <Field
                label="Organisation"
                placeholder="Organisation name"
                value={formData.organisation}
                onChange={(e) => handleChange("organisation", e.target.value)}
                error={fieldErrors?.organisation}
                required
              />

              <Field
                label="Enquiry type"
                as="select"
                options={[
                  "General enquiry",
                  "Membership guidance",
                  "Services & activities",
                ]}
                value={formData.enquiry_type}
                onChange={(e) => handleChange("enquiry_type", e.target.value)}
                error={fieldErrors?.enquiry_type}
              />

              <Field
                label="Message"
                placeholder="How can we help?"
                as="textarea"
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                error={fieldErrors?.message}
                required
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send enquiry"}
              </Button>
            </form>
          </FormCard>
        </div>
      </section>
    </PublicShell>
  )
}
