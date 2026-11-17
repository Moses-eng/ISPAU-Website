import type { Actor, StaffRole } from "../../membership/types/workspace.ts"
import { can } from "../../../config/permissions.ts"

export type StaffAccount = {
  id: string
  name: string
  email: string
  role: StaffRole
  status: "Active" | "Setup required" | "Removed"
  createdAt: string
  lastLoginAt?: string
  credentialVersion: number
}
export type AccountInput = {
  name: string
  email: string
  role: StaffRole
  temporaryPassword: string
}
export type SetupChallenge = { id: string; email: string; expiresAt: string }
export type LoginResult = { actor: Actor } | { challenge: SetupChallenge }
type Secret = { salt: string; hash: string; temporaryExpiresAt?: number }
type Challenge = SetupChallenge & {
  accountId: string
  version: number
  code: string
  attempts: number
}
export const accountPolicy = {
  minimumPasswordLength: 15,
  maximumPasswordLength: 128,
  minimumTemporaryLength: 8,
  temporaryLifetimeMs: 86400000,
  codeLifetimeMs: 600000,
  maximumCodeAttempts: 5,
}
const roles: StaffRole[] = ["super_admin", "membership_admin", "finance_admin"]
const normalizeEmail = (email: string) => email.trim().toLowerCase()
function passwordRule(password: string, temporary = false) {
  const minimum = temporary
    ? accountPolicy.minimumTemporaryLength
    : accountPolicy.minimumPasswordLength
  if (
    password.length < minimum ||
    password.length > accountPolicy.maximumPasswordLength ||
    !password.trim()
  )
    throw Error(
      `Use ${minimum} to ${accountPolicy.maximumPasswordLength} characters for ${temporary ? "the temporary" : "your new"} password.`,
    )
}
async function hashPassword(
  password: string,
  salt: string = crypto.randomUUID(),
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 600000,
      hash: "SHA-256",
    },
    key,
    256,
  )
  return {
    salt,
    hash: [...new Uint8Array(bits)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(""),
  }
}
const identity = (a: StaffAccount): Actor => ({
  id: a.id,
  name: a.name,
  kind: "staff",
  roles: [a.role],
})

// Development adapter only. Password material and verification codes stay in memory.
export function createLocalAccounts(
  now = () => Date.now(),
  options: { skipEmailVerification?: boolean } = {},
) {
  let accounts: StaffAccount[] = []
  const secrets = new Map<string, Secret>(),
    challenges = new Map<string, Challenge>()
  const mailbox = new Map<string, string>()
  let ready: Promise<void> | undefined
  const boot = () =>
    (ready ??= (async () => {
      const account: StaffAccount = {
        id: "ispau-super",
        name: "ISPAU Super Admin",
        email: "superadmin@ispau.example",
        role: "super_admin",
        status: "Active",
        createdAt: new Date(now()).toISOString(),
        credentialVersion: 1,
      }
      secrets.set(account.id, await hashPassword("ISPAU-Preview-2026!"))
      accounts = [account]
    })())
  const requireManager = (actor: Actor) => {
    if (
      !can(actor, "staff.accounts.manage") ||
      !accounts.some(
        (a) =>
          a.id === actor.id &&
          a.role === "super_admin" &&
          a.status === "Active",
      )
    )
      throw Error(
        "Only an active Super Admin can manage administrator accounts.",
      )
  }
  const accountById = (id: string) => {
    const account = accounts.find((a) => a.id === id && a.status !== "Removed")
    if (!account) throw Error("Administrator account unavailable.")
    return account
  }
  const revokeChallenges = (id: string) => {
    for (const [key, value] of challenges)
      if (value.accountId === id) challenges.delete(key)
  }
  const makeChallenge = (a: StaffAccount): SetupChallenge => {
    revokeChallenges(a.id)
    const bytes = crypto.getRandomValues(new Uint32Array(1))
    const code = String(bytes[0] % 1000000).padStart(6, "0")
    const challenge: Challenge = {
      id: crypto.randomUUID(),
      email: a.email,
      expiresAt: new Date(now() + accountPolicy.codeLifetimeMs).toISOString(),
      accountId: a.id,
      version: a.credentialVersion,
      code,
      attempts: 0,
    }
    challenges.set(challenge.id, challenge)
    mailbox.set(challenge.id, code)
    return {
      id: challenge.id,
      email: challenge.email,
      expiresAt: challenge.expiresAt,
    }
  }
  return {
    async list(actor: Actor) {
      await boot()
      requireManager(actor)
      return structuredClone(accounts)
    },
    async create(actor: Actor, input: AccountInput) {
      await boot()
      requireManager(actor)
      const email = normalizeEmail(input.email)
      if (
        !input.name.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !roles.includes(input.role)
      )
        throw Error("Enter a name, valid email and administrator role.")
      if (accounts.some((a) => a.email === email && a.status !== "Removed"))
        throw Error("This email already belongs to an administrator account.")
      passwordRule(input.temporaryPassword, true)
      const secret = await hashPassword(input.temporaryPassword)
      const account: StaffAccount = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        email,
        role: input.role,
        status: "Setup required",
        createdAt: new Date(now()).toISOString(),
        credentialVersion: 1,
      }
      secrets.set(account.id, {
        ...secret,
        temporaryExpiresAt: now() + accountPolicy.temporaryLifetimeMs,
      })
      accounts = [...accounts, account]
      return structuredClone(account)
    },
    async login(email: string, password: string): Promise<LoginResult> {
      await boot()
      const account = accounts.find(
        (a) => a.email === normalizeEmail(email) && a.status !== "Removed",
      )
      const secret = account && secrets.get(account.id)
      const candidate = await hashPassword(
        password,
        secret?.salt || "unmatched-account",
      )
      if (
        !account ||
        !secret ||
        secret.hash !== candidate.hash ||
        (secret.temporaryExpiresAt && secret.temporaryExpiresAt <= now())
      )
        throw Error("Email or password is incorrect, or access is unavailable.")
      if (account.status === "Setup required")
        return { challenge: makeChallenge(account) }
      account.lastLoginAt = new Date(now()).toISOString()
      return { actor: identity(account) }
    },
    async completeSetup(id: string, code: string, password: string) {
      const challenge = challenges.get(id)
      if (
        !challenge ||
        (!options.skipEmailVerification &&
          (Date.parse(challenge.expiresAt) <= now() ||
            challenge.attempts >= accountPolicy.maximumCodeAttempts))
      )
        throw Error(
          "The verification code has expired. Sign in again to request another code.",
        )
      const account = accountById(challenge.accountId)
      if (
        account.credentialVersion !== challenge.version ||
        account.status !== "Setup required"
      )
        throw Error("This setup request is no longer valid. Sign in again.")
      if (!options.skipEmailVerification && code.trim() !== challenge.code) {
        challenge.attempts++
        throw Error("The verification code is incorrect.")
      }
      passwordRule(password)
      const previous = secrets.get(account.id)!
      if ((await hashPassword(password, previous.salt)).hash === previous.hash)
        throw Error(
          "Choose a private password different from the temporary password.",
        )
      const secret = await hashPassword(password)
      if (
        account.status !== "Setup required" ||
        account.credentialVersion !== challenge.version
      )
        throw Error("This setup request is no longer valid.")
      secrets.set(account.id, secret)
      account.status = "Active"
      account.credentialVersion++
      revokeChallenges(account.id)
      mailbox.delete(id)
      return structuredClone(account)
    },
    async reset(actor: Actor, id: string, temporaryPassword: string) {
      await boot()
      requireManager(actor)
      const account = accountById(id)
      if (id === actor.id)
        throw Error("Use Change your password for your own account.")
      passwordRule(temporaryPassword, true)
      secrets.set(id, {
        ...(await hashPassword(temporaryPassword)),
        temporaryExpiresAt: now() + accountPolicy.temporaryLifetimeMs,
      })
      account.status = "Setup required"
      account.credentialVersion++
      revokeChallenges(id)
      return structuredClone(account)
    },
    async update(
      actor: Actor,
      id: string,
      name: string,
      email: string,
      role: StaffRole,
    ) {
      await boot()
      requireManager(actor)
      const account = accountById(id)
      if (id === actor.id)
        throw Error(
          "Another Super Admin must change your administrator assignment.",
        )
      if (!name.trim() || !roles.includes(role))
        throw Error("Enter a name and valid role.")
      // Changing a verified recovery email would undermine the email confirmation step.
      if (normalizeEmail(email) !== account.email)
        throw Error(
          "Login email changes require verified account recovery through ISPAU. Existing email addresses cannot be silently replaced.",
        )
      if (
        account.role === "super_admin" &&
        account.status === "Active" &&
        role !== "super_admin" &&
        accounts.filter(
          (a) => a.role === "super_admin" && a.status === "Active",
        ).length <= 1
      )
        throw Error("Keep at least one active Super Admin.")
      account.name = name.trim()
      account.role = role
      account.credentialVersion++
      revokeChallenges(id)
      return structuredClone(account)
    },
    async remove(actor: Actor, id: string) {
      await boot()
      requireManager(actor)
      const account = accountById(id)
      if (id === actor.id) throw Error("You cannot remove your own account.")
      if (
        account.role === "super_admin" &&
        account.status === "Active" &&
        accounts.filter(
          (a) => a.role === "super_admin" && a.status === "Active",
        ).length <= 1
      )
        throw Error("Keep at least one active Super Admin.")
      account.status = "Removed"
      account.credentialVersion++
      secrets.delete(id)
      revokeChallenges(id)
      return structuredClone(account)
    },
    async changePassword(
      actor: Actor,
      currentPassword: string,
      password: string,
    ) {
      await boot()
      const account = accountById(actor.id),
        old = secrets.get(account.id)!
      if ((await hashPassword(currentPassword, old.salt)).hash !== old.hash)
        throw Error("The current password is incorrect.")
      passwordRule(password)
      if (password === currentPassword)
        throw Error("Choose a different new password.")
      secrets.set(account.id, await hashPassword(password))
      account.credentialVersion++
      revokeChallenges(account.id)
      return structuredClone(account)
    },
    async reauthenticate(actor: Actor, password: string) {
      await boot()
      const account = accountById(actor.id),
        secret = secrets.get(account.id)!
      if (
        account.status !== "Active" ||
        (await hashPassword(password, secret.salt)).hash !== secret.hash
      )
        throw Error("Your administrator password is incorrect.")
    },
    async valid(actor: Actor, version: number) {
      await boot()
      return accounts.some(
        (a) =>
          a.id === actor.id &&
          a.status === "Active" &&
          a.credentialVersion === version &&
          a.role === actor.roles[0],
      )
    },
    async version(id: string) {
      await boot()
      return accountById(id).credentialVersion
    },
    codeForPreview(id: string) {
      return mailbox.get(id)
    },
  }
}
