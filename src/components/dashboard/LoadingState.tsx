export default function LoadingState() {
  return (
    <div className="workspace-panel" role="status" aria-busy="true">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand/20 border-t-brand motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p>Loading membership workspace…</p>
    </div>
  )
}
