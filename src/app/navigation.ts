export function navigateTo(path: string) {
  history.pushState(null, "", path)
  window.dispatchEvent(new PopStateEvent("popstate"))
  window.scrollTo({ top: 0, behavior: "instant" })
}
export const staffAliases: Record<string, string> = {
  staff: "overview",
  "staff-review": "applications",
  activation: "billing",
  decision: "applications",
  accounts: "billing",
  "member-register": "members",
  "directory-admin": "members",
  "email-templates": "communications",
  admin: "administration",
  system: "administration",
  mfa: "overview",
}
export const portalAliases: Record<string, string> = {
  applicant: "overview",
  member: "overview",
  apply: "application",
  submitted: "overview",
  "applicant-invoices": "invoices",
  "invoice-detail": "invoices",
  "payment-instructions": "invoices",
  clarification: "overview",
  "org-details": "organisation",
  "member-invoices": "invoices",
  renewal: "renewal",
  welcome: "overview",
  profile: "profile",
}
