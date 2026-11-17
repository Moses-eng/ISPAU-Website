import type { Activity } from "@/features/membership/types/workspace"
export default function Timeline({ items }: { items: Activity[] }) {
  return (
    <ol className="workspace-timeline">
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.text}</strong>
          <small>
            {item.actor} · {new Date(item.date).toLocaleString("en-GB")}
          </small>
        </li>
      ))}
    </ol>
  )
}
