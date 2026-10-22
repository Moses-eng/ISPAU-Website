import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import SectionTitle from "@/components/ui/SectionTitle"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function SystemPage({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Design notes" role="Secretariat / Administrator">
      <PortalHeading
        eyebrow="Internal implementation handoff"
        title="Design system & unresolved decisions"
        text="Restricted design notes for implementation planning—not public website content."
      />
      <section className="section system">
        <SectionTitle
          title="Proposed colour palette"
          text="The supplied ISPAU logo is retained in its original colours on white and rendered as a white cutout on burgundy surfaces. The palette follows the supplied communication-pack reference."
        />
        <div className="swatches">
          {[
            ["Primary burgundy", "#650B23"],
            ["Deep burgundy", "#461220"],
            ["Wine red", "#7C2F3C"],
            ["Pale tint", "#F7F0F2"],
            ["White", "#FFFFFF"],
          ].map(([a, b]) => (
            <div key={a}>
              <span style={{ background: b }} />
              <strong>{a}</strong>
              <small>{b}</small>
            </div>
          ))}
        </div>
        <div className="system-grid">
          <div>
            <h3>Typography</h3>
            <div className="type-sample">
              <strong>Public display / Source Serif 4</strong>
              <p>Body / Inter Regular for clear, comfortable reading.</p>
            </div>
          </div>
          <div>
            <h3>Buttons & status</h3>
            <div className="button-row">
              <Button>Primary action</Button>
              <Button kind="secondary">Secondary</Button>
            </div>
            <div className="button-row">
              <Tag tone="success">Verified</Tag>
              <Tag tone="warning">Needs review</Tag>
              <Tag tone="danger">Restricted</Tag>
            </div>
          </div>
          <div>
            <h3>Fields & alerts</h3>
            <Field
              label="Accessible field label"
              placeholder="Helpful placeholder"
            />
            <div className="notice">
              <Icon name="shield" />
              <p>
                Alert text explains the state without relying on colour alone.
              </p>
            </div>
          </div>
          <div>
            <h3>Mobile behaviour</h3>
            <p>
              Tables become horizontal-free cards, forms stack, portal
              navigation uses a labelled drawer, and touch targets remain at
              least 44px.
            </p>
          </div>
        </div>
        <SectionTitle title="Remaining stakeholder decisions" />
        <div className="decision-list">
          {[
            "Final admission authority and delegation",
            "Tier eligibility boundaries",
            "Governance rights by category",
            "Membership-year and renewal rules",
            "Currency conversion and indicative equivalents",
            "Affiliate directory eligibility",
            "Notification channels",
            "Directory publication triggers",
            "Unspecified content-editing permissions",
            "Retention periods",
          ].map((x) => (
            <span key={x}>
              <Icon name="arrow" size={15} />
              {x}
            </span>
          ))}
        </div>
        <SectionTitle title="Production handoff requirements" />
        <div className="decision-list">
          {[
            "Real authentication and email verification",
            "Server-enforced organisation and role permissions",
            "Private document storage and authorised retrieval",
            "Malware scanning and upload-state callbacks",
            "Transactional email delivery and delivery status",
            "Scheduled renewal reminders",
            "Controlled proforma and tax-invoice generation",
            "Backup and restore verification",
          ].map((item) => (
            <span key={item}>
              <Icon name="shield" size={15} />
              {item}
            </span>
          ))}
        </div>
      </section>
    </Portal>
  )
}
