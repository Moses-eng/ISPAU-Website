import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import {
  approvedProfiles,
  profilePath,
  profileId,
  profileMetadata,
  profileContent,
  jsonLd,
  publicOrigin,
} from "../src/features/directory/services/profileSeo.ts"
import { profilePages } from "../build/profilePages.ts"
const record = {
  id: "isp-42",
  name: "Example ISP",
  description: "Business connectivity in Uganda.",
  services: ["Fibre internet"],
  coverage: ["Kampala"],
  website: "example.test",
  active: true,
  approved: true,
  eligible: true,
  consent: true,
}

test("only approved eligible active consented profiles enter the public export; private fields are stripped", () => {
  const result = approvedProfiles([
    {
      ...record,
      billingEmail: "PRIVATE",
      evidence: ["PRIVATE-FILE"],
      complaint: "PRIVATE-COMPLAINT",
    },
    { ...record, id: "private", consent: false },
    { ...record, id: "pending", approved: false },
    { ...record, id: "inactive", active: false },
    { ...record, id: "ineligible", eligible: false },
  ])
  assert.equal(result.length, 1)
  assert.equal(JSON.stringify(result).includes("PRIVATE"), false)
  assert.throws(() => approvedProfiles([record, record]), /Duplicate/)
  assert.throws(
    () => approvedProfiles([{ ...record, id: "../escape" }]),
    /stable ID/,
  )
})

test("profile URLs are crawlable and stable by ID; metadata names the ISP and excludes invented ratings", () => {
  const member = approvedProfiles([record])[0]
  assert.equal(profilePath(member), "/members/isp-42/example-isp/")
  assert.equal(profileId(profilePath(member)), member.id)
  assert.equal(profileId("/members/%ZZ/example/"), null)
  const metadata = profileMetadata(member, "https://ispau.test")
  assert.equal(
    metadata.canonical,
    "https://ispau.test/members/isp-42/example-isp/",
  )
  assert.match(metadata.title, /Example ISP/)
  assert.equal(metadata.structuredData.mainEntity.url, "https://example.test/")
  assert.equal("aggregateRating" in metadata.structuredData.mainEntity, false)
  assert.equal("address" in metadata.structuredData.mainEntity, false)
  assert.throws(() => publicOrigin("http://localhost:5173"), /HTTPS/)
})

test("profile HTML and JSON-LD escape supplied markup and reject unsafe website links", () => {
  const member = approvedProfiles([
    {
      ...record,
      name: "<script>alert(1)</script>",
      website: "javascript:alert(1)",
    },
  ])[0]
  assert.equal(profileContent(member).includes("<script>"), false)
  assert.equal(profileContent(member).includes("javascript:"), false)
  assert.equal(
    jsonLd(
      profileMetadata(member, "https://ispau.test").structuredData,
    ).includes("<script>"),
    false,
  )
})

test("build emits initial profile HTML, canonical metadata, public-only sitemap and robots without exposing rejected records", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ispau-seo-"))
  try {
    await fs.mkdir(path.join(root, "dist"))
    await fs.writeFile(
      path.join(root, "directory.json"),
      JSON.stringify([record, { ...record, id: "PRIVATE", approved: false }]),
    )
    await fs.writeFile(
      path.join(root, "dist/index.html"),
      '<html><head><title>ISPAU</title><meta name="description" content="Base" /><meta name="robots" content="noindex, nofollow" /></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>',
    )
    const plugin = profilePages({
      VITE_PUBLIC_SITE_URL: "https://ispau.test",
      PUBLIC_DIRECTORY_FILE: "directory.json",
      VITE_PUBLIC_INDEXING: "true",
    })
    await (plugin.configResolved as Function)({
      root,
      build: { outDir: "dist" },
      command: "build",
    })
    await (plugin.closeBundle as Function)()
    const html = await fs.readFile(
      path.join(root, "dist/members/isp-42/example-isp/index.html"),
      "utf8",
    )
    assert.match(html, /<h1>Example ISP<\/h1>/)
    assert.match(html, /name="robots" content="index, follow"/)
    assert.match(html, /rel="canonical"/)
    assert.match(html, /application\/ld\+json/)
    const sitemap = await fs.readFile(
      path.join(root, "dist/sitemap.xml"),
      "utf8",
    )
    assert.match(
      sitemap,
      /https:\/\/ispau.test\/members\/isp-42\/example-isp\//,
    )
    assert.equal(sitemap.includes("PRIVATE"), false)
    assert.equal(sitemap.includes("portal"), false)
    assert.match(
      await fs.readFile(path.join(root, "dist/robots.txt"), "utf8"),
      /Disallow: \/portal/,
    )
    const directory = await fs.readFile(
      path.join(root, "dist/members/index.html"),
      "utf8",
    )
    assert.match(directory, /href="\/members\/isp-42\/example-isp\/"/)
  } finally {
    if (!root.startsWith(path.join(os.tmpdir(), "ispau-seo-")))
      throw Error("Unexpected SEO test directory")
    await fs.rm(root, { recursive: true, force: true })
  }
})
