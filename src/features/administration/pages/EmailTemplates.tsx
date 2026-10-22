import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function EmailTemplates({ go }: { go: (v: View) => void }) {
  const templates = [
    "Application acknowledgement",
    "Consolidated clarification request",
    "Admission decision",
    "Membership welcome",
    "Renewal reminder",
  ]
  return (
    <Portal go={go} active="Email templates" role="Secretariat / Administrator">
      <PortalHeading
        title="Approved Email Templates"
        text="Applicant-facing correspondence is separate from internal notes."
      />
      <div className="portal-grid">
        <section className="panel template-list">
          {templates.map((template) => (
            <button key={template}>
              <Icon name="file" />
              <span>
                <strong>{template}</strong>
                <small>Approved template · Version 4.0</small>
              </span>
              <Icon name="arrow" />
            </button>
          ))}
        </section>
        <section className="panel template-preview">
          <span className="eyebrow">Preview</span>
          <h2>Application acknowledgement</h2>
          <p>Dear authorised representative,</p>
          <p>
            We have received application {"{{application_reference}}"} for{" "}
            {"{{organisation_name}}"}. The membership team will review the
            information and contact you if clarification is required.
          </p>
          <p>ISPAU Membership Team</p>
          <Tag>Preview only · not sent</Tag>
        </section>
      </div>
    </Portal>
  )
}
