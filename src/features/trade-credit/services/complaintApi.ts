import type {
  CreditActor,
  Complaint,
  ReferenceQuery,
  ReferenceResult,
} from "./complaints"
export type ComplaintSnapshot = {
  records: Complaint[]
  notices: Pick<Complaint, "id" | "status" | "updatedAt">[]
  searches: ReferenceQuery[]
}
export async function complaintRequest<T>(
  actor: CreditActor,
  eligible: boolean,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/trade-credit${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(import.meta.env.DEV
        ? {
            "X-Preview-Actor": encodeURIComponent(JSON.stringify(actor)),
            "X-Preview-Eligible": String(eligible),
          }
        : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw Error(
      error.message || "Trade Credit is unavailable. Please try again.",
    )
  }
  return response.json()
}
export type ReferenceResponse = {
  query: ReferenceQuery
  results: ReferenceResult[]
}
export async function downloadEvidence(
  actor: CreditActor,
  eligible: boolean,
  complaintId: string,
  id: string,
  name: string,
) {
  const response = await fetch(
    `/api/trade-credit/complaints/${encodeURIComponent(complaintId)}/evidence/${encodeURIComponent(id)}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      headers: import.meta.env.DEV
        ? {
            "X-Preview-Actor": encodeURIComponent(JSON.stringify(actor)),
            "X-Preview-Eligible": String(eligible),
          }
        : {},
    },
  )
  if (!response.ok)
    throw Error(
      "Evidence unavailable. Please try again or ask the ISP to reattach it.",
    )
  const url = URL.createObjectURL(await response.blob())
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
