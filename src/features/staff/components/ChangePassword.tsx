import PasswordField from "@/components/ui/PasswordField"
import { useState } from "react"
import Button from "@/components/ui/Button"
import Dialog from "@/components/dashboard/Dialog"
import { staffAuthService } from "@/services/staffAuthService"
export default function ChangePassword({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  return (
    <Dialog
      title="Change your password"
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <form
        className="workspace-form"
        onSubmit={async (event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          setError("")
          setBusy(true)
          try {
            if (data.get("password") !== data.get("confirmPassword"))
              throw Error("The new passwords do not match.")
            await staffAuthService.changePassword(
              String(data.get("currentPassword") || ""),
              String(data.get("password") || ""),
            )
            onClose()
          } catch (error) {
            setError((error as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        <p>
          Only you can change your private password. You will sign in again
          after the change.
        </p>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <PasswordField
          label="Current password *"
          name="currentPassword"

          autoComplete="current-password"
          required
        />
        <PasswordField
          label="New password *"
          name="password"

          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
        <PasswordField
          label="Confirm new password *"
          name="confirmPassword"

          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
        <small>
          8–128 characters, including a letter, a number and a symbol.
        </small>
        <Button type="submit" disabled={busy}>
          {busy ? "Updating…" : "Change password & sign out"}
        </Button>
      </form>
    </Dialog>
  )
}
