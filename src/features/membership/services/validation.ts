import { membershipFormSchema } from "../data/membershipFormSchema.ts"
import type { FileRecord, Values } from "../types/workspace.ts"
export function validateApplication(values: Values, evidence: FileRecord[]) {
  const errors: Record<string, string> = {}
  for (const rule of membershipFormSchema) {
    const needed =
      typeof rule.required === "function"
        ? rule.required(values)
        : rule.required
    if (
      needed &&
      (values[rule.name] === false || !String(values[rule.name] ?? "").trim())
    )
      errors[rule.name] = `${rule.label} is required.`
  }
  for (const key of [
    "businessEmail",
    "applicantEmail",
    "representativeEmail",
    "billingEmail",
  ]) {
    if (values[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values[key])))
      errors[key] = "Enter a valid work email address."
  }
  if (
    String(values.licenceRelevant || "").startsWith("No") &&
    !values.licenceExplanation
  )
    errors.licenceExplanation =
      "Explain why a telecom licence is not applicable."
  if (values.licenceRelevant === "Yes")
    for (let index = 2; index <= Number(values.licenceEntries || 1); index++)
      for (const key of [
        "licenceType",
        "licenceStatus",
        "licenceHolder",
        ...(values[`licenceStatus${index}`] !== "Pending"
          ? ["licenceNumber"]
          : []),
      ])
        if (!values[`${key}${index}`])
          errors[`${key}${index}`] = "Complete this licence entry."
  const required = [
    "registrationEvidence",
    "authorityEvidence",
    ...(values.licenceRelevant === "Yes" ? ["licenceEvidence"] : []),
    ...(values.pdpoStatus === "Registered" ? ["pdpoEvidence"] : []),
  ]
  required.forEach((category) => {
    if (!evidence.some((file) => file.category === category))
      errors[category] = "Select the required private evidence."
  })
  evidence.forEach((file) => {
    if (
      file.size > 10 * 1024 * 1024 ||
      !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
    )
      errors[file.category] = "Use a PDF/JPG/PNG file no larger than 10 MB."
  })
  return errors
}
