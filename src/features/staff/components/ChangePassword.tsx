import { useState, useMemo } from "react"
import Button from "@/components/ui/Button"
import Dialog from "@/components/dashboard/Dialog"
import systemUsersService from "@/apiServices/systemUsersService"
import { sessionService } from "@/services/sessionService"

export default function ChangePassword({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // Standard password policy criteria
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")

    // 1. Password policy verification
    if (!isPasswordPolicyMet) {
      setError("Please ensure your new password meets all security criteria.")
      return
    }

    // 2. Prevent reusing the current password
    if (currentPassword === newPassword) {
      setError("The new password must be different from your current password.")
      return
    }

    // 3. Confirm password matching
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.")
      return
    }

    setBusy(true)

    try {
      const res = await systemUsersService.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })

      if (!res.success) {
        throw new Error(res.message || "Failed to update password.")
      }

      setMessage("Password changed successfully. Signing out…")

      // Sign out to require re-authentication with new credentials
      setTimeout(async () => {
        try {
          await systemUsersService.logout()
        } finally {
          sessionService.signOut()
          onClose()
        }
      }, 1200)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="Change your password"
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <form className="workspace-form" onSubmit={handleSubmit}>
        <p>
          Only you can change your private password. You will be required to
          sign in again after the change.
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

        <label className="field">
          Current password *
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={busy}
          />
        </label>

        <label className="field">
          New password *
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={busy}
          />
        </label>

        {/* Live Password Criteria Panel */}
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
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={busy}
          />
        </label>

        <div className="workspace-actions">
          <Button
            type="button"
            kind="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={busy || !isPasswordPolicyMet || !currentPassword}
          >
            {busy ? "Updating…" : "Change password & sign out"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
