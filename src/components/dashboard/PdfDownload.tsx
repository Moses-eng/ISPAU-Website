import { useState } from "react"
import type { Actor } from "@/features/membership/types/workspace"
import {
  downloadDocument,
  type DocumentRequest,
} from "@/services/documentService"
import Button from "@/components/ui/Button"
export default function PdfDownload({
  actor,
  request,
  label = "Download PDF",
}: {
  actor: Actor
  request: DocumentRequest
  label?: string
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false)
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        kind="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setMessage("")
          setError(false)
          try {
            await downloadDocument(actor, request)
            setMessage("Download started. Activity recorded.")
          } catch (error) {
            setMessage((error as Error).message)
            setError(true)
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? "Preparing document…" : label}
      </Button>
      {message && (
        <small
          role={error ? "alert" : "status"}
          className={error ? "inline-error" : "workspace-help"}
        >
          {message}
        </small>
      )}
    </div>
  )
}
