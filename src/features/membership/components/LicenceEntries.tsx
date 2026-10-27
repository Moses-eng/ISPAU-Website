import type { MembershipApplicationValues } from "@/types/MembershipApplicationValues"
import ApplicationInput from "./ApplicationInput"
import Button from "@/components/ui/Button"
export default function LicenceEntries({
  values,
  errors,
  onChange,
  count,
  onCount,
}: {
  values: MembershipApplicationValues
  errors: Record<string, string>
  onChange: (name: string, value: string) => void
  count: number
  onCount: (count: number) => void
}) {
  return (
    <div className="conditional-panel">
      {Array.from({ length: count }, (_, i) => i + 1).map((index) => {
        const suffix = index === 1 ? "" : String(index)
        return (
          <fieldset key={index} className="additional-licence">
            <legend>Licence entry {index}</legend>
            <div className="field-grid">
              {[
                "Type",
                "Status",
                "Holder",
                ...(values[`licenceStatus${suffix}`] !== "Pending"
                  ? ["Number"]
                  : []),
              ].map((field) => (
                <ApplicationInput
                  key={field}
                  name={`licence${field}${suffix}`}
                  label={`Licence ${field.toLowerCase()}`}
                  values={values}
                  errors={errors}
                  setValue={onChange}
                  required
                  as={field === "Status" ? "select" : "input"}
                  options={
                    field === "Status"
                      ? ["Valid", "Pending", "Expired"]
                      : undefined
                  }
                />
              ))}
            </div>
          </fieldset>
        )
      })}
      <div className="button-row">
        <Button kind="secondary" onClick={() => onCount(count + 1)}>
          Add another licence
        </Button>
        {count > 1 && (
          <Button kind="ghost" onClick={() => onCount(count - 1)}>
            Remove last licence
          </Button>
        )}
      </div>
      <p className="helper">
        Pending or expired status is recorded for human review and does not
        automatically prove eligibility.
      </p>
    </div>
  )
}
