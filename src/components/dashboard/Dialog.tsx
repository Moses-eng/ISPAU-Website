import { useEffect, useRef, useId, type ReactNode } from "react"
import Button from "@/components/ui/Button"
export default function Dialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
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
      className="workspace-dialog"
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
      <div className="flex items-center justify-between gap-4">
        <h2 id={titleId}>{title}</h2>
        <Button kind="ghost" onClick={onClose} aria-label="Close dialog">
          ✕
        </Button>
      </div>
      {children}
    </dialog>
  )
}
