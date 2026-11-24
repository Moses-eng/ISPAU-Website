import Button from "@/components/ui/Button"
import { membershipFormSchema } from "../data/membershipFormSchema"
import type { FileRecord, Values } from "../types/workspace"
export default function ApplicationReviewSummary({
  sections,
  fields,
  values,
  evidence,
  onEdit,
}: {
  sections: string[]
  fields: string[][]
  values: Values
  evidence: FileRecord[]
  onEdit: (index: number) => void
}) {
  return (
    <section className="review-sections">
      {sections.slice(0, 7).map((section, index) => {
        const names =
          index === 6
            ? [
                "publicName",
                "publicDescription",
                "publicServices",
                "publicCoverage",
                "publicWebsite",
                "publicContact",
              ]
            : fields[index]
        return (
          <details className="workspace-panel" key={section} open={index === 0}>
            <summary>{section}</summary>
            <dl className="workspace-record">
              {names.map((name) => (
                <div key={name}>
                  <dt>
                    {membershipFormSchema.find((rule) => rule.name === name)
                      ?.label || name.replace(/([A-Z])/g, " $1")}
                  </dt>
                  <dd>
                    {name.endsWith("Evidence")
                      ? evidence.find((f) => f.category === name)?.name ||
                        "Not selected"
                      : typeof values[name] === "boolean"
                        ? values[name]
                          ? "Yes"
                          : "No"
                        : values[name] || "Not provided"}
                  </dd>
                </div>
              ))}
            </dl>
            <Button kind="ghost" onClick={() => onEdit(index)}>
              Edit {section}
            </Button>
          </details>
        )
      })}
    </section>
  )
}
