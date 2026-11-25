// src/features/portal/pages/MemberCompany.tsx

import { useState } from "react"
import type { LiveApplication } from "@/apiServices/webAplicatService"
import webAplicatService from "@/apiServices/webAplicatService"
import PageHeader from "@/components/dashboard/PageHeader"
import SectionNavigation from "@/components/dashboard/SectionNavigation"
import FormField from "@/components/dashboard/FormField"
import Button from "@/components/ui/Button"

interface MemberCompanyProps {
  application: LiveApplication
  section: string
  onNavigate: (route: string) => void
  onUpdated: (app: LiveApplication) => void
  onFeedback: (message: string, isError?: boolean) => void
}

export default function MemberCompany({
  application: app,
  section,
  onNavigate,
  onUpdated,
  onFeedback,
}: MemberCompanyProps) {
  const [saving, setSaving] = useState(false)
  const isProfile = section === "profile"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    // Old way of picking form data
    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries())

    const res = await webAplicatService.updateProfile(app.id, payload)
    setSaving(false)

    if (res.success) {
      onFeedback(res.message || "Company details updated successfully.")

      if (res.data?.application) {
        onUpdated(res.data.application)
      } else {
        onUpdated({
          ...app,
          legal_name: String(payload.legalName ?? app.legal_name ?? ""),
          legalName: String(payload.legalName ?? app.legalName ?? ""),
          trading_name: String(payload.tradingName ?? app.trading_name ?? ""),
          tradingName: String(payload.tradingName ?? app.tradingName ?? ""),
          registered_address: String(payload.registeredAddress ?? app.registered_address ?? ""),
          registeredAddress: String(payload.registeredAddress ?? app.registeredAddress ?? ""),
          business_email: String(payload.businessEmail ?? app.business_email ?? ""),
          businessEmail: String(payload.businessEmail ?? app.businessEmail ?? ""),
          business_phone: String(payload.businessPhone ?? app.business_phone ?? ""),
          businessPhone: String(payload.businessPhone ?? app.businessPhone ?? ""),
          website: String(payload.website ?? app.website ?? ""),
          representative_name: String(payload.representativeName ?? app.representative_name ?? ""),
          representativeName: String(payload.representativeName ?? app.representativeName ?? ""),
          representative_role: String(payload.representativeRole ?? app.representative_role ?? ""),
          representativeRole: String(payload.representativeRole ?? app.representativeRole ?? ""),
          representative_email: String(payload.representativeEmail ?? app.representative_email ?? ""),
          representativeEmail: String(payload.representativeEmail ?? app.representativeEmail ?? ""),
          representative_phone: String(payload.representativePhone ?? app.representative_phone ?? ""),
          representativePhone: String(payload.representativePhone ?? app.representativePhone ?? ""),
          billing_email: String(payload.billingEmail ?? app.billing_email ?? ""),
          billingEmail: String(payload.billingEmail ?? app.billingEmail ?? ""),
          billing_contact: String(payload.billingContact ?? app.billing_contact ?? ""),
          billingContact: String(payload.billingContact ?? app.billingContact ?? ""),
          invoice_address: String(payload.invoiceAddress ?? app.invoice_address ?? ""),
          invoiceAddress: String(payload.invoiceAddress ?? app.invoiceAddress ?? ""),
        })
      }
    } else {
      onFeedback(res.message || "Failed to save company details.", true)
    }
  }

  const legalName = app.legal_name || app.legalName || ""
  const tradingName = app.trading_name || app.tradingName || ""
  const businessEmail = app.business_email || app.businessEmail || ""
  const businessPhone = app.business_phone || app.businessPhone || ""
  const website = app.website || ""
  const registeredAddress = app.registered_address || app.registeredAddress || ""
  const representativeName = app.representative_name || app.representativeName || ""
  const representativeRole = app.representative_role || app.representativeRole || ""
  const representativeEmail = app.representative_email || app.representativeEmail || ""
  const representativePhone = app.representative_phone || app.representativePhone || ""
  const billingEmail = app.billing_email || app.billingEmail || ""
  const billingContact = app.billing_contact || app.billingContact || ""
  const invoiceAddress = app.invoice_address || app.invoiceAddress || ""

  return (
    <>
      <PageHeader
        title="Company & Organisation"
        description="Review and update your official organisation, contact, and legal representative details."
      />

      <SectionNavigation
        label="Company sections"
        items={[
          { id: "company", label: "Company details" },
          { id: "profile", label: "Directory profile" },
        ]}
        current={isProfile ? "profile" : "company"}
        onSelect={onNavigate}
      />

      {isProfile ? (
        <section className="workspace-panel">
          <h2>Public Directory Profile</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Approved public information is showcased on the official ISPAU member directory.
          </p>
          <dl className="workspace-record">
            <div>
              <dt>Legal name</dt>
              <dd>{legalName || "—"}</dd>
            </div>
            <div>
              <dt>Trading / Brand name</dt>
              <dd>{tradingName || "—"}</dd>
            </div>
            <div>
              <dt>Official website</dt>
              <dd>{website || "Not provided"}</dd>
            </div>
            <div>
              <dt>Primary public email</dt>
              <dd>{businessEmail || "—"}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <section className="workspace-panel">
          <form className="workspace-form" onSubmit={handleSubmit}>
            <h2>Official Organisation Records</h2>
            <p className="text-sm text-neutral-500 mb-4">
              Fields marked with * are required legal disclosures.
            </p>

            <div className="workspace-filter-grid">
              <FormField
                name="legalName"
                label="Legal Organisation Name"
                required
                value={legalName}
              />
              <FormField
                name="tradingName"
                label="Trading / Brand Name"
                value={tradingName}
              />
              <FormField
                name="businessEmail"
                label="Business Email"
                type="email"
                required
                value={businessEmail}
              />
              <FormField
                name="businessPhone"
                label="Business Phone"
                required
                value={businessPhone}
              />
              <FormField
                name="website"
                label="Website URL"
                value={website}
              />
              <FormField
                name="registeredAddress"
                label="Registered Legal Address"
                required
                value={registeredAddress}
              />
            </div>

            <h3 className="mt-8 text-lg font-semibold">Authorised Representative</h3>
            <div className="workspace-filter-grid">
              <FormField
                name="representativeName"
                label="Representative Full Name"
                required
                value={representativeName}
              />
              <FormField
                name="representativeRole"
                label="Job Title / Role"
                required
                value={representativeRole}
              />
              <FormField
                name="representativeEmail"
                label="Work Email"
                type="email"
                required
                value={representativeEmail}
              />
              <FormField
                name="representativePhone"
                label="Phone Contact"
                required
                value={representativePhone}
              />
            </div>

            <h3 className="mt-8 text-lg font-semibold">Billing Details</h3>
            <div className="workspace-filter-grid">
              <FormField
                name="billingEmail"
                label="Billing / Accounts Email"
                type="email"
                required
                value={billingEmail}
              />
              <FormField
                name="billingContact"
                label="Billing Contact Person"
                required
                value={billingContact}
              />
              <FormField
                name="invoiceAddress"
                label="Invoicing Address"
                value={invoiceAddress}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving changes…" : "Save changes to database"}
              </Button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
