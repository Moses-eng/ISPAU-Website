import Icon from "@/components/ui/Icon"
import type { View } from "@/types/View"

export type NavigationItem = {
  label: string
  view: View
  description: string
  icon: string
}

type NavigationDropdownProps = {
  id: string
  label: string
  items: NavigationItem[]
  open: boolean
  onToggle: () => void
  onNavigate: (view: View) => void
  active?: boolean
  icon?: string
}

export default function NavigationDropdown({
  id,
  label,
  items,
  open,
  onToggle,
  onNavigate,
  active = false,
  icon,
}: NavigationDropdownProps) {
  const navigationStyle = `inline-flex min-h-11 items-center gap-[7px] border-0 bg-transparent px-2.5 py-0 text-sm font-normal no-underline hover:text-brand hover:no-underline ${active ? "text-brand shadow-[inset_0_-2px_0_var(--burgundy-primary)]" : "text-muted"}`

  return (
    <span className="account-menu">
      <button
        type="button"
        className={icon ? "member-login-link" : navigationStyle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={id}
        onClick={onToggle}
      >
        {icon && <Icon name={icon} size={18} />}
        {label}
        <Icon name="chevron" size={15} />
      </button>
      {open && (
        <span
          className="account-dropdown"
          role="menu"
          id={id}
          aria-label={label}
        >
          {items.map((item) => (
            <button
              key={item.view}
              type="button"
              role="menuitem"
              onClick={() => onNavigate(item.view)}
            >
              <Icon name={item.icon} size={18} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          ))}
        </span>
      )}
    </span>
  )
}
