import type { PublicMember } from "../../../types/PublicMember.ts"
export type PublishedProfile = PublicMember & { isPreview?: boolean }
export function profilePath(member: Pick<PublicMember, "id" | "name">) {
  const slug =
    member.name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "isp"
  return `/members/${encodeURIComponent(member.id)}/${slug}/`
}
export function profileId(path: string) {
  const match = path.match(/^\/members\/([^/]+)\/[^/]+\/?$/)
  try {
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}
export function publicOrigin(value: string) {
  if (!value) return ""
  const url = new URL(value)
  if (
    url.protocol !== "https:" ||
    ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)
  )
    throw Error("Use the public HTTPS website origin for VITE_PUBLIC_SITE_URL.")
  return url.origin
}
export function safeWebsite(value: string) {
  if (!value) return ""
  try {
    const url = new URL(/^[a-z]+:/i.test(value) ? value : `https://${value}`)
    return ["https:", "http:"].includes(url.protocol) ? url.href : ""
  } catch {
    return ""
  }
}
export function profileMetadata(member: PublicMember, origin: string) {
  const description = [
    member.description,
    member.services.length ? `Services: ${member.services.join(", ")}.` : "",
    member.coverage.length ? `Coverage: ${member.coverage.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 160)
  const canonical = origin ? origin + profilePath(member) : ""
  const website = safeWebsite(member.website)
  return {
    title: `${member.name} | ISP Company Profile | ISPAU`,
    description,
    canonical,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      ...(canonical ? { "@id": canonical, url: canonical } : {}),
      name: `${member.name} — ISPAU company profile`,
      mainEntity: {
        "@type": "Organization",
        name: member.name,
        description: member.description,
        ...(canonical ? { "@id": `${canonical}#organisation` } : {}),
        ...(website ? { url: website, sameAs: [website] } : {}),
        ...(member.email ? { email: member.email } : {}),
        ...(member.phone ? { telephone: member.phone } : {}),
        ...(member.coverage.length ? { areaServed: member.coverage } : {}),
        ...(member.services.length ? { knowsAbout: member.services } : {}),
      },
    },
  }
}
export function approvedProfiles(input: unknown): PublishedProfile[] {
  if (!Array.isArray(input))
    throw Error("The public directory export must be a JSON array.")
  const ids = new Set<string>()
  return input
    .filter(
      (row) =>
        row &&
        row.active === true &&
        row.approved === true &&
        row.eligible === true &&
        row.consent === true,
    )
    .map((row) => {
      if (
        typeof row.id !== "string" ||
        !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,100}$/.test(row.id) ||
        typeof row.name !== "string" ||
        !row.name.trim() ||
        typeof row.description !== "string" ||
        !row.description.trim()
      )
        throw Error(
          "Published directory records need a stable ID, name and description.",
        )
      if (ids.has(row.id)) throw Error(`Duplicate public profile ID: ${row.id}`)
      ids.add(row.id)
      const list = (value: unknown) =>
        Array.isArray(value)
          ? value
              .filter(
                (item): item is string =>
                  typeof item === "string" && Boolean(item.trim()),
              )
              .map((item) => item.trim())
          : []
      // Explicit allowlist: never pass through application, billing or Trade Credit data.
      return {
        id: row.id,
        name: row.name.trim(),
        description: row.description.trim(),
        initials: row.name
          .split(/\s+/)
          .map((part: string) => part[0])
          .slice(0, 3)
          .join(""),
        identity: "independent",
        logoSrc:
          typeof row.logoSrc === "string" &&
          (/^https:\/\//.test(row.logoSrc) || /^\/(?!\/)/.test(row.logoSrc))
            ? row.logoSrc
            : "",
        city: typeof row.city === "string" ? row.city : "",
        district: typeof row.district === "string" ? row.district : "",
        website:
          typeof row.website === "string" ? safeWebsite(row.website) : "",
        services: list(row.services),
        coverage: list(row.coverage),
        ...(typeof row.email === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
          ? { email: row.email }
          : {}),
        ...(typeof row.phone === "string" ? { phone: row.phone } : {}),
        isPreview: false,
      }
    })
}
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  )
export const jsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c")
export function profileContent(member: PublicMember) {
  const e = escapeHtml
  const list = (items: string[]) =>
    `<ul>${items.map((item) => `<li>${e(item)}</li>`).join("")}</ul>`
  const website = safeWebsite(member.website)
  return `<div class="public-site"><main><section class="section"><a href="/members/">Our Members</a><h1>${e(member.name)}</h1><p>${e(member.description)}</p><h2>Services offered</h2>${list(member.services)}<h2>Regions served</h2>${list(member.coverage)}<h2>Public business details</h2>${member.city || member.district ? `<p>${e([member.city, member.district].filter(Boolean).join(", "))}</p>` : ""}${website ? `<p><a href="${e(website)}">Official website</a></p>` : ""}${member.email ? `<p><a href="mailto:${e(member.email)}">${e(member.email)}</a></p>` : ""}${member.phone ? `<p>${e(member.phone)}</p>` : ""}<p>Membership is not regulatory certification.</p></section></main></div>`
}
