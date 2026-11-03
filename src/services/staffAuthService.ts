import { localStaffAuthentication, staffApiBase } from "@/config/deployment"
import { can } from "@/config/permissions"
import {
  createLocalAccounts,
  type StaffAccount,
  type AccountInput,
  type LoginResult,
  type SetupChallenge,
} from "@/features/staff/services/accounts"
import type { Actor, StaffRole } from "@/features/membership/types/workspace"
import { sessionService } from "./sessionService"
import { staffAuditService } from "./staffAuditService"

const local = localStaffAuthentication
  ? createLocalAccounts(undefined, { skipEmailVerification: true })
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
    throw Error(
      response.status === 401
        ? "Email or password is incorrect, or the session has expired."
        : response.status === 403
          ? "This account is not authorised for this action."
          : "The administrator service could not complete the request.",
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
  skipEmailVerification: localStaffAuthentication,
  getAccountsSnapshot: () => accounts,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  async login(
    email: string,
    password: string,
  ): Promise<{ challenge?: SetupChallenge }> {
    if (sessionService.getSnapshot()?.kind === "staff")
      await staffAuthService.logout()
    if (local) {
      const result = await local.login(email, password)
      if ("challenge" in result) return result
      await accept(result.actor, await local.version(result.actor.id))
      return {}
    }
    const result = await request<
      LoginResult & { accountVersion?: number; csrfToken?: string }
    >("/auth/login", "POST", { email, password })
    if ("challenge" in result) return result
    await accept(result.actor, result.accountVersion || 0, result.csrfToken)
    return {}
  },
  async completeSetup(
    challenge: SetupChallenge,
    code: string,
    password: string,
  ) {
    if (local) {
      const account = await local.completeSetup(challenge.id, code, password)
      staffAuditService.recordAccount(
        {
          id: account.id,
          name: account.name,
          kind: "staff",
          roles: [account.role],
        },
        "Local testing: private password established without email verification; temporary password invalidated",
        account.id,
      )
    } else
      await request<void>("/auth/password/setup", "POST", {
        challengeId: challenge.id,
        code,
        password,
      })
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
    let account: StaffAccount
    if (local) {
      if (!(await local.valid(actor, version)))
        throw Error("Your session is no longer valid. Sign in again.")
      await local.reauthenticate(actor, input.confirmationPassword)
      if (action === "create")
        account = await local.create(actor, input as AccountInput)
      else if (action === "reset")
        account = await local.reset(
          actor,
          input.id!,
          input.temporaryPassword || "",
        )
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
    } else {
      const path =
        action === "create"
          ? "/staff/accounts"
          : `/staff/accounts/${encodeURIComponent(input.id || "")}${action === "reset" ? "/reset-password" : ""}`
      account = await request<StaffAccount>(
        path,
        action === "remove" ? "DELETE" : action === "update" ? "PATCH" : "POST",
        input,
      )
    }
    staffAuditService.recordAccount(
      actor,
      `${action === "create" ? "Administrator created" : action === "reset" ? "Temporary password reset issued; existing sessions revoked" : action === "remove" ? "Administrator access removed; audit history retained" : "Administrator name / role updated; existing sessions revoked"}: ${account.name}`,
      account.id,
    )
    await staffAuthService.loadAccounts()
    return account
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
  previewCode: (id: string) => local?.codeForPreview(id),
  restoreOnce() {
    return (restoring ??= staffAuthService.restore())
  },
}
