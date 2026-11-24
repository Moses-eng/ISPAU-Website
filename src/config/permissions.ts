import type {
  Actor,
  Application,
  WorkspaceState,
} from "../features/membership/types/workspace.ts"

export type Permission =
  | "overview.view"
  | "membership.view"
  | "applications.review"
  | "applications.decide"
  | "members.manage"
  | "directory.manage"
  | "billing.view"
  | "billing.manage"
  | "payments.confirm"
  | "membership.activate"
  | "renewals.manage"
  | "reports.membership"
  | "reports.finance"
  | "administration.manage"
  | "audit.global"
  | "export.register"
  | "staff.accounts.manage"
  | "trade-credit.view"
  | "trade-credit.review"
  | "site.manage"

const membership: Permission[] = [
  "trade-credit.review",
  "overview.view",
  "applications.review",
  "members.manage",
  "directory.manage",
  "billing.view",
  "membership.activate",
  "renewals.manage",
  "reports.membership",
]
const finance: Permission[] = [
  "membership.view",
  "overview.view",
  "billing.view",
  "billing.manage",
  "payments.confirm",
  "reports.finance",
]
export function can(actor: Actor | null, permission: Permission): boolean {
  if (actor?.kind !== "staff") return false
  return actor.roles.some(
    (role) =>
      role === "super_admin" ||
      (role === "membership_admin" && membership.includes(permission)) ||
      (role === "operations_officer" &&
        [
          "overview.view",
          "applications.review",
          "billing.view",
          "trade-credit.view",
          "reports.membership",
          "reports.finance",
        ].includes(permission)) ||
      (role === "finance_admin" && finance.includes(permission)),
  )
}

export function canAccessSection(
  actor: Actor | null,
  section: string,
): boolean {
  const rules: Record<string, Permission[]> = {
    overview: ["overview.view"],
    membership: ["applications.review", "membership.view"],
    finance: ["billing.view"],
    applications: ["applications.review", "membership.view"],
    members: ["members.manage", "billing.manage"],
    billing: ["billing.view"],
    communications: ["renewals.manage", "membership.view"],
    reports: ["reports.membership", "reports.finance"],
    administration: ["administration.manage"],
    settings: ["site.manage"],
    "staff-activity": ["audit.global"],
    "membership-activity": ["members.manage", "membership.view"],
    "finance-activity": ["billing.manage"],
    "trade-credit": ["trade-credit.review", "trade-credit.view"],
  }
  return (rules[section] || []).some((permission) => can(actor, permission))
}

// Restricted summary for callers without full membership read access.
function billingSummary(a: Application): Application {
  return {
    id: a.id,
    organisationId: a.organisationId,
    organisation: a.organisation,
    stage: a.stage,
    requestedTier: a.requestedTier,
    confirmedTier: a.confirmedTier,
    submittedAt: a.submittedAt,
    updatedAt: a.updatedAt,
    reviewer: "",
    values: {
      billingEmail: a.values.billingEmail || "",
      registeredAddress: a.values.registeredAddress || "",
    },
    evidence: [],
    verifications: [],
    clarifications: [],
    decisions: [],
    activity: a.activity.filter((event) => event.scope === "billing"),
    eligible: false,
    profileApproved: false,
    consent: false,
    profile: {
      name: "",
      description: "",
      services: "",
      coverage: "",
      website: "",
      contact: "",
    },
    standing: a.standing,
    portalAccess: false,
    memberId: a.memberId,
    periodStart: a.periodStart,
    periodEnd: a.periodEnd,
  }
}

export function workspaceForActor(
  state: WorkspaceState,
  actor: Actor | null,
): WorkspaceState {
  const applications =
    actor?.kind === "organisation"
      ? state.applications.filter(
          (a) => a.organisationId === actor.organisationId && a.portalAccess,
        )
      : can(actor, "applications.review") || can(actor, "membership.view")
        ? state.applications.filter((a) => a.stage !== "Draft")
        : can(actor, "billing.manage")
          ? state.applications
              .filter(
                (a) =>
                  a.stage !== "Draft" &&
                  (a.stage === "Active" ||
                    state.invoices.some((i) => i.applicationId === a.id)),
              )
              .map(billingSummary)
          : actor
            ? []
            : state.applications.map((a) => ({
                ...billingSummary(a),
                values: {},
                activity: [],
                portalAccess: a.portalAccess,
              }))
  const ids = new Set(applications.map((a) => a.id))
  return {
    ...state,
    applications,
    invoices:
      actor && (actor.kind === "organisation" || can(actor, "billing.view"))
        ? state.invoices
            .filter((i) => ids.has(i.applicationId))
            .map((i) =>
              actor.kind === "staff" && !can(actor, "billing.manage")
                ? { ...i, receipt: undefined, taxInvoice: undefined }
                : i,
            )
        : [],
    notices:
      actor &&
      (actor.kind === "organisation" ||
        can(actor, "applications.review") ||
        can(actor, "membership.view"))
        ? state.notices.filter((n) => ids.has(n.applicationId))
        : [],
  }
}
