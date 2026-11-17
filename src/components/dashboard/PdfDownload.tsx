import { useState } from "react"
import Button from "@/components/ui/Button"
import applicationService from "@/apiServices/applicationService"

export default function PdfDownload({
  request,
  label = "Download application summary PDF",
}: {
  actor?: unknown
  request: { applicationId: string; legalName?: string; [key: string]: unknown }
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState(false)

  const handleDownload = async () => {
    if (!request.applicationId) {
      setMessage("Application ID is missing.")
      setError(true)
      return
    }

    setBusy(true)
    setMessage("")
    setError(false)

    try {
      const res = await applicationService.downloadSummary(request.applicationId, request.legalName)
      if (!res.success) {
        setMessage(res.message || "Failed to download PDF.")
        setError(true)
      } else {
        setMessage("PDF downloaded successfully.")
      }
    } catch (err: any) {
      setMessage(err.message || "Download failed.")
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
      <Button kind="secondary" disabled={busy} onClick={handleDownload}>
        {busy ? "Generating PDF…" : label}
      </Button>
      {message && (
        <small
          role={error ? "alert" : "status"}
          className={error ? "inline-error" : "workspace-help"}
          style={{ fontSize: "0.78rem" }}
        >
          {message}
        </small>
      )}
    </div>
  )
}
