import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { staffNavigation, staffGroup } from "../src/config/workspace.ts"
import { canAccessSection } from "../src/config/permissions.ts"
import { tradeCreditEnabled } from "../src/features/trade-credit/feature.ts"

test("admin checkout excludes public and ISP application modules", () => {
  for (const path of [
    "src/features/public",
    "src/features/portal",
    "src/features/auth",
    "src/features/directory",
    "src/features/membership/pages",
    "src/features/trade-credit/workspace",
    "public/company-logos",
  ]) {
    assert.equal(
      existsSync(new URL("../" + path, import.meta.url)),
      false,
      path,
    )
  }
  assert.match(
    readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8"),
    /app\/App/,
  )
})

test("admin navigation groups operational sections and leaves Trade Credit inaccessible", () => {
  assert.equal(staffGroup("applications"), "membership")
  assert.equal(staffGroup("communications"), "membership")
  assert.equal(staffGroup("billing"), "finance")
  assert.equal(tradeCreditEnabled, false)
  assert.equal(
    staffNavigation.some((item) => item.id === "trade-credit"),
    false,
  )
  assert.equal(
    canAccessSection(
      {
        id: "super",
        name: "Super Admin",
        kind: "staff",
        roles: ["super_admin"],
      },
      "trade-credit",
    ),
    false,
  )
})
