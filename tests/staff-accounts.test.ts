import test from "node:test"
import assert from "node:assert/strict"
import {
  createLocalAccounts,
  accountPolicy,
} from "../src/features/staff/services/accounts.ts"
import type { Actor } from "../src/features/membership/types/workspace.ts"
const admin: Actor = {
  id: "ispau-super",
  name: "ISPAU Super Admin",
  kind: "staff",
  roles: ["super_admin"],
}
const input = {
  email: "membership@ispau.example",
  role: "membership_admin" as const,
}
const password = "Private-Member-2026!"
const seedPassword = "ISPAU-Preview-2026!"
const makeStore = () =>
  createLocalAccounts(undefined, { previewCode: "123456" })

test("email-only creation issues a single-use invitation and password setup does not sign in", async () => {
  const store = makeStore()
  const created = await store.create(admin, input)
  assert.equal(created.account.status, "Setup required")
  assert.equal("temporaryPassword" in created, false)
  const token = created.previewInvitation!.token
  assert.equal((await store.invitation(token)).email, input.email)
  await assert.rejects(store.login(input.email, "anything"), /incorrect/)
  await assert.rejects(store.completeSetup(token, "short"), /8–128/)
  const account = await store.completeSetup(token, password)
  assert.equal(account.status, "Active")
  assert.equal(account.lastLoginAt, undefined)
  await assert.rejects(store.invitation(token), /expired|used/)
  await assert.rejects(store.completeSetup(token, password), /expired|used/)
  const result = await store.login(input.email.toUpperCase(), password)
  assert.equal("actor" in result, false)
  assert.ok(result.challenge)
  const verified = await store.verifyLogin(result.challenge.id, "123456")
  assert.deepEqual(verified.actor.roles, ["membership_admin"])
  assert.equal(verified.actor.id, account.id)
  assert.ok(
    (await store.list(admin)).find((a) => a.id === account.id)?.lastLoginAt,
  )
  await assert.rejects(
    store.verifyLogin(result.challenge.id, "123456"),
    /expired/,
  )
  const metadata = JSON.stringify(await store.list(admin))
  for (const secret of [password, token, '"hash"', '"salt"', "123456"])
    assert.equal(metadata.includes(secret), false)
})

test("all roles including Super Admin require password then OTP", async () => {
  const store = makeStore()
  await assert.rejects(
    store.login("superadmin@ispau.example", "wrong"),
    /incorrect/,
  )
  const login = await store.login("superadmin@ispau.example", seedPassword)
  assert.equal("actor" in login, false)
  await assert.rejects(
    store.verifyLogin(login.challenge.id, "000000"),
    /incorrect/,
  )
  const result = await store.verifyLogin(login.challenge.id, "123456")
  assert.deepEqual(result.actor.roles, ["super_admin"])
  for (const role of [
    "membership_admin",
    "finance_admin",
    "super_admin",
  ] as const) {
    const created = await store.create(admin, {
      email: `${role}@ispau.example`,
      role,
    })
    await store.completeSetup(created.previewInvitation!.token, password)
    const pending = await store.login(created.account.email, password)
    assert.equal("actor" in pending, false)
    assert.deepEqual(
      (await store.verifyLogin(pending.challenge.id, "123456")).actor.roles,
      [role],
    )
  }
})

test("resend cooldown, attempt limit and expiry are enforced; old challenge cannot be reused", async () => {
  let time = Date.parse("2026-11-09T09:00:00Z")
  const store = createLocalAccounts(() => time, { previewCode: "123456" })
  const first = await store.login("superadmin@ispau.example", seedPassword)
  await assert.rejects(store.resendLogin(first.challenge.id), /wait/)
  time += accountPolicy.resendCooldownMs
  const second = await store.resendLogin(first.challenge.id)
  assert.notEqual(second.challenge.id, first.challenge.id)
  await assert.rejects(
    store.verifyLogin(first.challenge.id, "123456"),
    /expired/,
  )
  for (let attempt = 0; attempt < accountPolicy.maximumCodeAttempts; attempt++)
    await assert.rejects(
      store.verifyLogin(second.challenge.id, "000000"),
      /incorrect/,
    )
  await assert.rejects(
    store.verifyLogin(second.challenge.id, "123456"),
    /expired/,
  )
  const third = await store.login("superadmin@ispau.example", seedPassword)
  time += accountPolicy.codeLifetimeMs + 1
  await assert.rejects(
    store.verifyLogin(third.challenge.id, "123456"),
    /expired/,
  )
})

test("only Super Admin manages accounts; reset revokes sessions, OTPs and previous invitation links", async () => {
  const store = makeStore()
  const created = await store.create(admin, input)
  const oldToken = created.previewInvitation!.token
  const resent = await store.reset(admin, created.account.id)
  await assert.rejects(store.completeSetup(oldToken, password), /expired/)
  await store.completeSetup(resent.previewInvitation!.token, password)
  const login = await store.login(input.email, password)
  const actor = (await store.verifyLogin(login.challenge.id, "123456")).actor
  const version = await store.version(actor.id)
  await assert.rejects(
    store.create(actor, { ...input, email: "other@ispau.example" }),
    /Super Admin/,
  )
  await assert.rejects(store.list(actor), /Super Admin/)
  await assert.rejects(store.reset(actor, admin.id), /Super Admin/)
  const pending = await store.login(input.email, password)
  const reset = await store.reset(admin, actor.id)
  assert.equal(await store.valid(actor, version), false)
  await assert.rejects(
    store.verifyLogin(pending.challenge.id, "123456"),
    /expired/,
  )
  await assert.rejects(store.login(input.email, password), /incorrect/)
  await store.completeSetup(reset.previewInvitation!.token, "Replacement-2026!")
  assert.ok((await store.login(input.email, "Replacement-2026!")).challenge)
})

test("invitations expire, duplicates are rejected and login email cannot be silently changed", async () => {
  let time = Date.now()
  const store = createLocalAccounts(() => time)
  const created = await store.create(admin, input)
  await assert.rejects(store.create(admin, input), /already belongs/)
  await assert.rejects(
    store.update(
      admin,
      created.account.id,
      "Officer",
      "other@ispau.example",
      input.role,
    ),
    /verified account recovery/,
  )
  time += accountPolicy.invitationLifetimeMs + 1
  await assert.rejects(
    store.invitation(created.previewInvitation!.token),
    /expired/,
  )
  await assert.rejects(
    store.completeSetup(created.previewInvitation!.token, password),
    /expired/,
  )
})

test("removed accounts cannot use invitations or pending login OTPs; audit identity is retained", async () => {
  const store = makeStore()
  const created = await store.create(admin, input)
  await store.completeSetup(created.previewInvitation!.token, password)
  const pending = await store.login(input.email, password)
  await store.remove(admin, created.account.id)
  await assert.rejects(
    store.verifyLogin(pending.challenge.id, "123456"),
    /expired/,
  )
  await assert.rejects(store.login(input.email, password), /incorrect/)
  await assert.rejects(store.reset(admin, created.account.id), /unavailable/)
  const record = (await store.list(admin)).find(
    (a) => a.id === created.account.id,
  )!
  assert.equal(record.status, "Removed")
  assert.equal(record.email, input.email)
  assert.notEqual(
    (await store.create(admin, input)).account.id,
    created.account.id,
  )
  await assert.rejects(store.remove(admin, admin.id), /own account/)
})

test("password changes require current password, enforce policy and revoke sessions and pending OTPs", async () => {
  const store = makeStore()
  const version = await store.version(admin.id)
  const pending = await store.login("superadmin@ispau.example", seedPassword)
  await assert.rejects(
    store.changePassword(admin, "wrong", password),
    /incorrect/,
  )
  for (const bad of [
    "short",
    "onlyletterslong",
    "Numbers1234",
    "SymbolsOnly!!!!",
  ])
    await assert.rejects(
      store.changePassword(admin, seedPassword, bad),
      /8–128/,
    )
  await store.changePassword(admin, seedPassword, password)
  assert.equal(await store.valid(admin, version), false)
  await assert.rejects(
    store.verifyLogin(pending.challenge.id, "123456"),
    /expired/,
  )
  await assert.rejects(
    store.login("superadmin@ispau.example", seedPassword),
    /incorrect/,
  )
  assert.ok((await store.login("superadmin@ispau.example", password)).challenge)
})
