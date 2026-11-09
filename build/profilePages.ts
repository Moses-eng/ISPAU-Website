import fs from "node:fs/promises"
import path from "node:path"
import type { Plugin } from "vite"
import {
  approvedProfiles,
  escapeHtml,
  jsonLd,
  profileContent,
  profileMetadata,
  profilePath,
  publicOrigin,
} from "../src/features/directory/services/profileSeo.ts"
export function profilePages(env: Record<string, string>): Plugin {
  const origin = publicOrigin(env.VITE_PUBLIC_SITE_URL || "")
  const file = env.PUBLIC_DIRECTORY_FILE
  const indexable =
    env.VITE_PUBLIC_INDEXING === "true" && Boolean(origin) && Boolean(file)
  let profiles: ReturnType<typeof approvedProfiles> = []
  let output = "dist"
  let building = false
  return {
    name: "ispau-public-profile-pages",
    async configResolved(config) {
      building = config.command === "build"
      output = path.resolve(config.root, config.build.outDir)
      if (file)
        profiles = approvedProfiles(
          JSON.parse(
            await fs.readFile(path.resolve(config.root, file), "utf8"),
          ),
        )
      if (env.VITE_PUBLIC_INDEXING === "true" && !indexable)
        throw Error(
          "Indexing needs VITE_PUBLIC_SITE_URL and PUBLIC_DIRECTORY_FILE.",
        )
    },
    resolveId(id) {
      if (id === "virtual:ispau-directory") return "\0virtual:ispau-directory"
    },
    load(id) {
      if (id === "\0virtual:ispau-directory")
        return `export const profiles = ${JSON.stringify(profiles)}; export const configured = ${Boolean(file)}; export const indexable = ${indexable}; export const origin = ${JSON.stringify(origin)};`
    },
    async closeBundle() {
      if (!building) return
      const template = await fs.readFile(
        path.join(output, "index.html"),
        "utf8",
      )
      const page = (
        title: string,
        description: string,
        canonical: string,
        body: string,
        structuredData?: unknown,
      ) =>
        template
          .replace(
            /<title>[\s\S]*?<\/title>/,
            `<title>${escapeHtml(title)}</title>`,
          )
          .replace(
            /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
            `<meta name="description" content="${escapeHtml(description)}" />`,
          )
          .replace(
            /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/,
            `<meta name="robots" content="${indexable ? "index, follow" : "noindex, nofollow"}" />`,
          )
          .replace(
            "</head>",
            `${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" /><meta property="og:url" content="${escapeHtml(canonical)}" />` : ""}<meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:type" content="website" />${structuredData ? `<script type="application/ld+json">${jsonLd(structuredData)}</script>` : ""}</head>`,
          )
          .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
      await fs.mkdir(path.join(output, "members"), { recursive: true })
      for (const profile of profiles) {
        const metadata = profileMetadata(profile, origin)
        const folder = path.join(output, profilePath(profile))
        await fs.mkdir(folder, { recursive: true })
        await fs.writeFile(
          path.join(folder, "index.html"),
          page(
            metadata.title,
            metadata.description,
            metadata.canonical,
            profileContent(profile),
            metadata.structuredData,
          ),
        )
      }
      const directory = `<div class="public-site"><main class="section"><h1>ISPAU member ISPs</h1><ul>${profiles.map((profile) => `<li><a href="${escapeHtml(profilePath(profile))}">${escapeHtml(profile.name)}</a><p>${escapeHtml(profile.description)}</p></li>`).join("")}</ul></main></div>`
      await fs.writeFile(
        path.join(output, "members/index.html"),
        page(
          "Member ISP Directory | ISPAU",
          "Explore the approved public company profiles of ISPAU member ISPs.",
          origin ? `${origin}/members/` : "",
          directory,
        ),
      )
      const urls = indexable
        ? [
            `${origin}/members/`,
            ...profiles.map((profile) => origin + profilePath(profile)),
          ]
        : []
      await fs.writeFile(
        path.join(output, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeHtml(url)}</loc></url>`).join("")}</urlset>`,
      )
      await fs.writeFile(
        path.join(output, "robots.txt"),
        indexable
          ? `User-agent: *\nAllow: /\nDisallow: /portal\nDisallow: /staff\nSitemap: ${origin}/sitemap.xml\n`
          : "User-agent: *\nDisallow: /\n",
      )
    },
  }
}
