import { useEffect, useState, useMemo } from "react"
import Button from "@/components/ui/Button"
import Logo from "@/components/layout/Logo"
import { publicSiteUrl } from "@/config/deployment"
import systemUsersService from "@/apiServices/systemUsersService"

export default function StaffLogin({ onContinue }: { onContinue: () => void }) {
  const [isSetupMode, setIsSetupMode] = useState(false)
  const [email, setEmail] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // Parse email and setup query params from normal search or hash search
  useEffect(() => {
    const hash = window.location.hash
    const searchStr =
      window.location.search ||
      (hash.includes("?") ? hash.substring(hash.indexOf("?")) : "")
    const params = new URLSearchParams(searchStr)

    const urlEmail = params.get("email")
    const urlSetup = params.get("setup")

    if (urlEmail) {
      setEmail(urlEmail)
    }

    if (urlSetup === "true" || urlSetup === "1") {
      setIsSetupMode(true)
      setMessage(
        "Please enter your temporary password and establish a new private password.",
      )
    }
  }, [])

  // Standard Password Policy rules
  const passwordCriteria = useMemo(() => {
    return [
      {
        id: "len",
        label: "At least 8 characters",
        valid: newPassword.length >= 8,
      },
      {
        id: "upper",
        label: "At least one uppercase letter (A-Z)",
        valid: /[A-Z]/.test(newPassword),
      },
      {
        id: "lower",
        label: "At least one lowercase letter (a-z)",
        valid: /[a-z]/.test(newPassword),
      },
      {
        id: "number",
        label: "At least one number (0-9)",
        valid: /[0-9]/.test(newPassword),
      },
      {
        id: "special",
        label: "At least one special character (!@#$%^&*...)",
        valid: /[^A-Za-z0-9]/.test(newPassword),
      },
    ]
  }, [newPassword])

  const isPasswordPolicyMet = passwordCriteria.every((rule) => rule.valid)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setBusy(true)

    try {
      const res = await systemUsersService.login({
        email: email.trim().toLowerCase(),
        password: temporaryPassword,
      })

      if (!res.success) {
        throw new Error(res.message || "Invalid email or password.")
      }

      onContinue()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setMessage("")

    // 1. Password policy verification
    if (!isPasswordPolicyMet) {
      setError("Please ensure your new password meets all security criteria below.")
      return
    }

    // 2. Do not reuse temporary password
    if (newPassword === temporaryPassword) {
      setError("Your new private password must be different from your temporary password.")
      return
    }

    // 3. Confirm password matching
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.")
      return
    }

    setBusy(true)

    try {
      // Authenticate with temporary password to obtain token
      const loginRes = await systemUsersService.login({
        email: email.trim().toLowerCase(),
        password: temporaryPassword,
      })

      if (!loginRes.success) {
        throw new Error(
          loginRes.message || "The temporary password or email is incorrect.",
        )
      }

      // Update password using backend endpoint
      const updateRes = await systemUsersService.updatePassword({
        current_password: temporaryPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })

      if (!updateRes.success) {
        throw new Error(updateRes.message || "Failed to set private password.")
      }

      setMessage(
        "Your private password has been established successfully. Entering workspace…",
      )
      setTimeout(() => {
        onContinue()
      }, 1000)
    } catch (err) {
      setError((err as Error).message)
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
            Super Admin, Membership Admin, and Finance Admin use the same login.
            Your assigned role determines what you can access.
          </p>
          {publicSiteUrl && (
            <button
              type="button"
              onClick={() => location.assign(publicSiteUrl)}
            >
              ← ISPAU website
            </button>
          )}
        </div>
      </div>

      <main className="auth-form">
        <span className="eyebrow">Administrator access</span>
        <h2>
          {isSetupMode ? "Set your private password" : "Administrator login"}
        </h2>
        <p>
          {isSetupMode
            ? `Set a private password for ${email || "your account"}. Enter your temporary password and create a strong private password.`
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

        {isSetupMode ? (
          /* ==================== SETUP PRIVATE PASSWORD FORM ==================== */
          <form className="workspace-form mt-5" onSubmit={handleUpdatePassword}>
            <label className="field">
              Administrator email *
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </label>

            <label className="field">
              Temporary password *
              <input
                type="password"
                required
                autoComplete="current-password"
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
              />
            </label>

            <label className="field">
              New private password *
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            {/* Live Password Format Requirements Panel */}
            <div className="rounded-md border border-[#e3d6da] bg-[#faf5f6] p-3 text-[12px]">
              <span className="font-semibold text-[#461220] block mb-1.5">
                Password requirements:
              </span>
              <ul className="space-y-1">
                {passwordCriteria.map((rule) => (
                  <li
                    key={rule.id}
                    className={`flex items-center gap-2 transition-colors ${
                      rule.valid
                        ? "text-[#16734a] font-medium"
                        : "text-[#6c5960]"
                    }`}
                  >
                    <span>{rule.valid ? "✓" : "○"}</span>
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <label className="field mt-1">
              Confirm new password *
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            <Button
              type="submit"
              disabled={busy || !isPasswordPolicyMet}
            >
              {busy
                ? "Setting private password…"
                : "Set private password & enter"}
            </Button>

            <Button
              kind="ghost"
              type="button"
              disabled={busy}
              onClick={() => {
                setIsSetupMode(false)
                setError("")
                setMessage("")
              }}
            >
              Back to standard login
            </Button>
          </form>
        ) : (
          /* ==================== STANDARD LOGIN FORM ==================== */
          <form className="workspace-form mt-5" onSubmit={handleLogin}>
            <label className="field">
              Administrator email *
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              Password *
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                required
              />
            </label>

            <Button type="submit" disabled={busy}>
              {busy ? "Please wait…" : "Sign in"}
            </Button>

            <Button
              kind="ghost"
              type="button"
              disabled={busy}
              onClick={() => {
                setIsSetupMode(true)
                setError("")
                setMessage("")
              }}
            >
              Have a temporary password? Set your private password
            </Button>
          </form>
        )}

        {!isSetupMode && (
          <p className="workspace-help mt-5">
            Need an account or password reset? Contact your ISPAU Super Admin.
          </p>
        )}
      </main>
    </div>
  )
}
