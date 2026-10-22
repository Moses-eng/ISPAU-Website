import About from "@/features/public/pages/About"
import Accounts from "@/features/administration/pages/Accounts"
import Activation from "@/features/administration/pages/Activation"
import Admin from "@/features/administration/pages/Admin"
import ApplicantInvoices from "@/features/billing/pages/ApplicantInvoices"
import ApplicantStateWorkspace from "@/features/membership/pages/ApplicantStateWorkspace"
import Clarification from "@/features/membership/pages/Clarification"
import CompanyProfile from "@/features/directory/pages/CompanyProfile"
import Contact from "@/features/public/pages/Contact"
import Decision from "@/features/administration/pages/Decision"
import Directory from "@/features/directory/pages/Directory"
import DirectoryAdministration from "@/features/administration/pages/DirectoryAdministration"
import Dispute from "@/features/trade-credit/pages/Dispute"
import { ENABLE_TRADE_CREDIT } from "@/features/trade-credit/feature"
import EmailTemplates from "@/features/administration/pages/EmailTemplates"
import EmailVerification from "@/features/auth/pages/EmailVerification"
import Home from "@/features/public/pages/Home"
import InvoiceDetail from "@/features/billing/pages/InvoiceDetail"
import Login from "@/features/auth/pages/Login"
import Member from "@/features/member/pages/Member"
import MemberInvoices from "@/features/billing/pages/MemberInvoices"
import MemberRegister from "@/features/administration/pages/MemberRegister"
import Membership from "@/features/public/pages/Membership"
import MembershipApplication from "@/features/membership/pages/MembershipApplication"
import Mfa from "@/features/auth/pages/Mfa"
import OrganisationDetails from "@/features/member/pages/OrganisationDetails"
import PasswordRecovery from "@/features/auth/pages/PasswordRecovery"
import PaymentInstructions from "@/features/billing/pages/PaymentInstructions"
import Privacy from "@/features/public/pages/Privacy"
import Profile from "@/features/member/pages/Profile"
import type { ReactNode } from "react"
import RecordRequest from "@/features/trade-credit/pages/RecordRequest"
import Reference from "@/features/trade-credit/pages/Reference"
import ReferenceResult from "@/features/trade-credit/pages/ReferenceResult"
import Renewal from "@/features/billing/pages/Renewal"
import ResetPassword from "@/features/auth/pages/ResetPassword"
import Reviewer from "@/features/trade-credit/pages/Reviewer"
import SecretariatVerification from "@/features/trade-credit/pages/SecretariatVerification"
import Services from "@/features/public/pages/Services"
import type { SessionRole } from "@/types/SessionRole"
import SessionState from "@/features/auth/pages/SessionState"
import Staff from "@/features/administration/pages/Staff"
import StaffLogin from "@/features/auth/pages/StaffLogin"
import Submitted from "@/features/membership/pages/Submitted"
import SystemPage from "@/features/administration/pages/SystemPage"
import { TRADE_CREDIT_ROUTES } from "@/features/trade-credit/feature"
import TcCase from "@/features/trade-credit/pages/TcCase"
import TcSubmit from "@/features/trade-credit/pages/TcSubmit"
import TradeDashboard from "@/features/trade-credit/pages/TradeDashboard"
import TradePublic from "@/features/trade-credit/pages/TradePublic"
import VerificationExpired from "@/features/auth/pages/VerificationExpired"
import type { View } from "@/types/View"
import Welcome from "@/features/member/pages/Welcome"
import { sampleMembers } from "@/features/directory/data/sampleMembers"
import { useEffect } from "react"
import { useState } from "react"

export default function App() {
  const initial = (location.hash.replace("#", "") || "home") as View
  const [view, setView] = useState<View>(initial)
  const [selectedMember, setSelectedMember] = useState(sampleMembers[0])
  const [pending, setPending] = useState<View | null>(null)
  const [session, setSession] = useState<SessionRole | null>(() => {
    const stored = sessionStorage.getItem("ispau-demo-role")
    return stored as SessionRole | null
  })
  const requirements: Partial<Record<View, SessionRole[]>> = {
    apply: ["applicant"],
    applicant: ["applicant"],
    "applicant-invoices": ["applicant"],
    "invoice-detail": ["applicant"],
    "payment-instructions": ["applicant"],
    clarification: ["applicant"],
    staff: ["membership"],
    "staff-review": ["membership"],
    activation: ["membership"],
    decision: ["decision"],
    accounts: ["accounts"],
    member: ["member", "isp"],
    "org-details": ["member", "isp"],
    "member-invoices": ["member", "isp"],
    renewal: ["member", "isp"],
    welcome: ["member", "isp", "membership"],
    profile: ["member", "isp"],
    "member-register": ["membership", "secretariat"],
    "directory-admin": ["secretariat"],
    "email-templates": ["secretariat"],
    "tc-dashboard": ["member", "isp"],
    "tc-submit": ["member", "isp"],
    "tc-case": ["member", "isp", "secretariat"],
    "tc-verify": ["secretariat"],
    reference: ["member", "isp"],
    "reference-result": ["member", "isp"],
    reviewer: ["reviewer"],
    admin: ["secretariat"],
    system: ["secretariat"],
  }
  const staffRoles: SessionRole[] = [
    "membership",
    "decision",
    "accounts",
    "reviewer",
    "secretariat",
  ]
  const show = (v: View) => {
    setView(v)
    location.hash = v
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const go = (v: View) => {
    if (!ENABLE_TRADE_CREDIT && TRADE_CREDIT_ROUTES.has(v)) {
      show("home")
      return
    }
    if (v === "login") {
      setPending("member")
      show("login")
      return
    }
    if (v === "apply" && !session) {
      setPending("apply")
      show("email-verify")
      return
    }
    if (v === "staff-login") {
      setPending("staff")
      show("staff-login")
      return
    }
    const allowed = requirements[v]
    if (allowed && !session) {
      setPending(v)
      show(
        allowed.every((role) => staffRoles.includes(role))
          ? "staff-login"
          : "login",
      )
      return
    }
    if (allowed && session && !allowed.includes(session)) {
      show("denied")
      return
    }
    show(v)
  }
  const completeMemberSignIn = () => {
    const target = pending || "member"
    const role: SessionRole = requirements[target]?.includes("applicant")
      ? "applicant"
      : "member"
    sessionStorage.setItem("ispau-demo-role", role)
    setSession(role)
    show(target)
  }
  const completeStaffMfa = () => {
    const target = pending && requirements[pending] ? pending : "staff"
    const role = (requirements[target]?.find((item) =>
      staffRoles.includes(item),
    ) || "membership") as SessionRole
    sessionStorage.setItem("ispau-demo-role", role)
    setSession(role)
    show(target)
  }
  useEffect(() => {
    const fn = () => {
      const next = (location.hash.replace("#", "") || "home") as View
      if (!ENABLE_TRADE_CREDIT && TRADE_CREDIT_ROUTES.has(next)) {
        setView("home")
        if (location.hash !== "#home") history.replaceState(null, "", "#home")
        return
      }
      if (next === "apply" && !session) {
        setPending("apply")
        setView("email-verify")
        return
      }
      const allowed = requirements[next]
      if (allowed && !session) {
        setPending(next)
        setView(
          allowed.every((role) => staffRoles.includes(role))
            ? "staff-login"
            : "login",
        )
      } else if (allowed && session && !allowed.includes(session)) {
        setView("denied")
      } else {
        setView(next)
      }
    }
    const signOut = () => {
      sessionStorage.removeItem("ispau-demo-role")
      setSession(null)
      setPending(null)
      show("signed-out")
    }
    addEventListener("hashchange", fn)
    addEventListener("demo-signout", signOut)
    fn()
    return () => {
      removeEventListener("hashchange", fn)
      removeEventListener("demo-signout", signOut)
    }
  }, [session])
  const pages: Record<View, ReactNode> = {
    home: <Home go={go} />,
    about: <About go={go} />,
    membership: <Membership go={go} />,
    services: <Services go={go} />,
    trade: <TradePublic go={go} />,
    contact: <Contact go={go} />,
    directory: (
      <Directory
        go={go}
        onViewProfile={(id) => {
          setSelectedMember(
            sampleMembers.find((member) => member.id === id) ||
              sampleMembers[0],
          )
          show("company-profile")
        }}
      />
    ),
    "company-profile": <CompanyProfile go={go} member={selectedMember} />,
    privacy: <Privacy go={go} />,
    "email-verify": (
      <EmailVerification
        go={go}
        onVerified={() => {
          sessionStorage.setItem("ispau-demo-role", "applicant")
          setSession("applicant")
          show("apply")
        }}
      />
    ),
    "verification-expired": <VerificationExpired go={go} />,
    "forgot-password": <PasswordRecovery go={go} />,
    "reset-password": <ResetPassword go={go} />,
    apply: <MembershipApplication go={go} />,
    submitted: <Submitted go={go} />,
    applicant: <ApplicantStateWorkspace go={go} />,
    "applicant-invoices": <ApplicantInvoices go={go} />,
    "invoice-detail": <InvoiceDetail go={go} />,
    "payment-instructions": <PaymentInstructions go={go} />,
    clarification: <Clarification go={go} />,
    staff: <Staff go={go} />,
    "staff-review": <Decision go={go} mode="review" />,
    activation: <Activation go={go} />,
    decision: <Decision go={go} />,
    accounts: <Accounts go={go} />,
    member: <Member go={go} />,
    "org-details": <OrganisationDetails go={go} />,
    "member-invoices": <MemberInvoices go={go} />,
    renewal: <Renewal go={go} />,
    welcome: <Welcome go={go} />,
    profile: <Profile go={go} />,
    "member-register": (
      <MemberRegister
        go={go}
        role={
          session === "secretariat"
            ? "Secretariat / Administrator"
            : "Membership coordinator"
        }
      />
    ),
    "directory-admin": <DirectoryAdministration go={go} />,
    "email-templates": <EmailTemplates go={go} />,
    "tc-dashboard": <TradeDashboard go={go} />,
    "tc-submit": <TcSubmit go={go} />,
    "tc-case": <TcCase go={go} />,
    "tc-verify": <SecretariatVerification go={go} />,
    reference: <Reference go={go} />,
    "reference-result": <ReferenceResult go={go} />,
    dispute: <Dispute go={go} />,
    "record-request": <RecordRequest go={go} />,
    reviewer: <Reviewer go={go} />,
    admin: <Admin go={go} />,
    system: <SystemPage go={go} />,
    login: <Login go={go} onSignIn={completeMemberSignIn} />,
    "staff-login": <StaffLogin go={go} onContinue={() => show("mfa")} />,
    mfa: <Mfa onVerify={completeStaffMfa} />,
    "signed-out": <SessionState kind="signed-out" go={go} />,
    expired: <SessionState kind="expired" go={go} />,
    denied: <SessionState kind="denied" go={go} />,
  }
  return <>{pages[view] || pages.home}</>
}
