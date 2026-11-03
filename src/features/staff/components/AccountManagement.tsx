import { useState, useSyncExternalStore } from "react"
import { staffAuthService } from "@/services/staffAuthService"
import { roleLabels } from "@/config/workspace"
import { can } from "@/config/permissions"
import type { Actor, StaffRole } from "@/features/membership/types/workspace"
import type { StaffAccount } from "../services/accounts"
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
    >(null),
    [selected, setSelected] = useState<StaffAccount | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [temporary, setTemporary] = useState(""),
    [issued, setIssued] = useState<{ email: string; password: string } | null>(
      null,
    ),
    [visible, setVisible] = useState(false)
  if (!can(actor, "staff.accounts.manage")) return null
  const open = (action: typeof intent, account?: StaffAccount) => {
    setIntent(action)
    setSelected(account || null)
    setError("")
    setTemporary("")
    setVisible(false)
    setIssued(null)
  }
  const submit = async (form: HTMLFormElement) => {
    const data = new FormData(form)
    setBusy(true)
    setError("")
    try {
      const account = await staffAuthService.manage(intent!, {
        id: selected?.id,
        name: String(data.get("name") || selected?.name || ""),
        email: String(data.get("email") || selected?.email || ""),
        role: String(
          data.get("role") || selected?.role || "membership_admin",
        ) as StaffRole,
        temporaryPassword: temporary,
        confirmationPassword: String(data.get("confirmationPassword") || ""),
      })
      if (intent === "create" || intent === "reset") {
        setIssued({ email: account.email, password: temporary })
        setTemporary("")
        form.reset()
      } else {
        setIntent(null)
        setMessage(
          intent === "remove"
            ? "Administrator access removed. Existing activity and account history are retained."
            : "Administrator details updated. Existing sessions must sign in again.",
        )
      }
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="workspace-panel">
      <div className="workspace-section-heading">
        <div>
          <h2>Administrator accounts</h2>
          <p>
            Create access, update roles or issue a temporary password reset.
            Private passwords are never displayed.
          </p>
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
        rowKey={(account) => account.id}
        columns={[
          {
            label: "Name",
            cell: (account) => account.name,
            sort: (account) => account.name,
          },
          {
            label: "Login email",
            cell: (account) => account.email,
            sort: (account) => account.email,
          },
          { label: "Role", cell: (account) => roleLabels[account.role] },
          {
            label: "Access",
            cell: (account) =>
              account.status === "Removed"
                ? "Deleted - access removed"
                : account.status,
          },
          {
            label: "Last login",
            cell: (account) =>
              account.lastLoginAt
                ? new Date(account.lastLoginAt).toLocaleString("en-GB", {
                    timeZone: "Africa/Kampala",
                  })
                : "Not recorded",
          },
          {
            label: "Actions",
            cell: (account) =>
              account.status === "Removed" ? (
                "History retained"
              ) : account.id === actor.id ? (
                "Your account"
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button kind="ghost" onClick={() => open("update", account)}>
                    Edit
                  </Button>
                  <Button kind="ghost" onClick={() => open("reset", account)}>
                    Reset password
                  </Button>
                  <Button kind="ghost" onClick={() => open("remove", account)}>
                    Delete admin
                  </Button>
                </div>
              ),
          },
        ]}
      />
      <p className="workspace-help">
        Deleting an administrator removes their access, not their audit history.
        Login email changes require verified account recovery; they cannot
        silently redirect reset codes to another person.
      </p>
      {intent && (
        <Dialog
          title={
            issued
              ? "Temporary access issued"
              : intent === "create"
                ? "Create administrator"
                : intent === "reset"
                  ? "Reset administrator password"
                  : intent === "update"
                    ? "Edit administrator"
                    : "Delete administrator access"
          }
          onClose={() => {
            if (!busy) {
              setIntent(null)
              setIssued(null)
              setTemporary("")
            }
          }}
        >
          {issued ? (
            <>
              <p>
                Share these temporary sign-in details privately with the account
                holder.{" "}
                {staffAuthService.skipEmailVerification
                  ? "During local testing they only need to set their own password; no email code is required."
                  : "They must verify their email and set their own password before accessing the dashboard."}
              </p>
              <dl className="workspace-record">
                <div>
                  <dt>Email</dt>
                  <dd>{issued.email}</dd>
                </div>
                <div>
                  <dt>Temporary password</dt>
                  <dd>
                    <code>{issued.password}</code>
                  </dd>
                </div>
              </dl>
              <p>
                This temporary password is shown only here. It expires after 24
                hours.{" "}
                {!staffAuthService.skipEmailVerification &&
                  "Email verification codes expire after 10 minutes."}
              </p>
              <Button
                onClick={() => {
                  setIssued(null)
                  setIntent(null)
                }}
              >
                Close temporary details
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
              <p>
                {selected?.name} {selected?.email}
              </p>
              {error && (
                <p role="alert" className="inline-error">
                  {error}
                </p>
              )}
              {(intent === "create" || intent === "update") && (
                <>
                  <label className="field">
                    Name *
                    <input name="name" required defaultValue={selected?.name} />
                  </label>
                  <label className="field">
                    Login email *
                    <input
                      type="email"
                      name="email"
                      required
                      defaultValue={selected?.email}
                      readOnly={intent === "update"}
                      autoComplete="off"
                    />
                  </label>
                  <label className="field">
                    Role *
                    <select
                      name="role"
                      required
                      defaultValue={selected?.role || "membership_admin"}
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
              {(intent === "create" || intent === "reset") && (
                <>
                  <label className="field">
                    Temporary password *
                    <input
                      type={visible ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      value={temporary}
                      onChange={(event) => setTemporary(event.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      kind="secondary"
                      onClick={() =>
                        setTemporary(
                          `Join-${crypto.randomUUID().slice(0, 8)}-${crypto.randomUUID().slice(0, 4)}`,
                        )
                      }
                    >
                      Generate temporary password
                    </Button>
                    <Button kind="ghost" onClick={() => setVisible(!visible)}>
                      {visible ? "Hide" : "Show"} temporary password
                    </Button>
                  </div>
                  <p className="workspace-help">
                    A temporary password cannot open the dashboard until its
                    owner{" "}
                    {staffAuthService.skipEmailVerification
                      ? "chooses a private password. Email codes are skipped during local testing."
                      : "verifies the email and chooses a private password."}
                    Resetting invalidates the previous password and sessions.
                  </p>
                </>
              )}
              {intent === "remove" && (
                <p>
                  Remove this administrator’s access and invalidate their
                  sessions? All previous login, logout, change and download
                  records will remain available to Super Admin.
                </p>
              )}
              <label className="field">
                Confirm with your own Super Admin password *
                <input
                  name="confirmationPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <div className="workspace-actions">
                <Button
                  kind="secondary"
                  disabled={busy}
                  onClick={() => setIntent(null)}
                >
                  Cancel
                </Button>
                <Button
                  kind={intent === "remove" ? "danger" : "primary"}
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? "Saving…"
                    : intent === "remove"
                      ? "Delete administrator access"
                      : "Confirm changes"}
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </section>
  )
}
