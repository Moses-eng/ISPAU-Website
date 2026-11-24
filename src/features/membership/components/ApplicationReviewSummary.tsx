import Button from "@/components/ui/Button"
import { membershipFormSchema } from "../data/membershipFormSchema"
import type { FileRecord, Values } from "../types/workspace"

export default function ApplicationReviewSummary({
  sections, fields, values, evidence, onEdit,
}: {
  sections: string[]
  fields: string[][]
  values: Values
  evidence: FileRecord[]
  onEdit: (index: number) => void
}) {
  // Display-only: these values never replace the backend request payload.
  const reviewFields = [
    ["legalName", "tradingName", "entityType", "registrationCountry", "registrationReference", "businessEmail", "registeredAddress", "ugandaAddress", "businessPhone", "website"],
    ["category", "operationalStatus", "services", "regions", "requestedTier", "parentGroup"],
    ["pdpoStatus", ...(values.pdpoStatus === "Registered" ? ["pdpoReference", "pdpoValidity"] : ["pdpoExplanation"]), "licenceRelevant", ...(values.licenceRelevant === "Yes" ? ["licenceType", "licenceStatus", ...(values.licenceStatus !== "Pending" ? ["licenceNumber"] : []), "licenceHolder", "licenceValidity", ...((fields[2] || []).includes("licenceType2") ? ["licenceType2", "licenceStatus2", ...(values.licenceStatus2 !== "Pending" ? ["licenceNumber2"] : []), "licenceHolder2"] : [])] : [])],
    ["applicantName", "applicantRole", "applicantEmail", "applicantPhone", "sameRepresentative", "representativeName", "representativeRole", "representativeEmail", "representativePhone", "alternateRepresentative", "authorityConfirmed"],
    ["billingEmail", "billingContact", "invoiceAddress", "tin", "purchaseOrder", "customerFacing", ...(values.customerFacing === "Yes" ? ["supportContact"] : [])],
    fields[5] || [],
    ["joiningReasons", "priorities", "workingGroups", "publicName", "publicDescription", "publicServices", "publicCoverage", "publicWebsite", "publicContact", "publicLogo"],
  ]
  const labels: Record<string, string> = {
    ugandaAddress: "Post Office Box Number", pdpoReference: "PDPO reference", pdpoValidity: "PDPO validity",
    licenceValidity: "Licence validity", parentGroup: "Parent or group information", sameRepresentative: "Representative is the same as applicant",
    alternateRepresentative: "Alternate representative", publicLogo: "Public company logo", joiningReasons: "Reasons for joining",
    priorities: "Top priorities", workingGroups: "Working-group interests", publicName: "Public profile name",
    publicDescription: "Public profile description", publicServices: "Public profile services", publicCoverage: "Public profile coverage",
    publicWebsite: "Public profile website", publicContact: "Public business contact", registrationEvidence: "Registration or establishment evidence",
    licenceEvidence: "Relevant licence evidence", authorityEvidence: "Representative authority evidence", pdpoEvidence: "PDPO evidence",
  }
  const label = (name: string) => {
    const base = name.replace(/2$/, "")
    return labels[name] || (membershipFormSchema.find(rule => rule.name === base)?.label || name.replace(/([A-Z])/g, " $1")) + (name !== base ? " (entry 2)" : "")
  }
  const answer = (name: string) => {
    const value = values[name]
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (name === "pdpoValidity" && /^(?:[1-9]|10)$/.test(String(value))) return `${value} ${String(value) === "1" ? "year" : "years"}`
    return String(value || "").trim() || "Not provided"
  }
  return (
    <section className="review-sections application-review" aria-label="Application answers">
      <style>{`.application-review { display: grid; gap: 14px; margin-bottom: 24px; }
.application-review > details { margin: 0; padding: 18px; border: 1px solid var(--border); border-radius: 6px; background: white; min-width: 0; }
.application-review summary { min-height: 44px; cursor: pointer; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.application-review .workspace-record { margin: 8px 0 14px; }
.application-review .workspace-record > div { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr); gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.application-review dt { color: var(--muted); font-size: 12px; }
.application-review dd { margin: 0; font-size: 13px; overflow-wrap: anywhere; white-space: pre-wrap; }
.application-review-files { list-style: none; margin: 0; padding: 0; }
.application-review-files li + li { margin-top: 5px; }
@media (max-width: 600px) { .application-review .workspace-record > div { grid-template-columns: minmax(0, 1fr); gap: 5px; } }`}</style>
      <p className="helper">Review your answers below. Open a section to see its details, or select Edit to make a correction.</p>
      {sections.slice(0, 7).map((section, index) => (
        <details className="workspace-panel" key={section} open={index === 0}>
          <summary>{section}</summary>
          <dl className="workspace-record">
            {(reviewFields[index] || fields[index] || []).map(name => {
              const documents = evidence.filter(file => file.category === name)
              return (
                <div key={name}>
                  <dt>{label(name)}</dt>
                  <dd>{name.endsWith("Evidence") || name === "publicLogo"
                    ? documents.length ? <ul className="application-review-files">{documents.map(file => <li key={file.id}>{file.name}</li>)}</ul> : name === "publicLogo" ? "Not provided (optional)" : "Not selected"
                    : answer(name)}</dd>
                </div>
              )
            })}
          </dl>
          <Button kind="ghost" onClick={() => onEdit(index)}>Edit {section}</Button>
        </details>
      ))}
    </section>
  )
}
