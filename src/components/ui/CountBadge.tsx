export default function CountBadge({
  count,
  label = "outstanding actions",
}: {
  count: number
  label?: string
}) {
  if (!Number.isFinite(count) || count <= 0) return null
  return (
    <span className="count-badge" aria-label={`${Math.floor(count)} ${label}`}>
      {Math.floor(count)}
    </span>
  )
}
