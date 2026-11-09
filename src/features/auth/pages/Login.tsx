import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import Logo from "@/components/layout/Logo"
import type { View } from "@/types/View"
import type { Actor } from "@/features/membership/types/workspace"
import useMembershipWorkspace from "@/hooks/useMembershipWorkspace"
import { demoSession } from "@/services/demoSession"
import { navigateTo } from "@/app/navigation"
import { authPreview } from "@/config/authPreview"
import OtpInput from "@/features/auth/components/OtpInput"

export default function Login({
  go,
  onSignIn,
  staffAccessEnabled = false,
}: {
  go: (v: View) => void
  onSignIn?: (actor: Actor) => void
  staffAccessEnabled?: boolean
}) {
  const { state } = useMembershipWorkspace()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const verificationTimer = useRef<number | undefined>(undefined)
  const verificationPending = useRef(false)
  const [error, setError] = useState("")
  const [expiresAt, setExpiresAt] = useState(0)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [resent, setResent] = useState(false)
  useEffect(() => () => window.clearTimeout(verificationTimer.current), [])
  useEffect(() => {
    if (!sent) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [sent])
  const sendCode = () => {
    if (!authPreview.enabled) {
      setError("Email sign-in is not connected yet. Please try again later.")
      return
    }
    const time = Date.now()
    setExpiresAt(time + 600000)
    setResendAt(time + 30000)
    setNow(time)
    setError("")
    setSent(true)
  }
  const verify = (code: string) => {
    if (Date.now() >= expiresAt)
      return setError("This code has expired. Request a new code below.")
    if (!authPreview.enabled || code !== authPreview.code)
      return setError(
        "That code isn’t correct. Check the six digits and try again.",
      )
    const matchedApplication = state.applications.find(
      (a) =>
        String(a.values.businessEmail || "")
          .trim()
          .toLowerCase() === email.trim().toLowerCase(),
    )
    // Unrecognised emails can explore the sample applicant in the UI preview.
    // They are never attached to or saved against that sample organisation.
    const application =
      matchedApplication ||
      (authPreview.enabled
        ? state.applications.find((a) => a.stage === "Draft")
        : undefined)
    if (!application)
      return setError(
        "No saved application or membership matches this email in the preview. Use the official email saved in your application, or try an example below.",
      )
    const identity: Actor = {
      id: `portal-${application.organisationId}`,
      name: application.organisation,
      kind: "organisation",
      roles: [],
      organisationId: application.organisationId,
    }
    if (onSignIn) onSignIn(identity)
    else {
      demoSession.signIn(identity)
      navigateTo(
        application.stage === "Draft"
          ? "/portal#/application"
          : "/portal#/overview",
      )
    }
  }
  const beginVerification = (code: string) => {
    if (verificationPending.current) return
    verificationPending.current = true
    setError("")
    setVerifying(true)
    verificationTimer.current = window.setTimeout(() => {
      verify(code)
      verificationPending.current = false
      setVerifying(false)
    }, 450)
  }
  return (
    <div className="auth-page auth-login">
      <div className="auth-brand">
        <Logo light />
        <span>Member and applicant access</span>
        <h1>Pick up where you left off.</h1>
        <p>
          One email sign-in for your application and your ISPAU membership. Your
          saved application opens right where you stopped.
        </p>
        <button onClick={() => go("home")}>← Return to public website</button>
      </div>
      <main className="auth-form">
        <span className="eyebrow">
          {sent ? "Step 2 of 2 · Verify email" : "Step 1 of 2 · Your email"}
        </span>
        <h2>{sent ? "Check your email" : "Welcome back"}</h2>
        <p>
          {sent ? (
            <>
              Enter the six-digit code for <strong>{email.trim()}</strong>.
            </>
          ) : (
            "Use the official organisation email provided in your application. No password needed."
          )}
        </p>
        <form
          className="otp-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (!sent) sendCode()
          }}
        >
          {!sent ? (
            <label className="field" htmlFor="sign-in-email">
              <span>Official organisation email</span>
              <input
                id="sign-in-email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                placeholder="you@organisation.co.ug"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          ) : (
            <>
              <button
                type="button"
                className="text-link otp-change"
                disabled={verifying}
                onClick={() => {
                  setSent(false)
                  setError("")
                  setResent(false)
                }}
              >
                Change email
              </button>
              <OtpInput
                key={expiresAt}
                onComplete={beginVerification}
                disabled={verifying}
                error={error}
              />
              <small id="code-help">Code expires in 10 minutes.</small>
            </>
          )}
          {error && (
            <p id="code-error" className="inline-error" role="alert">
              {error}
            </p>
          )}
          {!sent && <Button type="submit">Send verification code</Button>}
          {verifying && (
            <p className="otp-verifying" role="status">
              Verifying your code…
            </p>
          )}
        </form>
        {sent && (
          <div className="otp-resend">
            <span>Didn’t receive a code? Check spam or junk.</span>
            <button
              className="text-link"
              disabled={verifying || now < resendAt}
              onClick={() => {
                sendCode()
                setResent(true)
              }}
            >
              {now < resendAt
                ? `Resend in ${Math.ceil((resendAt - now) / 1000)}s`
                : "Resend code"}
            </button>
            <span role="status">
              {resent ? "A new preview code is ready." : ""}
            </span>
          </div>
        )}
        {authPreview.enabled && (
          <div className="auth-preview-only">
            <div className="auth-note">
              <p>
                Applicants return to their saved application. Active members
                continue to their organisation dashboard.
              </p>
            </div>
            <details className="otp-preview">
              <summary>Try the UI preview</summary>
              <p>
                No email is sent in this prototype. Use code{" "}
                <strong>{authPreview.code}</strong>.
              </p>
              <div className="otp-examples">
                {["Draft", "Active"].map((stage) => {
                  const application = state.applications.find(
                    (a) => a.stage === stage,
                  )
                  return (
                    application && (
                      <button
                        key={stage}
                        disabled={verifying}
                        type="button"
                        className="text-link"
                        onClick={() => {
                          setEmail(String(application.values.businessEmail))
                          setSent(false)
                          setError("")
                          setResent(false)
                        }}
                      >
                        {stage === "Draft"
                          ? "Try a returning applicant"
                          : "Try an active ISP"}
                      </button>
                    )
                  )
                })}
              </div>
              <p>
                Drafts are stored in this browser. Other emails open the sample
                applicant; use the active ISP example to preview the member
                dashboard.
              </p>
            </details>
          </div>
        )}
        {staffAccessEnabled && (
          <button className="staff-entry" onClick={() => go("staff-login")}>
            ISPAU staff sign in
          </button>
        )}
      </main>
    </div>
  )
}
