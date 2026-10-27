import { useEffect, useState, type ReactNode } from "react"
import Logo from "@/components/layout/Logo"
import MenuToggle from "@/components/ui/MenuToggle"
import Icon from "@/components/ui/Icon"
import Button from "@/components/ui/Button"
import useMediaQuery from "@/hooks/useMediaQuery"
import type { Actor } from "@/features/membership/types/workspace"
export default function WorkspaceShell({
  actor,
  navigation,
  current,
  onNavigate,
  onIdentity,
  children,
}: {
  actor: Actor
  navigation: { id: string; label: string; icon: string }[]
  current: string
  onNavigate: (id: string) => void
  onIdentity: () => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const compact = useMediaQuery("(max-width: 1000px)")
  useEffect(() => setOpen(false), [compact, current])
  useEffect(() => {
    const fn = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [])
  return (
    <div className="workspace">
      <a
        className="workspace-skip"
        href="#workspace-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById("workspace-content")?.focus()
        }}
      >
        Skip to workspace content
      </a>
      {open && compact && (
        <button
          className="workspace-backdrop"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`workspace-sidebar ${open ? "is-open" : ""}`}
        inert={compact && !open}
      >
        <Logo
          light
          onClick={() => {
            location.href = "/"
          }}
        />
        <div className="workspace-sidebar-title">
          {actor.kind === "staff" ? "ISPAU administration" : actor.name}
        </div>
        <nav id="workspace-navigation" aria-label="Workspace navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              aria-current={current === item.id ? "page" : undefined}
              onClick={() => {
                onNavigate(item.id)
                setOpen(false)
              }}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <span>Membership services</span>
          <button
            onClick={() => {
              location.href = "/"
            }}
          >
            ← Public website
          </button>
          {compact && (
            <Button kind="secondary" onClick={() => setOpen(false)}>
              Close navigation
            </Button>
          )}
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-menu">
            <MenuToggle
              open={open}
              onClick={() => setOpen(!open)}
              controls="workspace-navigation"
            />
          </div>
          <span>
            {navigation.find((n) => n.id === current)?.label ||
              "Application detail"}
          </span>
          <button className="workspace-account" onClick={onIdentity}>
            <span className="workspace-avatar">
              {actor.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              {actor.name}
              <small>
                {actor.kind === "staff"
                  ? "Administrator"
                  : "ISP Account Manager"}
              </small>
            </span>
            <Icon name="chevron" size={14} />
          </button>
        </header>
        <main
          id="workspace-content"
          tabIndex={-1}
          className="workspace-content"
        >
          {children}
        </main>
        <footer className="workspace-footer">ISPAU membership services</footer>
      </div>
    </div>
  )
}
