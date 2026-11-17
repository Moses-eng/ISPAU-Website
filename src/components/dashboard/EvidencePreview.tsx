import { useEffect, useState } from "react"
import type { FileRecord } from "@/features/membership/types/workspace"
import { getLocalFile } from "@/features/membership/services/files"
import Dialog from "./Dialog"
import Button from "@/components/ui/Button"
export default function EvidencePreview({
  file,
  inline = false,
}: {
  file: FileRecord
  inline?: boolean
}) {
  const [open, setOpen] = useState(false),
    [url, setUrl] = useState("")
  useEffect(() => {
    const local = getLocalFile(file.id)
    if (!open || !local) return
    const next = URL.createObjectURL(local)
    setUrl(next)
    return () => {
      URL.revokeObjectURL(next)
      setUrl("")
    }
  }, [open, file.id])
  const content = (
    <>
      <p>
        {file.category} · {Math.ceil(file.size / 1024)} KB
      </p>
      {url ? (
        <>
          {file.type === "application/pdf" ? (
            <iframe
              className="workspace-evidence"
              src={url}
              title={file.name}
              sandbox="allow-scripts"
            />
          ) : (
            <img className="workspace-evidence" src={url} alt={file.name} />
          )}
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open original in a separate tab
          </a>
        </>
      ) : (
        <div className="workspace-note">
          <strong>Document preview unavailable</strong>
          <p>
            Select the file again to make it available for preview in this
            session.
          </p>
        </div>
      )}
      <p className="workspace-help">
        Supporting documents are reviewed by ISPAU before eligibility is
        confirmed.
      </p>
    </>
  )
  return (
    <>
      <Button
        kind="ghost"
        aria-expanded={inline ? open : undefined}
        onClick={() => setOpen(!open)}
      >
        {file.name}
      </Button>
      {open &&
        (inline ? (
          <div className="workspace-evidence-inline">
            {content}
            <Button kind="ghost" onClick={() => setOpen(false)}>
              Close evidence preview
            </Button>
          </div>
        ) : (
          <Dialog
            title="Private evidence preview"
            onClose={() => setOpen(false)}
          >
            {content}
          </Dialog>
        ))}
    </>
  )
}
