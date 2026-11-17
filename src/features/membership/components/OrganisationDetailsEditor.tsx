import type { Actor, Application } from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import Button from "@/components/ui/Button"
import FormField from "@/components/dashboard/FormField"
import { membershipService } from "@/services/membershipService"
export default function OrganisationDetailsEditor({
  application: a,
  actor,
  feedback,
  section,
  compact = false,
}: {
  application: Application
  actor: Actor
  feedback: (message: string, error?: boolean) => void
  compact?: boolean
  section: string
}) {
  const organisationFields = [
    ["legalName", "Legal organisation name"],
    ["registeredAddress", "Registered address"],
    ["businessEmail", "Business email"],
    ["businessPhone", "Business phone"],
    ["billingEmail", "Billing email"],
  ]
  const representativeFields = [
    ["representativeName", "Representative name"],
    ["representativeRole", "Representative role"],
    ["representativeEmail", "Representative work email"],
    ["representativePhone", "Representative phone"],
  ]
  const fields =
    section === "company"
      ? [...organisationFields, ...representativeFields]
      : section === "organisation"
        ? organisationFields
        : representativeFields
  return (
    <>
      {!compact && (
        <PageHeader
          title={
            section === "organisation"
              ? "Organisation details"
              : "Representatives"
          }
          description="Keep private account details accurate. These fields are not automatically published."
        />
      )}
      <section className="workspace-panel">
        <form
          className="workspace-form"
          onSubmit={(e) => {
            e.preventDefault()
            try {
              const data = new FormData(e.currentTarget)
              membershipService.dispatch(actor, {
                type: "details",
                id: a.id,
                values: Object.fromEntries(
                  fields.map(([key]) => [key, String(data.get(key) || "")]),
                ),
              })
              feedback("Organisation details saved.")
            } catch (error) {
              feedback((error as Error).message, true)
            }
          }}
        >
          <h2>
            {section === "company"
              ? "Organisation & representatives"
              : "Private details"}
          </h2>
          <p>
            * Required. These details remain private unless separately approved
            for the directory.
          </p>
          <div className="workspace-filter-grid">
            {fields.map(([name, label]) => (
              <FormField
                key={name}
                name={name}
                label={label}
                required
                value={String(a.values[name] || "")}
                type={name.toLowerCase().includes("email") ? "email" : "text"}
              />
            ))}
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </section>
    </>
  )
}
