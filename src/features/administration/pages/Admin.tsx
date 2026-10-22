import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function Admin({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Administration" role="Secretariat / Administrator">
      <PortalHeading
        title="Administration"
        text="Configurable policy settings and restricted operational tools."
      />
      <div className="admin-grid">
        {[
          [
            "Membership configuration",
            "Tiers, fees, currency, membership year and renewal terms",
            "USD · 2026/27",
          ],
          [
            "Directory eligibility",
            "Active status, approved profile and consent rules",
            "Affiliate: Decision pending",
          ],
          [
            "Approved templates",
            "Clarification, decision, payment and welcome notices",
            "8 templates",
          ],
          [
            "Tax-invoice uploads",
            "Attach approved tax invoices to authorised member records",
            "Secretariat only",
          ],
          [
            "Renewal reminders",
            "Configure reminder timing and inspect delivery status",
            "Delivery integration pending",
          ],
          [
            "Member export",
            "Role-restricted member data export",
            "Secretariat only",
          ],
          [
            "Membership action history",
            "Admission, payment, activation and directory actions",
            "Restricted",
          ],
          [
            "Decision audit log",
            "Admission and membership outcomes",
            "28 events",
          ],
        ].map(([a, b, c], i) => (
          <button key={a}>
            <span className="icon-box">
              <Icon name={i > 3 ? "shield" : i === 2 ? "file" : "building"} />
            </span>
            <strong>{a}</strong>
            <p>{b}</p>
            <small>{c} →</small>
          </button>
        ))}
      </div>
      <div className="access-denied">
        <Icon name="lock" size={26} />
        <div>
          <strong>Access denied example</strong>
          <p>
            You do not have permission to view another applicant’s record.
            Attempted access is recorded.
          </p>
        </div>
        <Tag tone="danger">Restricted</Tag>
      </div>
    </Portal>
  )
}
