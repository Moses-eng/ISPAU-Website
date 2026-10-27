import Button from "@/components/ui/Button"
export default function SectionNavigation({
  label,
  items,
  current,
  onSelect,
}: {
  label: string
  items: { id: string; label: string }[]
  current: string
  onSelect: (id: string) => void
}) {
  return (
    <nav aria-label={label} className="credit-tabs">
      {items.map((item) => (
        <Button
          key={item.id}
          kind={current === item.id ? "primary" : "secondary"}
          aria-current={current === item.id ? "page" : undefined}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  )
}
