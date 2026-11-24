import { useState } from "react"
import SectionAccent from "@/components/ui/SectionAccent"
import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import FormCard from "@/components/ui/FormCard"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import contactService, { type Contact, type ContactPayload } from "@/apiServices/contactService"
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
  const [submittedContact, setSubmittedContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)
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
    setErrorMessage(null)
    setFieldErrors(null)

    const res = await contactService.create(formData)

    if (res.success) {
      setSubmittedContact(res.data || {
        ...formData,
        id: "",
        status: "active",
      })
      setFormData(INITIAL_FORM)
    } else {
      setErrorMessage(res.message || "Something went wrong. Please check your submission.")
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors)
      }
    }

    setLoading(false)
  }

  const handleReset = () => {
    setSubmittedContact(null)
    setErrorMessage(null)
    setFieldErrors(null)
    setFormData(INITIAL_FORM)
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

          <FormCard title={submittedContact ? "Enquiry Received" : "Send an enquiry"}>
            {submittedContact ? (
              /* =================== IMPROVED SUCCESS ALERT UI =================== */
              <div
                role="status"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  padding: "8px 0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      color: "#ffffff",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="check" size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#14532d" }}>
                      Thank you for contacting ISPAU
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "0.88rem", color: "#166534" }}>
                      Your enquiry has been delivered to the Secretariat.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    fontSize: "0.88rem",
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>Sender:</span>
                    <strong>{submittedContact.name} ({submittedContact.organisation})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>Reply Email:</span>
                    <strong>{submittedContact.work_email}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280" }}>Subject:</span>
                    <span>{submittedContact.enquiry_type}</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.5 }}>
                  Our team reviews enquiries during regular business hours and will follow up with you directly at{" "}
                  <strong>{submittedContact.work_email}</strong>.
                </p>

                <div style={{ paddingTop: "8px" }}>
                  <Button kind="secondary" onClick={handleReset}>
                    Send another enquiry
                  </Button>
                </div>
              </div>
            ) : (
              /* =================== FORM WITH ERROR BANNER =================== */
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {errorMessage && (
                  <div
                    role="alert"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      fontSize: "0.88rem",
                    }}
                  >
                    <span style={{ flexShrink: 0, marginTop: "2px" }}>
                      <Icon name="shield" size={16} />
                    </span>
                    <div>
                      <strong>Submission error: </strong>
                      <span>{errorMessage}</span>
                    </div>
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
            )}
          </FormCard>
        </div>
      </section>
    </PublicShell>
  )
}
