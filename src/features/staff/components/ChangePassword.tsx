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
        <label className="field">
          Current password *
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label className="field">
          New password *
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
          />
        </label>
        <label className="field">
          Confirm new password *
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
          />
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? "Updating…" : "Change password & sign out"}
        </Button>
      </form>
    </Dialog>
  )
}
