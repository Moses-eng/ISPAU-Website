import { useState, type FormEvent } from "react"
import PublicShell from "@/components/layout/PublicShell"
import PageHero from "@/components/ui/PageHero"
import FormField from "@/components/dashboard/FormField"
import Button from "@/components/ui/Button"
import type { View } from "@/types/View"
import { creditService } from "./service"
export default function CustomerRequests({
  go,
  dispute = false,
}: {
  go: (v: View) => void
  dispute?: boolean
}) {
  const [error, setError] = useState(""),
    [reference, setReference] = useState("")
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const f = new FormData(event.currentTarget)
    try {
      setReference(
        creditService.request({
          kind: dispute ? "Dispute or appeal" : "Request my record",
          name: String(f.get("name") || ""),
          contact: String(f.get("contact") || ""),
          recordId: String(f.get("recordId") || ""),
          reason: String(f.get("reason") || ""),
        }),
      )
      setError("")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Customer rights"
        title={
          dispute
            ? "Dispute or appeal a record"
            : "Request your business record"
        }
        text="Request access or correction through the Secretariat. Private payment records are never displayed on this public page."
      />
      <section className="section">
        <div className="workspace-panel max-w-3xl mx-auto">
          <p>
            <strong>Request information</strong> Save your request reference and
            contact the Secretariat to complete the request. Private records are
            not released automatically.
          </p>
          <p>
            ISPAU must verify your identity and authority before disclosing any
            record. Do not upload national IDs, personal bank statements or
            customer databases here.
          </p>
          {reference ? (
            <div role="status">
              <h2>Request recorded</h2>
              <p>
                Your reference: {reference}. Your request is recorded for this
                session. Contact the Secretariat with your reference.
              </p>
              <Button onClick={() => go("contact")}>
                Contact the Secretariat
              </Button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <p>* Required</p>
              {error && <p role="alert">{error}</p>}
              <div className="grid gap-5">
                <FormField
                  name="name"
                  label="Business customer name"
                  required
                />
                <FormField
                  name="contact"
                  label="Business reply email"
                  type="email"
                  required
                />
                <FormField name="recordId" label="Case reference (if known)" />
                <FormField
                  name="reason"
                  label={
                    dispute ? "Dispute or appeal details" : "Request details"
                  }
                  multiline
                  required
                />
                <label className="flex items-start gap-3">
                  <input type="checkbox" required />
                  <span>
                    I am authorised to make this request for the business. *
                  </span>
                </label>
                <Button type="submit">Record request</Button>
              </div>
            </form>
          )}
          <p className="mt-5">
            Supporting evidence and personal contacts stay private. A contested
            claim must remain marked disputed pending independent review. Final
            service rules, privacy notices and retention arrangements require
            ISPAU approval.
          </p>
        </div>
      </section>
    </PublicShell>
  )
}
