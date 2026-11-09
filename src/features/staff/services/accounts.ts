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
export type AccountInput = { name?: string; email: string; role: StaffRole }
export type EmailChallenge = {
  id: string
  email: string
  expiresAt: string
  resendAvailableAt: string
}
export type PasswordInvitation = {
  email: string
  expiresAt: string
  purpose: "invitation" | "reset"
}
export type PreviewInvitation = PasswordInvitation & { token: string }
export type AccountDelivery = {
  account: StaffAccount
  delivery: "queued"
  previewInvitation?: PreviewInvitation
}
export type LoginResult = { challenge: EmailChallenge }
type Secret = { salt: string; hash: string }
type Challenge = EmailChallenge & {
  accountId: string
  version: number
  code: string
  attempts: number
}
type Invitation = PreviewInvitation & { accountId: string; version: number }
export const accountPolicy = {
  minimumPasswordLength: 8,
  maximumPasswordLength: 128,
  invitationLifetimeMs: 86400000,
  codeLifetimeMs: 600000,
  resendCooldownMs: 30000,
  maximumCodeAttempts: 5,
}
const roles: StaffRole[] = ["super_admin", "membership_admin", "finance_admin"]
const normalizeEmail = (email: string) => email.trim().toLowerCase()
function passwordRule(password: string) {
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[A-Za-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9\s]/.test(password)
  )
    throw Error("Use 8–128 characters with a letter, a number and a symbol.")
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
// UI development adapter only. Credentials, invitation links and OTPs stay in memory.
export function createLocalAccounts(
  now = () => Date.now(),
  options: { previewCode?: string } = {},
) {
  let accounts: StaffAccount[] = []
  const secrets = new Map<string, Secret>(),
    challenges = new Map<string, Challenge>(),
    invitations = new Map<string, Invitation>()
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
    for (const [key, value] of invitations)
      if (value.accountId === id) invitations.delete(key)
  }
  const makeInvitation = (
    account: StaffAccount,
    purpose: PasswordInvitation["purpose"],
  ): AccountDelivery => {
    revokeChallenges(account.id)
    const invitation: Invitation = {
      token: crypto.randomUUID() + crypto.randomUUID(),
      email: account.email,
      expiresAt: new Date(
        now() + accountPolicy.invitationLifetimeMs,
      ).toISOString(),
      purpose,
      accountId: account.id,
      version: account.credentialVersion,
    }
    invitations.set(invitation.token, invitation)
    const { token, email, expiresAt } = invitation
    return {
      account: structuredClone(account),
      delivery: "queued",
      previewInvitation: { token, email, expiresAt, purpose },
    }
  }
  const getInvitation = (token: string) => {
    const invitation = invitations.get(token)
    if (!invitation || Date.parse(invitation.expiresAt) <= now())
      throw Error(
        "This link has expired or has already been used. Ask your Super Admin for a new invitation.",
      )
    const account = accountById(invitation.accountId)
    if (
      account.credentialVersion !== invitation.version ||
      account.status !== "Setup required"
    )
      throw Error(
        "This invitation is no longer valid. Ask your Super Admin for a new link.",
      )
    return { invitation, account }
  }
  const makeChallenge = (account: StaffAccount): LoginResult => {
    for (const [id, challenge] of challenges)
      if (challenge.accountId === account.id) challenges.delete(id)
    const challenge: Challenge = {
      id: crypto.randomUUID(),
      accountId: account.id,
      version: account.credentialVersion,
      email: account.email,
      code:
        options.previewCode ||
        String(
          crypto.getRandomValues(new Uint32Array(1))[0] % 1000000,
        ).padStart(6, "0"),
      expiresAt: new Date(now() + accountPolicy.codeLifetimeMs).toISOString(),
      resendAvailableAt: new Date(
        now() + accountPolicy.resendCooldownMs,
      ).toISOString(),
      attempts: 0,
    }
    challenges.set(challenge.id, challenge)
    const { id, email, expiresAt, resendAvailableAt } = challenge
    return { challenge: { id, email, expiresAt, resendAvailableAt } }
  }
  const getChallenge = (id: string) => {
    const challenge = challenges.get(id)
    if (
      !challenge ||
      Date.parse(challenge.expiresAt) <= now() ||
      challenge.attempts >= accountPolicy.maximumCodeAttempts
    )
      throw Error("This code has expired. Sign in again to request a new code.")
    const account = accountById(challenge.accountId)
    if (
      account.status !== "Active" ||
      account.credentialVersion !== challenge.version
    )
      throw Error("This login request is no longer valid. Sign in again.")
    return { challenge, account }
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
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !roles.includes(input.role)
      )
        throw Error("Enter a valid email and administrator role.")
      if (accounts.some((a) => a.email === email && a.status !== "Removed"))
        throw Error("This email already belongs to an administrator account.")
      const account: StaffAccount = {
        id: crypto.randomUUID(),
        name: input.name?.trim() || email.split("@")[0],
        email,
        role: input.role,
        status: "Setup required",
        createdAt: new Date(now()).toISOString(),
        credentialVersion: 1,
      }
      accounts = [...accounts, account]
      return makeInvitation(account, "invitation")
    },
    async invitation(token: string): Promise<PasswordInvitation> {
      const { invitation } = getInvitation(token)
      return {
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        purpose: invitation.purpose,
      }
    },
    async completeSetup(token: string, password: string) {
      const { invitation, account } = getInvitation(token)
      passwordRule(password)
      const secret = await hashPassword(password)
      getInvitation(token)
      secrets.set(account.id, secret)
      account.status = "Active"
      account.credentialVersion = invitation.version + 1
      revokeChallenges(account.id)
      return structuredClone(account)
    },
    async login(email: string, password: string): Promise<LoginResult> {
      await boot()
      const account = accounts.find(
        (a) => a.email === normalizeEmail(email) && a.status === "Active",
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
        account.status !== "Active" ||
        secrets.get(account.id) !== secret
      )
        throw Error("Email or password is incorrect, or access is unavailable.")
      return makeChallenge(account)
    },
    async verifyLogin(id: string, code: string) {
      const { challenge, account } = getChallenge(id)
      if (code.trim() !== challenge.code) {
        challenge.attempts++
        throw Error("The verification code is incorrect.")
      }
      challenges.delete(id)
      account.lastLoginAt = new Date(now()).toISOString()
      return { actor: identity(account) }
    },
    async resendLogin(id: string) {
      const { challenge, account } = getChallenge(id)
      if (Date.parse(challenge.resendAvailableAt) > now())
        throw Error("Please wait before requesting another code.")
      return makeChallenge(account)
    },
    async reset(actor: Actor, id: string) {
      await boot()
      requireManager(actor)
      const account = accountById(id)
      if (id === actor.id)
        throw Error("Use Change your password for your own account.")
      account.status = "Setup required"
      account.credentialVersion++
      secrets.delete(id)
      return makeInvitation(account, "reset")
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
  }
}
