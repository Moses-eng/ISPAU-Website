import { useState, type FormEvent } from "react"
import type { Actor } from "@/features/membership/types/workspace"
import Button from "@/components/ui/Button"
import FormField from "@/components/dashboard/FormField"
import StatusBadge from "@/components/dashboard/StatusBadge"
import DataTable from "@/components/dashboard/DataTable"
import useCreditWorkspace, { creditService } from "./service"
import { referenceResults } from "./model"
export default function CreditReferences({ actor }: { actor: Actor }) {
  const state = useCreditWorkspace(),
    [searchId, setSearchId] = useState(""),
    [error, setError] = useState("")
  const results = searchId ? referenceResults(state, actor, searchId) : []
  const search = state.searches.find((s) => s.id === searchId)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const f = new FormData(event.currentTarget)
    try {
      creditService.dispatch(actor, {
        type: "search",
        customer: String(f.get("customer") || ""),
        purpose: String(f.get("purpose") || ""),
        authorised: f.has("authorised"),
      })
      setSearchId(creditService.getSnapshot().searches.at(-1)!.id)
      setError("")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <>
      <form className="workspace-panel" onSubmit={submit}>
        <h2>Request an authorised credit reference</h2>
        <p>
          * Required. Every request, including no-match requests, is logged. Use
          an exact business customer name; there is no bulk customer directory.
        </p>
        {error && <p role="alert">{error}</p>}
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
            I am authorised to request this reference for the stated credit
            decision. *
          </span>
        </label>
        <Button type="submit">Log request and view reference</Button>
      </form>
      {search && (
        <section className="workspace-panel" role="status">
          <h2>Reference result</h2>
          <p>
            Audit reference: {search.id} ·{" "}
            {new Date(search.date).toLocaleString()}
          </p>
          {results.length ? (
            <DataTable
              rows={results}
              rowKey={(r) => r.id}
              label="Authorised reference results"
              columns={[
                { label: "Customer", cell: (r) => r.customer },
                {
                  label: "Status",
                  cell: (r) => (
                    <>
                      <StatusBadge status={r.status} />
                      {r.status === "disputed" && (
                        <small className="block">
                          Contested claim; not a confirmed default.
                        </small>
                      )}
                    </>
                  ),
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
              <strong>
                No verified record found — insufficient information.
              </strong>{" "}
              This is not a positive credit assessment and does not establish
              creditworthiness.
            </p>
          )}
          <p>
            Supporting evidence, contracts, personal contacts and confidential
            invoice terms are excluded.
          </p>
        </section>
      )}
      <section className="workspace-panel">
        <h2>Your request history</h2>
        <DataTable
          rows={state.searches.filter(
            (s) => s.organisationId === actor.organisationId,
          )}
          rowKey={(r) => r.id}
          label="Own reference request history"
          columns={[
            { label: "Customer", cell: (r) => r.customer },
            { label: "Purpose", cell: (r) => r.purpose },
            {
              label: "Requested",
              cell: (r) => new Date(r.date).toLocaleString(),
            },
            {
              label: "Action",
              cell: (r) => (
                <Button kind="secondary" onClick={() => setSearchId(r.id)}>
                  View current result
                </Button>
              ),
            },
          ]}
        />
      </section>
    </>
  )
}
