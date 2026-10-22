import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function DirectoryAdministration({
  go,
}: {
  go: (v: View) => void
}) {
  return (
    <Portal
      go={go}
      active="Directory administration"
      role="Secretariat / Administrator"
    >
      <PortalHeading
        title="Directory Administration"
        text="Publish only eligible, active, approved and consented profiles."
      />
      <section className="panel">
        <div className="check-row">
          <span>
            <strong>Example Network Services Ltd</strong>
            <small>Active · Profile approval pending · Consent granted</small>
          </span>
          <Tag tone="warning">Not published</Tag>
          <button>Review</button>
        </div>
        <div className="notice">
          <Icon name="shield" />
          <p>
            Activation does not publish a profile. Eligibility, profile approval
            and current permission are checked separately.
          </p>
        </div>
      </section>
    </Portal>
  )
}
