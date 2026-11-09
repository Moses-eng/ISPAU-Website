import PasswordField from "@/components/ui/PasswordField"
import { useState, useSyncExternalStore } from "react"
import { staffAuthService } from "@/services/staffAuthService"
import { roleLabels } from "@/config/workspace"
import { can } from "@/config/permissions"
import { navigateTo } from "@/app/navigation"
import type { Actor, StaffRole } from "@/features/membership/types/workspace"
import type { StaffAccount, PreviewInvitation } from "../services/accounts"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import Button from "@/components/ui/Button"

export default function AccountManagement({ actor }: { actor: Actor }) {
  const accounts = useSyncExternalStore(
    staffAuthService.subscribe,
    staffAuthService.getAccountsSnapshot,
  )
  const [intent, setIntent] = useState<
    "create" | "reset" | "update" | "remove" | null
  >(null)
  const [selected, setSelected] = useState<StaffAccount | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [issued, setIssued] = useState<{
    email: string
    previewInvitation?: PreviewInvitation
  } | null>(null)
  if (!can(actor, "staff.accounts.manage")) return null
  const open = (action: typeof intent, account?: StaffAccount) => {
    setIntent(action)
    setSelected(account || null)
    setError("")
    setIssued(null)
  }
  const submit = async (form: HTMLFormElement) => {
    const data = new FormData(form)
    setBusy(true)
    setError("")
    try {
      const result = await staffAuthService.manage(intent!, {
        id: selected?.id,
        name: String(data.get("name") || selected?.name || ""),
        email: String(data.get("email") || selected?.email || ""),
        role: String(
          data.get("role") || selected?.role || "membership_admin",
        ) as StaffRole,
        confirmationPassword: String(data.get("confirmationPassword") || ""),
      })
      if (intent === "create" || intent === "reset") {
        setIssued({
          email: result.account.email,
          previewInvitation: result.previewInvitation,
        })
        form.reset()
      } else {
        setIntent(null)
        setMessage(
          intent === "remove"
            ? "Administrator access removed. Activity history is retained."
            : "Administrator details updated. Existing sessions must sign in again.",
        )
      }
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const previewSetup = async (invitation: PreviewInvitation) => {
    setBusy(true)
    setError("")
    try {
      await staffAuthService.logout()
      navigateTo(
        `/#/password-setup?token=${encodeURIComponent(invitation.token)}`,
      )
    } catch (error) {
      setError((error as Error).message)
      setBusy(false)
    }
  }
  return (
    <section className="workspace-panel">
      <div className="workspace-section-heading">
        <div>
          <h2>Administrator accounts</h2>
          <p>Invite administrators by email and assign their access.</p>
        </div>
        <Button onClick={() => open("create")}>Create administrator</Button>
      </div>
      {message && (
        <p role="status" className="workspace-note">
          {message}
        </p>
      )}
      <DataTable
        rows={accounts}
        label="Administrator accounts"
        rowKey={(a) => a.id}
        columns={[
          { label: "Name", cell: (a) => a.name, sort: (a) => a.name },
          { label: "Login email", cell: (a) => a.email, sort: (a) => a.email },
          { label: "Role", cell: (a) => roleLabels[a.role] },
          {
            label: "Access",
            cell: (a) =>
              a.status === "Setup required"
                ? "Invitation pending"
                : a.status === "Removed"
                  ? "Access removed"
                  : a.status,
          },
          {
            label: "Last login",
            cell: (a) =>
              a.lastLoginAt
                ? new Date(a.lastLoginAt).toLocaleString("en-GB", {
                    timeZone: "Africa/Kampala",
                  })
                : "Not yet signed in",
          },
          {
            label: "Actions",
            cell: (a) =>
              a.status === "Removed" ? (
                "History retained"
              ) : a.id === actor.id ? (
                "Your account"
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button kind="ghost" onClick={() => open("update", a)}>
                    Edit
                  </Button>
                  <Button kind="ghost" onClick={() => open("reset", a)}>
                    {a.status === "Setup required"
                      ? "Resend invitation"
                      : "Send password reset"}
                  </Button>
                  <Button kind="ghost" onClick={() => open("remove", a)}>
                    Remove access
                  </Button>
                </div>
              ),
          },
        ]}
      />
      {intent && (
        <Dialog
          title={
            issued
              ? staffAuthService.developmentMode
                ? "Invitation ready · preview"
                : "Invitation queued"
              : intent === "create"
                ? "Create administrator"
                : intent === "reset"
                  ? "Send password setup link"
                  : intent === "update"
                    ? "Edit administrator"
                    : "Remove administrator access"
          }
          onClose={() => {
            if (!busy) {
              setIntent(null)
              setIssued(null)
            }
          }}
        >
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          {issued ? (
            <>
              <p role="status">
                {staffAuthService.developmentMode
                  ? "Preview invitation prepared for"
                  : "A password setup email has been queued for"}{" "}
                <strong>{issued.email}</strong>.
              </p>
              <p>
                The administrator sets their own password, then signs in with
                their email, password and verification code.
              </p>
              {issued.previewInvitation && (
                <section
                  className="invitation-email"
                  aria-label="Invitation email preview"
                >
                  <span className="eyebrow">Email preview · no email sent</span>
                  <p>To: {issued.email}</p>
                  <h3>You’re invited to ISPAU administration</h3>
                  <p>
                    Set your password to activate your administrator account.
                  </p>
                  <Button
                    disabled={busy}
                    onClick={() => void previewSetup(issued.previewInvitation!)}
                  >
                    Set your password
                  </Button>
                  <small>
                    This link expires in 24 hours and can be used once. This
                    preview opens in the same tab and signs you out. Reloading
                    clears local preview accounts.
                  </small>
                </section>
              )}
              <Button
                kind="secondary"
                disabled={busy}
                onClick={() => {
                  setIssued(null)
                  setIntent(null)
                }}
              >
                Done
              </Button>
            </>
          ) : (
            <form
              className="workspace-form"
              onSubmit={(event) => {
                event.preventDefault()
                void submit(event.currentTarget)
              }}
            >
              {selected && <p>{selected.email}</p>}
              {(intent === "create" || intent === "update") && (
                <>
                  {intent === "update" && (
                    <label className="field">
                      Name
                      <input
                        name="name"
                        required
                        defaultValue={selected?.name}
                      />
                    </label>
                  )}
                  <label className="field">
                    Administrator email
                    <input
                      name="email"
                      type="email"
                      autoComplete="off"
                      required
                      defaultValue={selected?.email}
                      readOnly={intent === "update"}
                    />
                  </label>
                  <label className="field">
                    Role
                    <select
                      name="role"
                      defaultValue={selected?.role || "membership_admin"}
                      required
                    >
                      {Object.entries(roleLabels).map(([role, label]) => (
                        <option key={role} value={role}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {intent === "reset" && (
                <p>
                  A new password setup link will be emailed to this
                  administrator. Their previous password, sessions and
                  invitation links will stop working.
                </p>
              )}
              {intent === "remove" && (
                <p>
                  Remove this administrator’s access? Their previous activity
                  and audit history will be retained.
                </p>
              )}
              <PasswordField
                label="Confirm your Super Admin password"

                name="confirmationPassword"
                autoComplete="current-password"
                required
              />
              <div className="workspace-actions">
                <Button
                  kind="secondary"
                  disabled={busy}
                  onClick={() => setIntent(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  kind={intent === "remove" ? "danger" : "primary"}
                  disabled={busy}
                >
                  {busy
                    ? "Saving…"
                    : intent === "create"
                      ? "Create administrator & send invitation"
                      : intent === "reset"
                        ? "Send setup link"
                        : intent === "remove"
                          ? "Remove access"
                          : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </section>
  )
}
