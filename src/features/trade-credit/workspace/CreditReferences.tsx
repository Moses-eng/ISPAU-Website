import { useState, type FormEvent } from "react"
import type { Actor } from "@/features/membership/types/workspace"
import Button from "@/components/ui/Button"
import FormField from "@/components/dashboard/FormField"
import DataTable from "@/components/dashboard/DataTable"
import {
  complaintRequest,
  type ReferenceResponse,
} from "../services/complaintApi"
import { canParticipate } from "./model"
import { membershipService } from "@/services/membershipService"
import useCreditWorkspace from "./service"
export default function CreditReferences({ actor }: { actor: Actor }) {
  const state = useCreditWorkspace()
  const [result, setResult] = useState<ReferenceResponse | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const f = new FormData(event.currentTarget)
    const membership = membershipService.getSnapshot()
    setBusy(true)
    setResult(null)
    setError("")
    try {
      setResult(
        await complaintRequest<ReferenceResponse>(
          actor,
          canParticipate(actor, membership.applications, membership.invoices),
          "/references",
          {
            customer: String(f.get("customer") || ""),
            purpose: String(f.get("purpose") || ""),
            authorised: f.has("authorised"),
          },
        ),
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <form className="workspace-panel" onSubmit={submit}>
        <h2>Request a credit reference</h2>
        <p>
          Search an exact business name for an authorised credit decision. Every
          request is logged.
        </p>
        {error && (
          <p className="workspace-feedback error" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            name="customer"
            label="Exact business customer name"
            required
          />
          <FormField
            name="purpose"
            label="Legitimate credit decision purpose"
            required
            multiline
          />
        </div>
        <label className="flex items-start gap-3 my-5">
          <input type="checkbox" name="authorised" required />
          <span>
            I am authorised to request this reference for the stated purpose. *
          </span>
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? "Checking…" : "Request reference"}
        </Button>
      </form>
      {result && (
        <section className="workspace-panel" role="status">
          <h2>Reference result</h2>
          <p>
            Audit reference: {result.query.id} ·{" "}
            {new Date(result.query.date).toLocaleString()}
          </p>
          {result.results.length ? (
            <DataTable
              rows={result.results}
              rowKey={(r) => r.id}
              label="Authorised reference results"
              columns={[
                { label: "Customer", cell: (r) => r.customer },
                {
                  label: "Status",
                  cell: (r) =>
                    r.status === "disputed"
                      ? "Disputed — not a confirmed default"
                      : r.status,
                },
                {
                  label: "Outstanding",
                  cell: (r) => `${r.balance.toLocaleString()} ${r.currency}`,
                },
                {
                  label: "Last update",
                  cell: (r) => new Date(r.updatedAt).toLocaleDateString(),
                },
              ]}
            />
          ) : (
            <p>
              No verified record found. This is insufficient information, not a
              positive credit assessment.
            </p>
          )}
        </section>
      )}
      <section className="workspace-panel">
        <h2>Your reference requests</h2>
        <DataTable
          rows={state.searches.filter(
            (q) => q.organisationId === actor.organisationId,
          )}
          rowKey={(q) => q.id}
          label="Your reference request history"
          columns={[
            { label: "Customer", cell: (q) => q.customer },
            { label: "Purpose", cell: (q) => q.purpose },
            {
              label: "Requested",
              cell: (q) => new Date(q.date).toLocaleString(),
            },
          ]}
        />
      </section>
    </>
  )
}
