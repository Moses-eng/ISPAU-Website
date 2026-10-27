import { useState, type FormEvent } from "react"
import Button from "@/components/ui/Button"
import FormField from "@/components/dashboard/FormField"
import { acceptFile } from "@/features/membership/services/files"
import type { Actor, FileRecord } from "@/features/membership/types/workspace"
import { creditService } from "./service"
export default function CreditSubmission({
  actor,
  satisfactory,
  onDone,
}: {
  actor: Actor
  satisfactory?: boolean
  onDone: () => void
}) {
  const [error, setError] = useState("")
  const [files, setFiles] = useState<FileRecord[]>([])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const v = (name: string) => String(data.get(name) || "").trim()
    try {
      creditService.dispatch(
        actor,
        satisfactory
          ? {
              type: "reference",
              customer: v("customer"),
              summary: v("summary"),
            }
          : {
              type: "submit",
              customer: v("customer"),
              contract: v("contract"),
              invoices: v("invoices"),
              history: v("history"),
              balance: Number(v("balance")),
              currency: v("currency").toUpperCase(),
              reminders: v("reminders"),
              evidence: files,
            },
      )
      onDone()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <form className="workspace-panel" onSubmit={submit}>
      <h2>
        {satisfactory
          ? "Record satisfactory payment history"
          : "Submit a payment record"}
      </h2>
      <p>
        * Required. New submissions require ISPAU verification before reference
        access.
      </p>
      {error && (
        <p role="alert" className="workspace-feedback error">
          {error}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <FormField name="customer" label="Business customer name" required />
        {satisfactory ? (
          <FormField
            name="summary"
            label="Satisfactory payment history"
            multiline
            required
          />
        ) : (
          <>
            <FormField name="contract" label="Contract reference" required />
            <FormField
              name="invoices"
              label="Invoice references and due dates"
              multiline
              required
            />
            <FormField
              name="history"
              label="Payment history"
              multiline
              required
            />
            <FormField
              name="balance"
              label="Outstanding balance"
              type="number"
              required
            />
            <FormField
              name="currency"
              label="Currency"
              options={["UGX", "USD", "EUR", "GBP"]}
              required
            />
            <FormField
              name="reminders"
              label="Reminders and customer response"
              multiline
              required
            />
            <label className="field">
              <span>Supporting evidence * · PDF/JPG/PNG, up to 10 MB each</span>
              <input
                type="file"
                aria-label="Supporting evidence"
                accept="application/pdf,image/jpeg,image/png"
                multiple
                required={!files.length}
                onChange={(event) => {
                  try {
                    const added = Array.from(event.target.files || []).map(
                      (f) => acceptFile(f, "trade-credit"),
                    )
                    setFiles((old) => [...old, ...added])
                    setError("")
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              />
              <small>Selected files are available for this session.</small>
            </label>
          </>
        )}
      </div>
      {files.map((f) => (
        <div key={f.id} className="flex items-center justify-between gap-3">
          <span>{f.name}</span>
          <Button
            kind="ghost"
            onClick={() => setFiles(files.filter((x) => x.id !== f.id))}
          >
            Remove {f.name}
          </Button>
        </div>
      ))}
      <div className="mt-6">
        <Button type="submit">
          {satisfactory
            ? "Save satisfactory reference"
            : "Submit for ISPAU verification"}
        </Button>
      </div>
    </form>
  )
}
