import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import MenuToggle from "@/components/ui/MenuToggle"
import Logo from "@/components/layout/Logo"
import NavigationDropdown from "@/components/layout/NavigationDropdown"
import {
  accountNavigation,
  membershipNavigation,
  publicNavigation,
} from "@/config/navigation"
import useMediaQuery from "@/hooks/useMediaQuery"
import type { View } from "@/types/View"

export default function Header({ go }: { go: (view: View) => void }) {
  const [open, setOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<"membership" | "account" | null>(
    null,
  )
  const compact = useMediaQuery("(max-width: 1100px)")
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const currentView = /^\/blog(?:\/|$)/.test(location.pathname)
    ? "blog"
    : location.hash.replace(/^#\/?/, "").split("?")[0] || "home"

  useEffect(() => {
    setOpen(false)
    setActiveMenu(null)
  }, [compact])

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setActiveMenu(null)
      }
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      const dropdownTrigger = (document.activeElement as HTMLElement | null)
        ?.closest(".account-menu")
        ?.querySelector<HTMLButtonElement>("button")
      setOpen(false)
      setActiveMenu(null)
      if (window.matchMedia("(max-width: 1100px)").matches)
        toggleRef.current?.focus()
      else dropdownTrigger?.focus()
    }
    document.addEventListener("pointerdown", dismiss)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", dismiss)
      document.removeEventListener("keydown", escape)
    }
  }, [])

  const navigate = (view: View) => {
    go(view)
    setOpen(false)
    setActiveMenu(null)
  }

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-inner">
        <Logo onClick={() => navigate("home")} />
        <nav
          id="public-navigation"
          className={open ? "open" : ""}
          aria-label="Main navigation"
          inert={compact && !open}
        >
          {publicNavigation.map(({ label, view }) =>
            view === "membership" ? (
              <NavigationDropdown
                key={view}
                id="membership-menu"
                label={label}
                items={membershipNavigation}
                open={activeMenu === "membership"}
                active={["membership", "directory", "company-profile"].includes(
                  currentView,
                )}
                onToggle={() =>
                  setActiveMenu(
                    activeMenu === "membership" ? null : "membership",
                  )
                }
                onNavigate={navigate}
              />
            ) : (
              <button
                key={view}
                type="button"
                className={currentView === view ? "active" : ""}
                aria-current={currentView === view ? "page" : undefined}
                onClick={() => navigate(view)}
              >
                {label}
              </button>
            ),
          )}
        </nav>
        <div className="header-controls">
          <Button className="header-apply" onClick={() => navigate("apply")}>
            {compact ? "Apply" : "Apply for Membership"}
          </Button>
          <MenuToggle
            open={open}
            onClick={() => {
              setOpen(!open)
              setActiveMenu(null)
            }}
            controls="public-navigation"
            buttonRef={toggleRef}
          />
          <NavigationDropdown
            id="account-menu"
            label="Login"
            icon="account"
            items={accountNavigation}
            open={activeMenu === "account"}
            onToggle={() => {
              setOpen(false)
              setActiveMenu(activeMenu === "account" ? null : "account")
            }}
            onNavigate={navigate}
          />
        </div>
      </div>
    </header>
  )
}
