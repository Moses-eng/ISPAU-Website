import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import type { View } from "@/types/View"

export default function Reference({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Trade Credit" role="ISP member user">
      <button className="back-link" onClick={() => go("tc-dashboard")}>
        ← Trade Credit Workspace
      </button>
      <PortalHeading
        title="Request a Payment Reference"
        text="Search permitted verified information for a legitimate business credit decision."
      />
      <div className="portal-grid wide-left">
        <section className="panel guided-form">
          <Field
            label="Business legal name"
            value="Summit Retail Logistics Ltd"
          />
          <Field
            label="Registration or identity reference"
            placeholder="Enter available reference"
          />
          <Field
            label="Declared legitimate purpose"
            as="select"
            options={[
              "Assessing a new connectivity contract",
              "Reviewing credit terms for an existing contract",
              "Shared-infrastructure commercial decision",
            ]}
          />
          <Field
            label="Purpose detail"
            as="textarea"
            placeholder="Briefly explain the decision this search supports"
          />
          <label className="checkbox">
            <input type="checkbox" />
            <span>
              I confirm this search is authorised, for a legitimate purpose, and
              may be audited.
            </span>
          </label>
          <Button onClick={() => go("reference-result")}>
            Search Verified Records
          </Button>
        </section>
        <aside className="panel">
          <Icon name="shield" size={28} />
          <h3>Conservative by design</h3>
          <p>
            Results show permitted verified information, current status and last
            update. Detailed evidence is not shared cross-ISP in this concept.
          </p>
          <p className="quiet">
            This policy remains configurable pending stakeholder decision.
          </p>
        </aside>
      </div>
    </Portal>
  )
}
