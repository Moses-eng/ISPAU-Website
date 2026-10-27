import { staffAccess as StaffLogin } from "./workspaceModules"
import CustomerRequests from "@/features/trade-credit/workspace/CustomerRequests"
import { useEffect, useState, type ReactNode } from "react"
import Home from "@/features/public/pages/Home"
import About from "@/features/public/pages/About"
import Membership from "@/features/public/pages/Membership"
import Services from "@/features/public/pages/Services"
import Contact from "@/features/public/pages/Contact"
import Privacy from "@/features/public/pages/Privacy"
import Directory from "@/features/directory/pages/Directory"
import CompanyProfile from "@/features/directory/pages/CompanyProfile"
import Login from "@/features/auth/pages/Login"
import EmailVerification from "@/features/auth/pages/EmailVerification"
import VerificationExpired from "@/features/auth/pages/VerificationExpired"
import PasswordRecovery from "@/features/auth/pages/PasswordRecovery"
import ResetPassword from "@/features/auth/pages/ResetPassword"
import SessionState from "@/features/auth/pages/SessionState"
import PublicShell from "@/components/layout/PublicShell"
import EmptyState from "@/components/dashboard/EmptyState"
import usePublicDirectory from "@/hooks/usePublicDirectory"
import { TRADE_CREDIT_ROUTES } from "@/features/trade-credit/feature"
import type { View } from "@/types/View"
import { navigateTo, portalAliases, staffAliases } from "./navigation"

export default function App() {
  const [hash, setHash] = useState(location.hash)
  const members = usePublicDirectory()
  useEffect(() => {
    const update = () => setHash(location.hash)
    addEventListener("hashchange", update)
    return () => removeEventListener("hashchange", update)
  }, [])
  const [route, query] = hash.replace(/^#\/?/, "").split("?")
  const view = (route || "home") as View
  const go = (next: View) => {
    if (staffAliases[next]) return navigateTo(`/staff#/${staffAliases[next]}`)
    if (portalAliases[next])
      return navigateTo(`/portal#/${portalAliases[next]}`)
    if (
      TRADE_CREDIT_ROUTES.has(next) &&
      !["record-request", "dispute"].includes(next)
    )
      return navigateTo("/#home")
    navigateTo(`/#${next}`)
    setHash(`#${next}`)
  }
  const selected = members.find(
    (member) => member.id === new URLSearchParams(query).get("member"),
  )
  const pages: Partial<Record<View, ReactNode>> = {
    "record-request": <CustomerRequests go={go} />,
    dispute: <CustomerRequests go={go} dispute />,
    home: <Home go={go} />,
    about: <About go={go} />,
    membership: <Membership go={go} />,
    services: <Services go={go} />,
    contact: <Contact go={go} />,
    privacy: <Privacy go={go} />,
    directory: (
      <Directory
        go={go}
        onViewProfile={(id) => {
          const next = `#company-profile?member=${encodeURIComponent(id)}`
          location.hash = next
          setHash(next)
          window.scrollTo(0, 0)
        }}
      />
    ),
    "company-profile": selected ? (
      <CompanyProfile go={go} member={selected} />
    ) : (
      <PublicShell go={go}>
        <EmptyState
          title="Profile unavailable"
          text="The profile is not currently approved, eligible, active and publication-consented."
        />
      </PublicShell>
    ),
    login: (
      <Login
        go={go}
        onSignIn={() => navigateTo("/portal")}
        staffAccessEnabled={Boolean(StaffLogin)}
      />
    ),
    "staff-login": StaffLogin ? (
      <StaffLogin go={go} onContinue={() => navigateTo("/staff")} />
    ) : (
      <PublicShell go={go}>
        <EmptyState
          title="Workspace unavailable"
          text="Use the member portal to access your organisation’s services."
        />
      </PublicShell>
    ),
    "email-verify": (
      <EmailVerification
        go={go}
        onVerified={() => navigateTo("/portal#/application")}
      />
    ),
    "verification-expired": <VerificationExpired go={go} />,
    "forgot-password": <PasswordRecovery go={go} />,
    "reset-password": <ResetPassword go={go} />,
    "signed-out": <SessionState kind="signed-out" go={go} />,
    expired: <SessionState kind="expired" go={go} />,
    denied: <SessionState kind="denied" go={go} />,
  }
  return <>{pages[view] || pages.home}</>
}
