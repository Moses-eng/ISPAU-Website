import ProfileSeo from "@/features/directory/services/ProfileMetadata"
import { profileId } from "@/features/directory/services/profileSeo"
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
import { TRADE_CREDIT_ROUTES } from "@/features/trade-credit/feature"
import type { View } from "@/types/View"
import { navigateTo, portalAliases, staffAliases } from "./navigation"
import Notifications from "@/components/dashboard/Notifications"

export default function App() {
  const [url, setUrl] = useState(location.pathname + location.hash)

  useEffect(() => {
    const update = () => setUrl(location.pathname + location.hash)
    addEventListener("hashchange", update)
    addEventListener("popstate", update)
    return () => {
      removeEventListener("hashchange", update)
      removeEventListener("popstate", update)
    }
  }, [])

  const [pathname, hash = ""] = url.split("#")
  const [route, query] = hash.replace(/^\/?/, "").split("?")

  // Extract member ID from path (e.g., /members/01a1de50-.../mogasoft or /members/01a1de50-...)
  const pathMatch = pathname.match(/^\/members\/([0-9a-fA-F-]+)/)
  const memberId =
    pathMatch?.[1] ||
    profileId(pathname) ||
    new URLSearchParams(query).get("member") ||
    ""

  const directoryPath = /^\/members\/?$/.test(pathname)
  const isCompanyProfile = !directoryPath && pathname.startsWith("/members/")

  const view = (
    directoryPath
      ? "directory"
      : isCompanyProfile
      ? "company-profile"
      : route || "home"
  ) as View

  const go = (next: View) => {
    if (next === "directory") return navigateTo("/members/")
    if (staffAliases[next]) return navigateTo(`/staff#/${staffAliases[next]}`)
    if (portalAliases[next])
      return navigateTo(`/portal#/${portalAliases[next]}`)
    if (
      TRADE_CREDIT_ROUTES.has(next) &&
      !["record-request", "dispute"].includes(next)
    )
      return navigateTo("/#home")
    navigateTo(`/#${next}`)
  }

  const pages: Partial<Record<View, ReactNode>> = {
    "record-request": <CustomerRequests go={go} />,
    dispute: <CustomerRequests go={go} dispute />,
    home: <Home go={go} />,
    about: <About go={go} />,
    membership: <Membership go={go} />,
    services: <Services go={go} />,
    contact: <Contact go={go} />,
    privacy: <Privacy go={go} />,
    directory: <Directory go={go} />,
    "company-profile": (
      <CompanyProfile go={go} memberId={memberId} />
    ),
    login: <Login go={go} staffAccessEnabled={Boolean(StaffLogin)} />,
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
    notifications: <Notifications go={go} />,
  }

  return (
    <>
      <ProfileSeo
        directory={view === "directory"}
        unavailable={view === "company-profile" && !memberId}
      />
      {pages[view] || pages.home}
    </>
  )
}
