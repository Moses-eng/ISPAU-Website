import type { Ref } from "react"

export default function MenuToggle({
  open,
  onClick,
  controls,
  buttonRef,
}: {
  open: boolean
  onClick: () => void
  controls: string
  buttonRef?: Ref<HTMLButtonElement>
}) {
  const line =
    "absolute left-2.5 h-0.5 w-5 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none"
  return (
    <button
      ref={buttonRef}
      type="button"
      className="public-menu-toggle relative h-11 w-11 shrink-0 rounded-lg border border-brand/20 bg-white text-brand transition-colors hover:bg-brand-tint"
      aria-label={open ? "Close navigation" : "Open navigation"}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className={`${line} ${open ? "top-5 rotate-45" : "top-3 rotate-0"}`}
      />
      <span
        aria-hidden="true"
        className={`${line} top-5 ${
          open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
        }`}
      />
      <span
        aria-hidden="true"
        className={`${line} ${open ? "top-5 -rotate-45" : "top-7 rotate-0"}`}
      />
    </button>
  )
}
