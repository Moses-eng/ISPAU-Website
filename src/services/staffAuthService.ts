import { localStaffAuthentication, staffApiBase } from "@/config/deployment"
import { can } from "@/config/permissions"
import {
  createLocalAccounts,
  type StaffAccount,
  type AccountInput,
  type LoginResult,
  type EmailChallenge,
  type PasswordInvitation,
  type AccountDelivery,
} from "@/features/staff/services/accounts"
import type { Actor, StaffRole } from "@/features/membership/types/workspace"
import { sessionService } from "./sessionService"
import { staffAuditService } from "./staffAuditService"

const local = localStaffAuthentication
  ? createLocalAccounts(undefined, { previewCode: "123456" })
  : null
let accounts: StaffAccount[] = []
let csrfToken = ""
let version = 0
let restoring: Promise<void> | undefined
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${staffApiBase}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw Error(
      "Administrator sign-in is unavailable. Please try again or contact ISPAU.",
    )
  }
  if (!response.ok) {
    if (
      response.status === 401 &&
      sessionService.getSnapshot()?.kind === "staff"
    ) {
      sessionService.signOut()
      accounts = []
      csrfToken = ""
      notify()
    }
    const failure = await response.json().catch(() => null)
    throw Error(
      failure?.error?.message ||
        failure?.message ||
        (response.status === 401
          ? "Email or password is incorrect, or the session has expired."
          : response.status === 403
            ? "This account is not authorised for this action."
            : "The administrator service could not complete the request."),
    )
  }
  if (response.status === 204) return undefined as T
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw Error(
      "The administrator service is not connected. Contact ISPAU for access.",
    )
  return response.json() as Promise<T>
}
async function accept(actor: Actor, accountVersion: number, token?: string) {
  if (actor.kind !== "staff")
    throw Error("An authorised administrator account is required.")
  version = accountVersion
  csrfToken = token || ""
  sessionService.signOut()
  sessionService.acceptAuthenticatedStaff(actor)
  await staffAuthService.loadAccounts()
}
function requireManager() {
  const actor = sessionService.getSnapshot()
  if (!actor || !can(actor, "staff.accounts.manage"))
    throw Error("Only Super Admin can manage administrator accounts.")
  return actor
}
export const staffAuthService = {
  developmentMode: localStaffAuthentication,
  getAccountsSnapshot: () => accounts,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  async login(email: string, password: string): Promise<LoginResult> {
    if (sessionService.getSnapshot()?.kind === "staff")
      await staffAuthService.logout()
    return local
      ? local.login(email, password)
      : request<LoginResult>("/auth/login", "POST", { email, password })
  },
  async verifyLogin(challenge: EmailChallenge, code: string) {
    if (local) {
      const result = await local.verifyLogin(challenge.id, code)
      await accept(result.actor, await local.version(result.actor.id))
    } else {
      const result = await request<{
        actor: Actor
        accountVersion: number
        csrfToken?: string
      }>("/auth/login/verify", "POST", { challengeId: challenge.id, code })
      await accept(result.actor, result.accountVersion, result.csrfToken)
    }
  },
  async resendLogin(challenge: EmailChallenge): Promise<LoginResult> {
    return local
      ? local.resendLogin(challenge.id)
      : request<LoginResult>("/auth/login/resend", "POST", {
          challengeId: challenge.id,
        })
  },
  async invitation(token: string): Promise<PasswordInvitation> {
    return local
      ? local.invitation(token)
      : request<PasswordInvitation>("/auth/password/invitation", "POST", {
          token,
        })
  },
  async completeSetup(token: string, password: string) {
    if (local) {
      const account = await local.completeSetup(token, password)
      staffAuditService.recordAccount(
        {
          id: account.id,
          name: account.name,
          kind: "staff",
          roles: [account.role],
        },
        "Invitation accepted; private password established",
        account.id,
      )
    } else
      await request<void>("/auth/password/setup", "POST", { token, password })
  },
  async restore() {
    if (local || sessionService.getSnapshot()?.kind === "staff") return
    try {
      const result = await request<{
        actor: Actor
        accountVersion: number
        csrfToken?: string
      }>("/auth/session")
      await accept(result.actor, result.accountVersion, result.csrfToken)
    } catch {
      /* The common login form remains available. */
    }
  },
  async logout() {
    try {
      if (!local) await request<void>("/auth/logout", "POST")
    } finally {
      sessionService.signOut()
      accounts = []
      csrfToken = ""
      version = 0
      notify()
    }
  },
  async loadAccounts() {
    const actor = sessionService.getSnapshot()
    if (!actor || !can(actor, "staff.accounts.manage")) {
      accounts = []
      notify()
      return
    }
    accounts = local
      ? await local.list(actor)
      : await request<StaffAccount[]>("/staff/accounts")
    notify()
  },
  async manage(
    action: "create" | "reset" | "update" | "remove",
    input: Partial<AccountInput> & {
      id?: string
      confirmationPassword: string
    },
  ) {
    const actor = requireManager()
    let account!: StaffAccount
    let delivery: AccountDelivery | undefined
    if (local) {
      if (!(await local.valid(actor, version)))
        throw Error("Your session is no longer valid. Sign in again.")
      await local.reauthenticate(actor, input.confirmationPassword)
      if (action === "create")
        delivery = await local.create(actor, input as AccountInput)
      else if (action === "reset")
        delivery = await local.reset(actor, input.id!)
      else if (action === "remove")
        account = await local.remove(actor, input.id!)
      else
        account = await local.update(
          actor,
          input.id!,
          input.name || "",
          input.email || "",
          input.role as StaffRole,
        )
      if (delivery) account = delivery.account
    } else {
      const path =
        action === "create"
          ? "/staff/accounts"
          : `/staff/accounts/${encodeURIComponent(input.id || "")}${action === "reset" ? "/reset-password" : ""}`
      const result = await request<StaffAccount | AccountDelivery>(
        path,
        action === "remove" ? "DELETE" : action === "update" ? "PATCH" : "POST",
        input,
      )
      if ("account" in result) {
        delivery = result
        account = result.account
      } else account = result
    }
    staffAuditService.recordAccount(
      actor,
      `${action === "create" ? "Administrator invitation queued" : action === "reset" ? "Password reset invitation queued; existing sessions revoked" : action === "remove" ? "Administrator access removed; audit history retained" : "Administrator name / role updated; existing sessions revoked"}: ${account.name}`,
      account.id,
    )
    await staffAuthService.loadAccounts()
    return {
      account,
      delivery: delivery?.delivery,
      previewInvitation: local ? delivery?.previewInvitation : undefined,
    }
  },
  async changePassword(currentPassword: string, password: string) {
    const actor = sessionService.getSnapshot()
    if (!actor || actor.kind !== "staff")
      throw Error("Sign in before changing your password.")
    if (local) {
      if (!(await local.valid(actor, version)))
        throw Error("Your session has expired.")
      await local.changePassword(actor, currentPassword, password)
    } else
      await request<void>("/auth/password", "POST", {
        currentPassword,
        password,
      })
    staffAuditService.recordAccount(
      actor,
      "Own password changed; sessions revoked",
      actor.id,
    )
    await staffAuthService.logout()
  },
  async validateSession() {
    const actor = sessionService.getSnapshot()
    if (
      local &&
      actor?.kind === "staff" &&
      !(await local.valid(actor, version))
    )
      await staffAuthService.logout()
    if (!local && actor?.kind === "staff") {
      const result = await request<{ actor: Actor; accountVersion: number }>(
        "/auth/session",
      )
      if (
        result.actor.id !== actor.id ||
        result.actor.roles.join() !== actor.roles.join() ||
        result.accountVersion !== version
      )
        await staffAuthService.logout()
    }
  },
  restoreOnce() {
    return (restoring ??= staffAuthService.restore())
  },
}
