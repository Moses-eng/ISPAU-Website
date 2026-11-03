import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import Logo from "@/components/layout/Logo"
import { staffAuthService } from "@/services/staffAuthService"
import { accountPolicy, type SetupChallenge } from "../services/accounts"
import { publicSiteUrl } from "@/config/deployment"

export default function StaffLogin({ onContinue }: { onContinue: () => void }) {
  const [challenge, setChallenge] = useState<SetupChallenge | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [email, setEmail] = useState("")
  const skipVerification =
    import.meta.env.DEV && staffAuthService.skipEmailVerification
  useEffect(() => {
    void staffAuthService.restoreOnce()
  }, [])
  const submit = async (form: HTMLFormElement) => {
    const data = new FormData(form),
      password = String(data.get("password") || "")
    setError("")
    setMessage("")
    setBusy(true)
    try {
      if (challenge) {
        if (password !== data.get("confirmPassword"))
          throw Error("The new passwords do not match.")
        await staffAuthService.completeSetup(
          challenge,
          String(data.get("code") || ""),
          password,
        )
        setChallenge(null)
        form.reset()
        setMessage(
          "Your private password is ready. Sign in with your email and new password.",
        )
      } else {
        const result = await staffAuthService.login(email, password)
        form.reset()
        if (result.challenge) {
          setChallenge(result.challenge)
          setMessage(
            skipVerification
              ? "Choose your private password to continue. Email verification is skipped during local testing."
              : "Verify your email and choose your private password before accessing the dashboard.",
          )
        } else onContinue()
      }
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="auth-page staff-auth">
      <div className="auth-brand">
        <Logo light />
        <div className="mt-8 w-full lg:mt-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#dbc6cc]">
            ISPAU administration
          </span>
          <h1>The ISPAU administrator workspace.</h1>
          <p>
            Super Admin, Membership Admin and Finance Admin use the same login.
            Your assigned role determines what you can access.
          </p>
          {publicSiteUrl && (
            <button onClick={() => location.assign(publicSiteUrl)}>
              ← ISPAU website
            </button>
          )}
        </div>
      </div>
      <main className="auth-form">
        <span className="eyebrow">Administrator access</span>
        <h2>
          {challenge ? "Set your private password" : "Administrator login"}
        </h2>
        <p>
          {challenge
            ? skipVerification
              ? `Set a new password for ${challenge.email}. No verification code is needed during local testing.`
              : `Enter the verification code sent to ${challenge.email}. Your temporary password cannot open the dashboard.`
            : "Sign in with your administrator email and password."}
        </p>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="workspace-note">
            {message}
          </p>
        )}
        <form
          key={challenge?.id || "login"}
          className="workspace-form mt-5"
          onSubmit={(event) => {
            event.preventDefault()
            void submit(event.currentTarget)
          }}
        >
          {challenge ? (
            <>
              {!skipVerification && (
                <>
                  <label className="field">
                    Email verification code *
                    <input
                      name="code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                    />
                  </label>
                  <p className="workspace-help">
                    Codes expire after 10 minutes. Only the account holder
                    should receive this code.
                  </p>
                </>
              )}
              <label className="field">
                New private password *
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={accountPolicy.minimumPasswordLength}
                  maxLength={accountPolicy.maximumPasswordLength}
                />
              </label>
              <label className="field">
                Confirm new password *
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  minLength={accountPolicy.minimumPasswordLength}
                  maxLength={accountPolicy.maximumPasswordLength}
                />
              </label>
              <p className="workspace-help">
                Use a memorable phrase of at least 15 characters. Do not reuse
                the temporary password. ISPAU administrators cannot view your
                private password.
              </p>
            </>
          ) : (
            <>
              <label className="field">
                Administrator email *
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                Password *
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />
              </label>
            </>
          )}
          <Button type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : challenge
                ? skipVerification
                  ? "Set password"
                  : "Verify email & set password"
                : "Sign in"}
          </Button>
          {challenge && (
            <Button
              kind="ghost"
              disabled={busy}
              onClick={() => {
                setChallenge(null)
                setError("")
                setMessage("")
              }}
            >
              {skipVerification
                ? "Back to login"
                : "Back to login / request a new code"}
            </Button>
          )}
        </form>
        {!challenge && (
          <p className="workspace-help mt-5">
            Need a password reset? Contact your ISPAU Super Admin.{" "}
            {!skipVerification &&
              "Resets require confirmation through your registered email."}
          </p>
        )}
        {import.meta.env.DEV && staffAuthService.developmentMode && (
          <details className="workspace-note mt-6">
            <summary>Local development access</summary>
            <p>
              This local adapter resets accounts when the page refreshes. Use
              sample credentials only.
            </p>
            {challenge ? (
              <p>
                {skipVerification ? (
                  "Email verification is skipped for local testing. No code is required and no email is sent."
                ) : (
                  <>
                    Simulated email code:{" "}
                    <code>{staffAuthService.previewCode(challenge.id)}</code>.
                    No email was sent.
                  </>
                )}
              </p>
            ) : (
              <>
                <p>
                  Email: <code>superadmin@ispau.example</code>
                </p>
                <p>
                  Password: <code>ISPAU-Preview-2026!</code>
                </p>
              </>
            )}
          </details>
        )}
      </main>
    </div>
  )
}
