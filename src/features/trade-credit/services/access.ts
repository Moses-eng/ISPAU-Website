export type SubscriptionApplication = {
  id: string
  organisationId: string
  stage: string
  portalAccess: boolean
  periodEnd: string
  values: Record<string, string | boolean>
}
export type SubscriptionInvoice = {
  applicationId: string
  status: string
  periodStart: string
  periodEnd: string
}
export function todayInUganda(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}
export function tradeCreditEligibility(
  application: SubscriptionApplication | undefined,
  invoices: SubscriptionInvoice[],
  today = todayInUganda(),
): {
  allowed: boolean
  validThrough?: string
  reason:
    "available" | "verification" | "subscription" | "restricted" | "not-isp"
} {
  if (!application || application.stage !== "Active")
    return { allowed: false, reason: "verification" }
  if (!application.portalAccess) return { allowed: false, reason: "restricted" }
  const category = String(application.values.category || "")
    .trim()
    .toLowerCase()
  // Older preview records have no category. Explicit non-ISP categories never gain access.
  if (category && !["internet service provider", "isp"].includes(category))
    return { allowed: false, reason: "not-isp" }
  const paidThrough = invoices.filter(
    (invoice) =>
      invoice.applicationId === application.id &&
      invoice.status === "Confirmed" &&
      invoice.periodStart <= today &&
      invoice.periodEnd >= today,
  )
  const renewedThrough = paidThrough.reduce(
    (latest, invoice) =>
      invoice.periodEnd > latest ? invoice.periodEnd : latest,
    "",
  )
  if (application.periodEnd >= today || renewedThrough)
    return {
      allowed: true,
      reason: "available",
      validThrough:
        renewedThrough > application.periodEnd
          ? renewedThrough
          : application.periodEnd,
    }
  return { allowed: false, reason: "subscription" }
}
