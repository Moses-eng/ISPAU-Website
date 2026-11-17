import test from "node:test"
import assert from "node:assert/strict"
import { createLocalAccounts } from "../src/features/staff/services/accounts.ts"
import type { Actor } from "../src/features/membership/types/workspace.ts"
const admin: Actor = {
  id: "ispau-super",
  name: "ISPAU Super Admin",
  kind: "staff",
  roles: ["super_admin"],
}
const input = {
  name: "Membership officer",
  email: "membership@ispau.example",
  role: "membership_admin" as const,
  temporaryPassword: "Join-Preview-1234",
}

test("explicit local-testing mode sets a private password without a code while keeping the setup gate", async () => {
  const store = createLocalAccounts(undefined, { skipEmailVerification: true })
  const account = await store.create(admin, input)
  const result = await store.login(input.email, input.temporaryPassword)
  assert.ok("challenge" in result)
  assert.equal("actor" in result, false)
  if (!("challenge" in result)) throw Error("Expected password setup")
  await assert.rejects(
    store.completeSetup(result.challenge.id, "", "short"),
    /15/,
  )
  await store.completeSetup(
    result.challenge.id,
    "",
    "A private local testing password",
  )
  const login = await store.login(
    input.email,
    "A private local testing password",
  )
  assert.ok("actor" in login)
  if ("actor" in login) assert.equal(login.actor.id, account.id)
  await assert.rejects(
    store.login(input.email, input.temporaryPassword),
    /incorrect/,
  )
})

test("one login authenticates assigned roles; temporary credentials only grant a setup challenge", async () => {
  const store = createLocalAccounts()
  assert.equal((await store.list(admin)).length, 1)
  const created = await store.create(admin, input)
  assert.equal(created.status, "Setup required")
  assert.equal(created.email, input.email)
  const result = await store.login(
    input.email.toUpperCase(),
    input.temporaryPassword,
  )
  assert.ok("challenge" in result)
  assert.equal("actor" in result, false)
  if (!("challenge" in result)) throw Error("Expected a setup challenge")
  assert.equal(
    JSON.stringify(result).includes(store.codeForPreview(result.challenge.id)!),
    false,
  )
  await assert.rejects(
    store.completeSetup(
      result.challenge.id,
      "incorrect",
      "A private member password",
    ),
    /incorrect/,
  )
  await assert.rejects(
    store.completeSetup(
      result.challenge.id,
      store.codeForPreview(result.challenge.id)!,
      input.temporaryPassword,
    ),
    /different/,
  )
  const changed = await store.completeSetup(
    result.challenge.id,
    store.codeForPreview(result.challenge.id)!,
    "A private member password",
  )
  assert.equal(changed.status, "Active")
  await assert.rejects(
    store.login(input.email, input.temporaryPassword),
    /incorrect/,
  )
  const login = await store.login(input.email, "A private member password")
  assert.ok("actor" in login)
  if (!("actor" in login)) throw Error("Expected a full identity")
  assert.deepEqual(login.actor.roles, ["membership_admin"])
  await assert.rejects(
    store.completeSetup(
      result.challenge.id,
      "000000",
      "Another private password",
    ),
    /expired/,
  )
  const metadata = JSON.stringify(await store.list(admin))
  assert.equal(metadata.includes("A private member password"), false)
  assert.equal(metadata.includes(input.temporaryPassword), false)
  assert.equal(metadata.includes('"hash"'), false)
})

test("only Super Admin manages accounts; reset revokes sessions and requires email verification again", async () => {
  const store = createLocalAccounts(),
    account = await store.create(admin, input)
  const login = await store.login(input.email, input.temporaryPassword)
  if (!("challenge" in login)) throw Error("Expected setup")
  await store.completeSetup(
    login.challenge.id,
    store.codeForPreview(login.challenge.id)!,
    "A private member password",
  )
  const actor: Actor = {
    id: account.id,
    name: account.name,
    kind: "staff",
    roles: ["membership_admin"],
  }
  const version = await store.version(account.id)
  assert.equal(await store.valid(actor, version), true)
  await assert.rejects(
    store.create(actor, { ...input, email: "other@ispau.example" }),
    /Super Admin/,
  )
  await assert.rejects(store.list(actor), /Super Admin/)
  await assert.rejects(
    store.reset(actor, admin.id, "New-temporary-123"),
    /Super Admin/,
  )
  await store.reset(admin, account.id, "Reset-Preview-1234")
  assert.equal(await store.valid(actor, version), false)
  await assert.rejects(
    store.login(input.email, "A private member password"),
    /incorrect/,
  )
  const resetLogin = await store.login(input.email, "Reset-Preview-1234")
  assert.ok("challenge" in resetLogin)
  assert.equal("actor" in resetLogin, false)
  await assert.rejects(
    store.reauthenticate(admin, "wrong-password"),
    /incorrect/,
  )
})

test("deleted accounts lose access while stable account identity and audit attribution remain", async () => {
  const store = createLocalAccounts(),
    created = await store.create(admin, input)
  const audit = {
    actorId: created.id,
    actorName: created.name,
    event: "Earlier membership review",
  }
  await store.remove(admin, created.id)
  assert.equal(
    (await store.list(admin)).find((a) => a.id === created.id)?.status,
    "Removed",
  )
  assert.equal(
    (await store.list(admin)).find((a) => a.id === audit.actorId)?.name,
    audit.actorName,
  )
  assert.deepEqual(audit, {
    actorId: created.id,
    actorName: input.name,
    event: "Earlier membership review",
  })
  await assert.rejects(
    store.login(input.email, input.temporaryPassword),
    /incorrect/,
  )
  await assert.rejects(
    store.reset(admin, created.id, "Reset-Preview-1234"),
    /unavailable/,
  )
  const replacement = await store.create(admin, input)
  assert.notEqual(replacement.id, created.id)
  assert.equal(
    (await store.list(admin)).find((a) => a.id === created.id)?.status,
    "Removed",
  )
  await assert.rejects(store.remove(admin, admin.id), /own account/)
})

test("email recovery cannot be silently redirected; code attempts, expiry and resets invalidate old challenges", async () => {
  let time = Date.parse("2026-11-03T08:00:00Z")
  const store = createLocalAccounts(() => time),
    created = await store.create(admin, input)
  await assert.rejects(
    store.update(
      admin,
      created.id,
      created.name,
      "attacker@ispau.example",
      created.role,
    ),
    /verified account recovery/,
  )
  const first = await store.login(input.email, input.temporaryPassword)
  if (!("challenge" in first)) throw Error("Expected setup")
  const oldCode = store.codeForPreview(first.challenge.id)!
  await store.reset(admin, created.id, "Reset-Preview-1234")
  await assert.rejects(
    store.completeSetup(
      first.challenge.id,
      oldCode,
      "A private member password",
    ),
    /expired/,
  )
  const second = await store.login(input.email, "Reset-Preview-1234")
  if (!("challenge" in second)) throw Error("Expected setup")
  for (let i = 0; i < 5; i++)
    await assert.rejects(
      store.completeSetup(
        second.challenge.id,
        "wrong",
        "A private member password",
      ),
      /incorrect/,
    )
  await assert.rejects(
    store.completeSetup(
      second.challenge.id,
      store.codeForPreview(second.challenge.id)!,
      "A private member password",
    ),
    /expired/,
  )
  const third = await store.login(input.email, "Reset-Preview-1234")
  if (!("challenge" in third)) throw Error("Expected setup")
  time += 600001
  await assert.rejects(
    store.completeSetup(
      third.challenge.id,
      store.codeForPreview(third.challenge.id)!,
      "A private member password",
    ),
    /expired/,
  )
  time += 86400000
  await assert.rejects(
    store.login(input.email, "Reset-Preview-1234"),
    /incorrect/,
  )
})

test("a staff member changes their own password with current-password proof and old session revocation", async () => {
  const store = createLocalAccounts()
  const oldVersion = await store.version(admin.id)
  await assert.rejects(
    store.changePassword(admin, "wrong", "A new private administrator phrase"),
    /incorrect/,
  )
  await assert.rejects(
    store.changePassword(admin, "ISPAU-Preview-2026!", "short"),
    /15/,
  )
  await store.changePassword(
    admin,
    "ISPAU-Preview-2026!",
    "A new private administrator phrase",
  )
  assert.equal(await store.valid(admin, oldVersion), false)
  await assert.rejects(
    store.login("superadmin@ispau.example", "ISPAU-Preview-2026!"),
    /incorrect/,
  )
  assert.ok(
    "actor" in
      (await store.login(
        "superadmin@ispau.example",
        "A new private administrator phrase",
      )),
  )
})
