import { useEffect, useRef, useId, type ReactNode } from "react"
import Button from "@/components/ui/Button"
export default function Dialog({
  title,
  children,
  onClose,
  programmeHeader,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  programmeHeader?: { image: string; description: string }
}) {
  const titleId = useId()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const dialog = ref.current!
    dialog.showModal()
    return () => {
      dialog.close()
      before?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`workspace-dialog${programmeHeader ? " programme-dialog" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose()
        }
      }}
    >
      <div
        className={
          programmeHeader
            ? "programme-dialog-header"
            : "flex items-center justify-between gap-4"
        }
      >
        {programmeHeader && <img src={programmeHeader.image} alt="" />}
        <h2 id={titleId}>{title}</h2>
        {programmeHeader && <p>{programmeHeader.description}</p>}
        <Button kind="ghost" onClick={onClose} aria-label="Close dialog">
          ✕
        </Button>
      </div>
      {children}
    </dialog>
  )
}
