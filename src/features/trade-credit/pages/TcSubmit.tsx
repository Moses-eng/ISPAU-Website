import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function TcSubmit({ go }: { go: (v: View) => void }) {
  const [step, setStep] = useState(0)
  const labels = [
    "Customer & contract",
    "Invoices & payment history",
    "Evidence",
    "Review",
  ]
  return (
    <Portal go={go} active="Trade Credit" role="ISP member user">
      <button className="back-link" onClick={() => go("tc-dashboard")}>
        ← Trade Credit Workspace
      </button>
      <PortalHeading
        title="Submit a Trade Credit Record"
        text="Create a private case for Secretariat verification."
      />
      <div className="horizontal-stepper">
        {labels.map((x, i) => (
          <div
            className={i === step ? "active" : i < step ? "done" : ""}
            key={x}
          >
            <span>{i < step ? <Icon name="check" size={13} /> : i + 1}</span>
            <strong>{x}</strong>
          </div>
        ))}
      </div>
      <section className="panel guided-form">
        <h2>{labels[step]}</h2>
        {step === 0 && (
          <div className="field-grid">
            <Field
              label="Legal business name"
              value="Mirembe Business Systems Ltd"
            />
            <Field
              label="Registration or identity reference"
              placeholder="Configurable identity field"
              hint="Exact matching requirements remain a stakeholder decision."
            />
            <Field label="Contract reference" value="ENS-MBS-2025-144" />
            <Field
              label="Service category"
              as="select"
              options={[
                "Contracted business connectivity",
                "Wholesale bandwidth",
                "Shared infrastructure",
              ]}
            />
          </div>
        )}
        {step === 1 && (
          <div className="field-grid">
            <Field label="Invoice reference" value="INV-2026-0142" />
            <Field label="Invoice date" value="5 Jan 2026" />
            <Field label="Invoice amount" value="UGX 8,450,000" />
            <Field label="Outstanding balance" value="UGX 8,450,000" />
            <Field
              label="Payment history summary"
              as="textarea"
              placeholder="Summarise relevant payments and allocation"
            />
          </div>
        )}
        {step === 2 && (
          <>
            <p className="helper">
              Upload the contract, invoices and evidence of reminders. Evidence
              remains restricted.
            </p>
            <div className="upload-zone">
              <Icon name="file" />
              <strong>Choose evidence files</strong>
              <small>PDF, JPG or PNG · 10 MB per file</small>
              <Button kind="secondary">Choose files</Button>
            </div>
            <div className="file-row">
              <Icon name="file" />
              <span>
                <strong>invoice-and-reminders.pdf</strong>
                <small>4.1 MB</small>
              </span>
              <Tag tone="success">Accepted</Tag>
            </div>
          </>
        )}
        {step === 3 && (
          <div className="review-card">
            <Tag tone="warning">Not yet verified</Tag>
            <h3>Mirembe Business Systems Ltd</h3>
            <dl>
              <dt>Service</dt>
              <dd>Contracted business connectivity</dd>
              <dt>Contract</dt>
              <dd>ENS-MBS-2025-144</dd>
              <dt>Outstanding</dt>
              <dd>UGX 8,450,000</dd>
              <dt>Evidence</dt>
              <dd>1 restricted file</dd>
            </dl>
            <label className="checkbox">
              <input type="checkbox" />
              <span>
                I confirm this information is accurate and authorised for
                submission.
              </span>
            </label>
          </div>
        )}
        <div className="form-actions">
          {step > 0 ? (
            <Button kind="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button onClick={() => go("tc-case")}>
              Submit for Verification
            </Button>
          )}
        </div>
      </section>
    </Portal>
  )
}
