import { useState, useEffect, useCallback, useMemo } from "react"
import systemUsersService, {
  type SystemUser,
  type SystemUserRole,
} from "@/apiServices/systemUsersService"
import { roleLabels } from "@/config/workspace"
import { can } from "@/config/permissions"
import type { Actor, StaffRole } from "@/features/membership/types/workspace"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import Button from "@/components/ui/Button"

export default function AccountManagement({ actor }: { actor: Actor }) {
  const [accounts, setAccounts] = useState<SystemUser[]>([])
  const [intent, setIntent] = useState<
    "create" | "reset" | "update" | "remove" | null
  >(null)
  const [selected, setSelected] = useState<SystemUser | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // Form states
  const [temporary, setTemporary] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(
    null,
  )

  const loadAccounts = useCallback(async () => {
    const res = await systemUsersService.list()
    if (res.success && res.data) {
      setAccounts(res.data.items)
    } else {
      setError(res.message || "Failed to load administrator accounts.")
    }
  }, [])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  // Standard password strength criteria
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

  if (!can(actor, "staff.accounts.manage")) return null

  const open = (action: typeof intent, account?: SystemUser) => {
    setIntent(action)
    setSelected(account || null)
    setError("")
    setTemporary("")
    setNewPassword("")
    setConfirmPassword("")
    setIssued(null)
  }

  const submit = async (form: HTMLFormElement) => {
    const data = new FormData(form)
    setBusy(true)
    setError("")
    try {
      if (intent === "create") {
        const name = String(data.get("name") || "").trim()
        const email = String(data.get("email") || "").trim()
        const role = String(
          data.get("role") || "membership_admin",
        ) as SystemUserRole

        const res = await systemUsersService.register({
          name,
          email,
          role,
          password: temporary,
          password_confirmation: temporary,
        })

        if (!res.success) {
          throw new Error(res.message || "Failed to create administrator.")
        }

        setIssued({ email, password: temporary })
        setTemporary("")
        form.reset()
        await loadAccounts()
      } else if (intent === "reset") {
        if (!selected) throw new Error("No administrator account selected.")

        if (!isPasswordPolicyMet) {
          throw new Error("Please ensure the new password meets all security criteria.")
        }

        if (newPassword !== confirmPassword) {
          throw new Error("The new passwords do not match.")
        }

        // Call resetPassword without
        const res = await systemUsersService.resetPassword({
          updateId: selected.id,
          password: newPassword,
          password_confirmation: confirmPassword,
        } as any)

        if (!res.success) {
          throw new Error(res.message || "Failed to reset administrator password.")
        }

        setIntent(null)
        setMessage(`Password for ${selected.name} was successfully reset.`)
        await loadAccounts()
      } else if (intent === "update") {
        if (!selected) throw new Error("No administrator account selected.")
        const name = String(data.get("name") || selected.name).trim()

        const res = await systemUsersService.updateProfile({
          name,
          email: selected.email,
        })

        if (!res.success) {
          throw new Error(res.message || "Failed to update administrator.")
        }

        setIntent(null)
        setMessage("Administrator details updated successfully.")
        await loadAccounts()
      } else if (intent === "remove") {
        if (!selected) throw new Error("No administrator account selected.")

        const res = await systemUsersService.deleteAccount(selected.id)
        if (!res.success) {
          throw new Error(res.message || "Failed to delete administrator.")
        }

        setIntent(null)
        setMessage(
          "Administrator access removed. Existing activity and audit records are retained.",
        )
        await loadAccounts()
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
          {
            label: "Role",
            cell: (account) =>
              roleLabels[account.role as StaffRole] || account.role,
          },
          {
            label: "Access",
            cell: (account) =>
              account.is_active === false
                ? "Deleted - access removed"
                : "Active",
          },
          {
            label: "Last login",
            cell: (account) =>
              account.last_login_at
                ? new Date(account.last_login_at).toLocaleString("en-GB", {
                    timeZone: "Africa/Kampala",
                  })
                : "Not recorded",
          },
          {
            label: "Actions",
            cell: (account) =>
              account.is_active === false ? (
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
                holder. They must verify their email and set their own private
                password before accessing the dashboard.
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
                hours. An invitation email has also been sent to the user.
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
              {selected && (
                <p className="font-semibold text-[#461220]">
                  Target Administrator: {selected.name} ({selected.email})
                </p>
              )}

              {error && (
                <p role="alert" className="inline-error">
                  {error}
                </p>
              )}

              {/* CREATE & UPDATE FIELDS */}
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

              {/* CREATE ONLY: TEMPORARY PASSWORD */}
              {intent === "create" && (
                <>
                  <label className="field">
                    Temporary password *
                    <input
                      type="text"
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
                      type="button"
                      kind="secondary"
                      onClick={() =>
                        setTemporary(
                          `Join-${crypto.randomUUID().slice(0, 8)}-${crypto.randomUUID().slice(0, 4)}`,
                        )
                      }
                    >
                      Generate temporary password
                    </Button>
                  </div>
                  <p className="workspace-help">
                    A temporary password cannot open the dashboard until its
                    owner verifies the email and chooses a private password.
                  </p>
                </>
              )}

              {/* RESET ONLY: NEW PASSWORD & CONFIRMATION WITH POLICY */}
              {intent === "reset" && (
                <>
                  <label className="field">
                    New password *
                    <input
                      type="password"
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                    />
                  </label>

                  {/* Password Strength Requirement Checklist */}
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
                      placeholder="Confirm new password"
                    />
                  </label>
                </>
              )}

              {/* REMOVE ACTION CONFIRMATION */}
              {intent === "remove" && (
                <p>
                  Remove this administrator’s access and invalidate their
                  sessions? All previous login, logout, change and download
                  records will remain available to Super Admin.
                </p>
              )}

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
                  disabled={
                    busy ||
                    (intent === "reset" &&
                      (!isPasswordPolicyMet || !newPassword || !confirmPassword))
                  }
                >
                  {busy
                    ? "Saving…"
                    : intent === "remove"
                      ? "Delete administrator access"
                      : intent === "reset"
                        ? "Reset password"
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
