import type { MembershipFieldRule } from "@/types/MembershipFieldRule"

export const membershipFormSchema: MembershipFieldRule[] = [
  { name: "legalName", label: "Organisation legal name", required: true },
  {
    name: "tradingName",
    label: "Trading name",
    required: false,
    optional: true,
  },
  { name: "entityType", label: "Entity type", required: true },
  {
    name: "registrationCountry",
    label: "Registration country",
    required: true,
  },
  {
    name: "registrationReference",
    label: "Registration number or equivalent establishment reference",
    required: true,
  },
  { name: "registeredAddress", label: "Registered address", required: true },
  {
    name: "ugandaAddress",
    label: "Uganda operating address",
    required: true,
  },
  { name: "businessEmail", label: "Main business email", required: true },
  { name: "businessPhone", label: "Main business phone", required: true },
  { name: "website", label: "Website", required: false, optional: true },
  { name: "category", label: "Organisation category", required: true },
  { name: "services", label: "Services", required: true },
  { name: "operationalStatus", label: "Operational status", required: true },
  { name: "regions", label: "Districts or regions served", required: true },
  { name: "requestedTier", label: "Requested membership tier", required: true },
  { name: "pdpoStatus", label: "PDPO registration status", required: true },
  {
    name: "pdpoExplanation",
    label: "PDPO status explanation",
    required: (values) =>
      values.pdpoStatus === "Pending" || values.pdpoStatus === "Not applicable",
  },
  {
    name: "licenceRelevant",
    label: "Telecom licence relevance",
    required: true,
  },
  {
    name: "licenceType",
    label: "Licence type",
    required: (values) => values.licenceRelevant === "Yes",
  },
  {
    name: "licenceStatus",
    label: "Licence status",
    required: (values) => values.licenceRelevant === "Yes",
  },
  {
    name: "licenceNumber",
    label: "Licence number",
    required: (values) =>
      values.licenceRelevant === "Yes" && values.licenceStatus !== "Pending",
  },
  {
    name: "licenceHolder",
    label: "Licence holder",
    required: (values) => values.licenceRelevant === "Yes",
  },
  { name: "applicantName", label: "Applicant name", required: true },
  { name: "applicantRole", label: "Applicant role", required: true },
  { name: "applicantEmail", label: "Applicant work email", required: true },
  { name: "applicantPhone", label: "Applicant phone", required: true },
  {
    name: "representativeName",
    label: "Authorised membership representative name",
    required: true,
  },
  {
    name: "representativeRole",
    label: "Authorised representative role",
    required: true,
  },
  {
    name: "representativeEmail",
    label: "Authorised representative work email",
    required: true,
  },
  {
    name: "representativePhone",
    label: "Authorised representative phone",
    required: true,
  },
  {
    name: "authorityConfirmed",
    label: "Confirmation of authority",
    required: true,
  },
  { name: "billingEmail", label: "Billing email", required: true },
  {
    name: "billingContact",
    label: "Billing contact name or accounts role",
    required: true,
  },
  { name: "invoiceAddress", label: "Invoice address", required: true },
  { name: "tin", label: "TIN", required: false, optional: true },
  {
    name: "purchaseOrder",
    label: "Purchase-order or reference",
    required: false,
    optional: true,
  },
  {
    name: "customerFacing",
    label: "Customer-facing provider",
    required: true,
  },
  {
    name: "supportContact",
    label: "Support or complaints email / policy link",
    required: (values) => values.customerFacing === "Yes",
  },
  {
    name: "accuracyDeclaration",
    label: "Accuracy declaration",
    required: true,
  },
  {
    name: "authorityDeclaration",
    label: "Authority declaration",
    required: true,
  },
  {
    name: "rulesDeclaration",
    label: "Membership rules declaration",
    required: true,
  },
  {
    name: "hasRestrictions",
    label: "Relevant operating restrictions",
    required: true,
  },
  {
    name: "restrictionDetails",
    label: "Restriction details",
    required: (values) => values.hasRestrictions === "Yes",
  },
  {
    name: "restrictionsDeclaration",
    label: "Operating restrictions declaration",
    required: true,
  },
  {
    name: "privacyDeclaration",
    label: "Privacy acknowledgement",
    required: true,
  },
]
