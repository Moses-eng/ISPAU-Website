import { useState, type FormEvent } from "react"
import PublicShell from "@/components/layout/PublicShell"
import PageHero from "@/components/ui/PageHero"
import FormField from "@/components/dashboard/FormField"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import type { View } from "@/types/View"
import { disputeService, type Dispute } from "@/apiServices/disputeService"

export default function CustomerRequests({
  go,
  dispute = false,
}: {
  go: (v: View) => void
  dispute?: boolean
}) {
  const [error, setError] = useState("")
  const [submittedDispute, setSubmittedDispute] = useState<Dispute | null>(null)
  const [reference, setReference] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)

    const f = new FormData(event.currentTarget)

    try {
      const res = await disputeService.create({
        name: String(f.get("name") || "").trim(),
        email: String(f.get("email") || "").trim(),
        recordId: String(f.get("recordId") || "").trim(),
        reason: String(f.get("reason") || "").trim(),
      })

      if (res.success && res.data) {
        setSubmittedDispute(res.data)
        setReference(res.data.id || String(f.get("recordId") || "REC-SUBMITTED"))
        setError("")
      } else {
        setError(res.message || "Failed to record your request. Please verify your details and try again.")
      }
    } catch (e) {
      setError((e as Error).message || "A network or server error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyReference = () => {
    if (!reference) return
    void navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleReset = () => {
    setSubmittedDispute(null)
    setReference("")
    setError("")
    setCopied(false)
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
            /* =================== SUCCESS ALERT & RECEIPT UI =================== */
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: "1.75rem",
                borderRadius: "14px",
                border: "1px solid #bbf7d0",
                background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
                padding: "28px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="check" size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#14532d" }}>
                    Request successfully recorded
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#166534" }}>
                    Your submission has been securely logged with the ISPAU Secretariat.
                  </p>
                </div>
              </div>

              {/* Reference ID copy banner */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #dcfce7",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  margin: "20px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Case Reference Number
                  </span>
                  <code style={{ fontSize: "1.15rem", fontWeight: 700, color: "#15803d", letterSpacing: "0.02em" }}>
                    {reference}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "0.85rem",
                    padding: "6px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  {copied ? (
                    <>
                      <Icon name="check" size={14} /> Copied!
                    </>
                  ) : (
                    "Copy reference"
                  )}
                </button>
              </div>

              {/* Submission details recap */}
              {submittedDispute && (
                <div
                  style={{
                    fontSize: "0.88rem",
                    color: "#374151",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    padding: "14px 18px",
                    marginBottom: "20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                  }}
                >
                  <div>
                    <span style={{ color: "#6b7280", display: "block", fontSize: "0.75rem" }}>Customer Name</span>
                    <strong>{submittedDispute.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280", display: "block", fontSize: "0.75rem" }}>Reply Email</span>
                    <strong>{submittedDispute.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280", display: "block", fontSize: "0.75rem" }}>Initial Status</span>
                    <span
                      style={{
                        display: "inline-block",
                        background: "#fef3c7",
                        color: "#92400e",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        textTransform: "capitalize",
                      }}
                    >
                      {submittedDispute.status || "Pending"}
                    </span>
                  </div>
                </div>
              )}

              <p style={{ fontSize: "0.92rem", color: "#374151", lineHeight: 1.5, margin: "0 0 20px" }}>
                Please retain your reference number. When contacting the Secretariat, quote this identifier
                so our review officers can access your case file without delay.
              </p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <Button onClick={() => go("contact")}>
                  Contact the Secretariat
                </Button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.9rem", padding: "10px 18px" }}
                >
                  Submit another request
                </button>
              </div>
            </div>
          ) : (
            /* =================== SUBMISSION FORM =================== */
            <form onSubmit={submit} style={{ marginTop: "1.5rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--muted, #6b7280)" }}>* Required fields</p>

              {/* =================== ERROR ALERT UI =================== */}
              {error && (
                <div
                  role="alert"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "14px 16px",
                    marginBottom: "20px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    fontSize: "0.92rem",
                  }}
                >
                  <span style={{ flexShrink: 0, marginTop: "2px" }}>
                    <Icon name="shield" size={18} />
                  </span>
                  <div>
                    <strong style={{ display: "block", marginBottom: "2px" }}>Unable to submit request</strong>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="grid gap-5">
                <FormField
                  name="name"
                  label="Business customer name"
                  required
                />
                <FormField
                  name="email"
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
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Recording request…" : "Record request"}
                </Button>
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
