import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import RequiredText from "@/features/membership/components/RequiredText"
import type { View } from "@/types/View"
import { useState } from "react"

export default function OrganisationDetails({ go }: { go: (v: View) => void }) {
  const [saved, setSaved] = useState(false)
  return (
    <Portal go={go} active="Membership">
      <PortalHeading
        title="Organisation & Representatives"
        text="Permitted updates for Example Network Services Ltd."
      />
      {saved && (
        <div className="notice success">
          <Icon name="check" />
          <p>Changes saved in this browser.</p>
        </div>
      )}
      <section className="panel editable-details">
        <RequiredText />
        <div className="field-grid">
          <Field
            label="Legal organisation name"
            value="Example Network Services Ltd"
            required
          />
          <Field
            label="Main business email"
            value="hello@example-network.test"
            required
          />
          <Field
            label="Main business phone"
            value="+256 700 000 018"
            required
          />
          <Field
            label="Website"
            value="https://example-network.test"
            optional
          />
          <Field label="Membership representative" value="Amina N." required />
          <Field
            label="Representative work email"
            value="amina@example-network.test"
            required
          />
        </div>
        <Button onClick={() => setSaved(true)}>Save permitted updates</Button>
      </section>
    </Portal>
  )
}
