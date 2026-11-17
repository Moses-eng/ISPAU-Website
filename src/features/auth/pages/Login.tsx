// src/features/auth/pages/Login.tsx

import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import Logo from "@/components/layout/Logo"
import type { View } from "@/types/View"
import type { Actor } from "@/features/membership/types/workspace"
import { navigateTo } from "@/app/navigation"
import OtpInput from "@/features/auth/components/OtpInput"
import webAplicatService from "@/apiServices/webAplicatService"
import authStore, { type StoredUser } from "@/apiServices/authStore"
import { session } from "@/apiServices/session"

interface LoginProps {
  go: (v: View) => void
  /**
   * Optional override invoked after a successful sign-in. When omitted,
   * the component navigates to the correct portal route itself.
   */
  onSignIn?: (actor: Actor) => void
  staffAccessEnabled?: boolean
}

interface VerifyResponsePayload {
  token: string
  application: {
    id: string
    status: string
    legal_name?: string
    applicant_name?: string
    business_email?: string
    applicant_phone?: string
    business_phone?: string
    [key: string]: unknown
  }
}

interface RequestResponsePayload {
  expires_in_minutes?: number
  resend_after?: number
}

/**
 * The only two modes the visitor can be in.
 *  - "active":    sign in to the portal dashboard.
 *  - "returning": resume a saved draft application.
 */
type EntryIntent = "active" | "returning"

const OTP_TTL_MINUTES = 10
const RESEND_COOLDOWN_SECONDS = 60
const DEFAULT_INTENT: EntryIntent = "active"

export default function Login({
  go,
  onSignIn,
  staffAccessEnabled = false,
}: LoginProps) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [expiresAt, setExpiresAt] = useState(0)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [resent, setResent] = useState(false)
  const [intent, setIntent] = useState<EntryIntent>(DEFAULT_INTENT)

  // Tick every second while on the verify step so cooldowns update.
  useEffect(() => {
    if (!sent) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [sent])

  // If a valid registered session exists (not a guest draft session), skip straight to workspace
  useEffect(() => {
    if (!authStore.isAuthenticated()) return
    const actor = session.getSnapshot()
    if (!actor || actor.id === "new-applicant") return
    if (onSignIn) onSignIn(actor)
    else navigateTo("/portal#/overview")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 1. Request OTP
  const sendCode = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError("Please enter your official organisation email.")
      return
    }

    setError("")
    setResent(false)
    setSending(true)

    const res = await webAplicatService.requestApplicantOtp(cleanEmail)
    setSending(false)

    if (!res.success) {
      setError(
        res.message || "Could not send verification code. Please try again.",
      )
      return
    }

    const payload = (res.data ?? {}) as unknown as RequestResponsePayload
    const t = Date.now()
    const ttlMs = (payload.expires_in_minutes ?? OTP_TTL_MINUTES) * 60 * 1000
    const cooldownMs =
      (payload.resend_after ?? RESEND_COOLDOWN_SECONDS) * 1000

    setExpiresAt(t + ttlMs)
    setResendAt(t + cooldownMs)
    setNow(t)
    setSent(true)
  }

  // 2. Verify OTP and persist session, then honour the chosen intent.
  const verify = async (code: string) => {
    if (verifying) return
    if (expiresAt > 0 && Date.now() >= expiresAt) {
      setError("This code has expired. Please request a new code below.")
      return
    }

    setError("")
    setVerifying(true)

    const res = await webAplicatService.verifyApplicantOtp(
      email.trim().toLowerCase(),
      code,
    )
    setVerifying(false)

    if (!res.success || !res.data) {
      setError(res.message || "Invalid or expired code. Please try again.")
      return
    }

    const { token, application } =
      res.data as unknown as VerifyResponsePayload

    const storedUser: StoredUser = {
      id: application?.id ?? "",
      name:
        application?.applicant_name ||
        application?.legal_name ||
        "Applicant",
      email: application?.business_email || email.trim(),
      contact:
        application?.applicant_phone || application?.business_phone || "",
      status: application?.status ?? "Submitted",
    }

    session.signIn(storedUser, token ?? "")

    const actor = session.getSnapshot()

    if (onSignIn && actor) {
      onSignIn(actor)
    }

    // Route based on the intent chosen on the entry screen.
    navigateTo(resolvePostLoginPath(intent, application?.status))
  }

  const canResend = sent && !verifying && !sending && now >= resendAt
  const resendSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000))

  /** Switch the selected intent and reset any in-flight verification state. */
  const switchIntent = (next: EntryIntent) => {
    if (next === intent) return
    setIntent(next)
    setError("")
    setResent(false)
    // Force re-request for the new flow so we don't carry a code tied to the
    // previous intent's context.
    setSent(false)
    setExpiresAt(0)
    setResendAt(0)
  }

  // Copy for the two entry modes.
  const heading =
    intent === "returning" ? "Resume your application" : "Welcome back"
  const subheading =
    intent === "returning"
      ? "Sign in with your organisation email to resume your saved draft."
      : "Use the official organisation email provided in your application. No password needed."

  const toggleHref =
    intent === "returning" ? "Active applicant? Sign in instead →" : "Returning applicant? Resume your draft →"

  return (
    <div className="auth-page auth-login">
      <div className="auth-brand">
        <Logo light />
        <span>Member and applicant access</span>
        <h1>Pick up where you left off.</h1>
        <p>
          One email sign-in for your application and your ISPAU membership.
          Your saved application opens right where you stopped.
        </p>
        <button type="button" onClick={() => go("home")}>
          ← Return to public website
        </button>
      </div>

      <main className="auth-form">
        <span className="eyebrow">
          {sent ? "Step 2 of 2 · Verify email" : "Step 1 of 2 · Your email"}
        </span>
        <h2>{sent ? "Check your email" : heading}</h2>
        <p>
          {sent ? (
            <>
              Enter the six-digit code sent to{" "}
              <strong>{email.trim()}</strong>.
            </>
          ) : (
            subheading
          )}
        </p>

        <form
          className="otp-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (!sent && !sending) void sendCode()
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
                disabled={sending}
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
                  setExpiresAt(0)
                  setResendAt(0)
                }}
              >
                Change email
              </button>
              <OtpInput
                key={expiresAt}
                onComplete={verify}
                disabled={verifying}
                error={error}
              />
              <small id="code-help">
                Code expires in {OTP_TTL_MINUTES} minutes.
              </small>
            </>
          )}

          {error && (
            <p id="code-error" className="inline-error" role="alert">
              {error}
            </p>
          )}

          {!sent && (
            <Button type="submit" disabled={sending}>
              {sending ? "Sending code…" : "Send verification code"}
            </Button>
          )}

          {verifying && (
            <p className="otp-verifying" role="status">
              Verifying your code…
            </p>
          )}

          {/* Toggle link that replaces “← Choose a different option”. */}
          <button
            type="button"
            className="text-link"
            style={{ marginTop: 12, display: "inline-block" }}
            disabled={verifying || sending}
            onClick={() => switchIntent(intent === "active" ? "returning" : "active")}
          >
            {toggleHref}
          </button>
        </form>

        {sent && (
          <div className="otp-resend">
            <span>Didn’t receive a code? Check spam or junk.</span>
            <button
              type="button"
              className="text-link"
              disabled={!canResend}
              onClick={async () => {
                await sendCode()
                setResent(true)
              }}
            >
              {resendSeconds > 0
                ? `Resend in ${resendSeconds}s`
                : "Resend code"}
            </button>
            <span role="status">
              {resent ? "A new code has been sent." : ""}
            </span>
          </div>
        )}

        {staffAccessEnabled && (
          <button
            type="button"
            className="staff-entry"
            onClick={() => go("staff-login")}
          >
            ISPAU staff sign in
          </button>
        )}
      </main>
    </div>
  )
}

/**
 * Post-login destination:
 * - Draft status or returning applicant choice resumes the draft.
 * - Active accounts or verified submissions route to the overview dashboard.
 */
function resolvePostLoginPath(intent: EntryIntent,status: string | undefined,): string {
  if (intent === "returning" || status === "Draft") {
    return "/portal#/application"
  }
  return "/portal#/overview"
}
