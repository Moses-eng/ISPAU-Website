import PasswordField from "@/components/ui/PasswordField"
import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import Logo from "@/components/layout/Logo"
import OtpInput from "@/features/staff/components/OtpInput"
import { staffAuthService } from "@/services/staffAuthService"
import {
  accountPolicy,
  type EmailChallenge,
  type PasswordInvitation,
} from "../services/accounts"
import { publicSiteUrl } from "@/config/deployment"
import { navigateTo } from "@/app/navigation"

export default function StaffLogin({
  onContinue,
  invitationToken = "",
}: {
  onContinue: () => void
  invitationToken?: string
}) {
  const [challenge, setChallenge] = useState<EmailChallenge | null>(null)
  const [invitation, setInvitation] = useState<PasswordInvitation | null>(null)
  const [loadingInvitation, setLoadingInvitation] = useState(
    Boolean(invitationToken),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [now, setNow] = useState(Date.now())
  const pending = useRef(false)
  const passwordInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    let active = true
    setInvitation(null)
    setError("")
    setChallenge(null)
    if (!invitationToken) {
      setLoadingInvitation(false)
      return
    }
    setLoadingInvitation(true)
    void staffAuthService
      .invitation(invitationToken)
      .then((result) => {
        if (active) {
          setInvitation(result)
          setEmail(result.email)
        }
      })
      .catch((error) => {
        if (active) setError((error as Error).message)
      })
      .finally(() => {
        if (active) setLoadingInvitation(false)
      })
    return () => {
      active = false
    }
  }, [invitationToken])
  useEffect(() => {
    if (message && !invitationToken) passwordInput.current?.focus()
  }, [message, invitationToken])
  useEffect(() => {
    if (!challenge) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [challenge])
  const submit = async (form: HTMLFormElement) => {
    if (pending.current) return
    const data = new FormData(form)
    pending.current = true
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const password = String(data.get("password") || "")
      if (invitationToken && invitation) {
        if (password !== data.get("confirmPassword"))
          throw Error("The passwords do not match.")
        await staffAuthService.completeSetup(invitationToken, password)
        await staffAuthService.logout()
        setEmail(invitation.email)
        form.reset()
        setMessage("Password saved. Sign in to continue.")
        // Remove the consumed bearer token from browser history.
        history.replaceState(null, "", "/#/login")
        dispatchEvent(new PopStateEvent("popstate"))
      } else {
        const result = await staffAuthService.login(email, password)
        form.reset()
        setChallenge(result.challenge)
      }
    } catch (error) {
      setError((error as Error).message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  const verify = async (code: string) => {
    if (!challenge || pending.current) return
    pending.current = true
    setBusy(true)
    setError("")
    try {
      await staffAuthService.verifyLogin(challenge, code)
      onContinue()
    } catch (error) {
      setError((error as Error).message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  const resend = async () => {
    if (!challenge || pending.current) return
    pending.current = true
    setBusy(true)
    setError("")
    try {
      const result = await staffAuthService.resendLogin(challenge)
      setChallenge(result.challenge)
      setMessage("A new verification code is ready.")
    } catch (error) {
      setError((error as Error).message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <div className="auth-page staff-auth">
      <div className="auth-brand">
        <Logo light />
        <div className="staff-auth-copy">
          <span className="eyebrow">ISPAU administration</span>
          <h1>Your team. One secure workspace.</h1>
          <p>
            Manage membership, finance and association services with access
            assigned to your role.
          </p>
          {publicSiteUrl && (
            <button onClick={() => location.assign(publicSiteUrl)}>
              ← ISPAU website
            </button>
          )}
        </div>
      </div>
      <main className="auth-form">
        <span className="eyebrow">
          {invitationToken
            ? "Administrator invitation"
            : challenge
              ? "Step 2 of 2 · Verify email"
              : "Step 1 of 2 · Administrator login"}
        </span>
        <h2>
          {invitationToken
            ? "Set your password"
            : challenge
              ? "Check your email"
              : "Welcome back"}
        </h2>
        <p>
          {invitationToken ? (
            invitation ? (
              <>
                Create a password for <strong>{invitation.email}</strong>.
              </>
            ) : (
              "Your invitation gives you access to ISPAU administration."
            )
          ) : challenge ? (
            <>
              Enter the code for <strong>{challenge.email}</strong>.
            </>
          ) : (
            "Sign in with your administrator email and password."
          )}
        </p>
        {message && (
          <p role="status" className="workspace-note">
            {message}
          </p>
        )}
        {loadingInvitation ? (
          <p role="status">Checking your invitation…</p>
        ) : challenge ? (
          <div className="staff-otp">
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => {
                setChallenge(null)
                setError("")
                setMessage("")
              }}
            >
              Back to sign in
            </button>
            <OtpInput
              key={challenge.id}
              onComplete={(code) => void verify(code)}
              disabled={busy}
              error={error}
            />
            <small>
              {Date.parse(challenge.expiresAt) <= now
                ? "Code expired. Sign in again for a new code."
                : "Code expires in 10 minutes."}
            </small>
            {busy && <p role="status">Verifying…</p>}
            <button
              type="button"
              className="text-link"
              disabled={
                busy ||
                Date.parse(challenge.resendAvailableAt) > now ||
                Date.parse(challenge.expiresAt) <= now
              }
              onClick={() => void resend()}
            >
              {Date.parse(challenge.resendAvailableAt) > now
                ? `Resend in ${Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1000)}s`
                : "Resend code"}
            </button>
          </div>
        ) : (
          (!invitationToken || invitation) && (
            <form
              className="workspace-form"
              key={invitationToken || "login"}
              onSubmit={(event) => {
                event.preventDefault()
                void submit(event.currentTarget)
              }}
            >
              {invitationToken ? (
                <>
                  <PasswordField
                    label="New password"
                    name="password"

                    autoComplete="new-password"
                    autoFocus
                    required
                    minLength={accountPolicy.minimumPasswordLength}
                    maxLength={accountPolicy.maximumPasswordLength}
                    disabled={busy}
                  />
                  <PasswordField
                    label="Confirm password"
                    name="confirmPassword"

                    autoComplete="new-password"
                    required
                    minLength={accountPolicy.minimumPasswordLength}
                    maxLength={accountPolicy.maximumPasswordLength}
                    disabled={busy}
                  />
                  <small>
                    8–128 characters, including a letter, a number and a symbol.
                  </small>
                </>
              ) : (
                <>
                  <label className="field">
                    Administrator email
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      value={email}
                      disabled={busy}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <PasswordField
                    label="Password"
                    ref={passwordInput}

                    name="password"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    disabled={busy}
                  />
                </>
              )}
              <Button type="submit" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : invitationToken
                    ? "Save password & continue to login"
                    : "Sign in"}
              </Button>
            </form>
          )
        )}
        {error && (
          <p id="code-error" role="alert" className="inline-error">
            {error}
          </p>
        )}
        {invitationToken && (
          <Button
            kind="ghost"
            disabled={busy}
            onClick={() => navigateTo("/#/login")}
          >
            Back to sign in
          </Button>
        )}
        {!invitationToken && !challenge && (
          <small>Need a password reset? Contact your Super Admin.</small>
        )}
        {staffAuthService.developmentMode && !invitationToken && (
          <details className="workspace-note staff-preview">
            <summary>UI preview access</summary>
            {challenge ? (
              <p>
                No email sent. Use code <strong>123456</strong>.
              </p>
            ) : (
              <>
                <p>
                  Email: <code>superadmin@ispau.example</code>
                </p>
                <p>
                  Password: <code>ISPAU-Preview-2026!</code>
                </p>
                <p>
                  Local accounts and invitation links reset when the page
                  reloads.
                </p>
              </>
            )}
          </details>
        )}
      </main>
    </div>
  )
}
