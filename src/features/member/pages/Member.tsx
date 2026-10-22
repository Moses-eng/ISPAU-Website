import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function Member({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Membership">
      <PortalHeading
        eyebrow="Sample data"
        title="Your ISPAU Membership"
        text="Example Network Services Ltd"
        action={
          <Button onClick={() => go("profile")}>
            Manage Directory Profile
          </Button>
        }
      />
      <div className="member-banner">
        <div className="company-logo large">EN</div>
        <div>
          <Tag tone="success">Active member</Tag>
          <h2>Example Network Services Ltd</h2>
          <p>
            Member ID <strong>ISPAU-M-0018</strong> · Silver
          </p>
        </div>
        <dl>
          <dt>Membership period</dt>
          <dd>1 Apr 2026 – 31 Mar 2027</dd>
          <dt>Renewal</dt>
          <dd>Details confirmation due 1 Mar 2027</dd>
        </dl>
      </div>
      <div className="notice">
        <Icon name="file" />
        <p>
          <strong>
            Please confirm your organisation’s details before renewal.
          </strong>{" "}
          Existing information will be pre-filled; a new full application is not
          required.
        </p>
        <Button kind="secondary" onClick={() => go("renewal")}>
          Review details
        </Button>
      </div>
      <div className="stats member-stats">
        {[
          ["82%", "Profile complete", "2 suggested updates"],
          ["2", "Documents", "Proforma and tax invoice"],
          [
            "Due 1 Mar",
            "Annual details confirmation",
            "Renewal uses this member record",
          ],
        ].map(([a, b, c]) => (
          <div className="stat" key={b}>
            <span>{b}</span>
            <strong>{a}</strong>
            <small>{c}</small>
          </div>
        ))}
      </div>
      <div className="quick-actions">
        {[
          [
            "Update Organisation Details",
            "Keep legal, operational and representative details current.",
            "building",
          ],
          [
            "Manage Directory Profile",
            "Control approved public information and publication permission.",
            "users",
          ],
          [
            "View Invoices",
            "Access proforma and tax documents available to your organisation.",
            "file",
          ],
          [
            "Confirm Renewal Details",
            "Review pre-filled organisation information before renewal.",
            "check",
          ],
        ].map(([a, b, c]) => (
          <button
            key={a}
            onClick={() =>
              a.includes("Directory")
                ? go("profile")
                : a.includes("Invoices")
                  ? go("member-invoices")
                  : a.includes("Renewal")
                    ? go("renewal")
                    : a.includes("Organisation")
                      ? go("org-details")
                      : undefined
            }
          >
            <span className="icon-box">
              <Icon name={c} />
            </span>
            <strong>{a}</strong>
            <small>{b}</small>
            <Icon name="arrow" />
          </button>
        ))}
      </div>
    </Portal>
  )
}
