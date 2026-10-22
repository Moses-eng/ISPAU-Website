import useMediaQuery from "@/hooks/useMediaQuery"
import MenuToggle from "@/components/ui/MenuToggle"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import type { ReactNode } from "react"
import type { View } from "@/types/View"
import { portalNavigation } from "@/config/portalNavigation"
import { useEffect, useState } from "react"

export default function Portal({
  children,
  go,
  active,
  role = "Member user",
}: {
  children: ReactNode
  go: (v: View) => void
  active: string
  role?: string
}) {
  const [mobile, setMobile] = useState(false)
  const compact = useMediaQuery("(max-width: 1000px)")
  useEffect(() => {
    setMobile(false)
  }, [compact])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobile(false)
    }
    document.addEventListener("keydown", escape)
    return () => document.removeEventListener("keydown", escape)
  }, [])
  const staffSession = [
    "Membership coordinator",
    "Decision maker",
    "Accounts staff",
    "Independent reviewer",
    "Secretariat / Administrator",
  ].includes(role)
  return (
    <div className="portal">
      {mobile && compact && (
        <button
          className="portal-backdrop"
          aria-label="Close navigation overlay"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={mobile ? "portal-side open" : "portal-side"}
        inert={compact && !mobile}
      >
        <div className="portal-drawer-close">
          <MenuToggle
            open={mobile}
            onClick={() => setMobile(false)}
            controls="portal-navigation"
          />
        </div>
        <Logo light />
        <nav id="portal-navigation">
          {(portalNavigation[role] || portalNavigation["Member user"]).map(
            ([label, view]) => (
              <button
                key={label}
                className={active === label ? "active" : ""}
                onClick={() => {
                  go(view)
                  setMobile(false)
                }}
              >
                <Icon
                  name={
                    label === "Trade Credit"
                      ? "chart"
                      : label === "Billing"
                        ? "file"
                        : label === "Administration"
                          ? "shield"
                          : "building"
                  }
                />
                {label}
              </button>
            ),
          )}
        </nav>
        <button className="back-website" onClick={() => go("home")}>
          ← Public website
        </button>
      </aside>
      <div className="portal-content">
        <header className="portal-top">
          <div className="portal-menu">
            <MenuToggle
              open={mobile}
              onClick={() => setMobile(!mobile)}
              controls="portal-navigation"
            />
          </div>
          <div className="session-role">
            <span>{role}</span>
            <small>
              <Icon name="shield" size={13} />{" "}
              {staffSession ? "MFA session" : "Authenticated session"}
            </small>
          </div>
          <div className="avatar">AN</div>
          <button
            className="sign-out"
            onClick={() => window.dispatchEvent(new Event("demo-signout"))}
          >
            Sign out
          </button>
        </header>
        <main className="portal-main">{children}</main>
      </div>
    </div>
  )
}
