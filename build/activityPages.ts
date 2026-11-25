import fs from "node:fs/promises"
import path from "node:path"
import type { Plugin } from "vite"
import {
  // activities,
  activityDates,
  activityPath,
} from "../src/features/public/data/activities.ts"
import {
  escapeHtml as e,
  publicOrigin,
} from "../src/features/directory/services/profileSeo.ts"



// ============================================================
// STATIC / FALLBACK DATA (Required by Vite build pre-renderer when building the file )
// ============================================================
const activities = [
  {
    slug: "isp-kasita-bazaar",
    title: "ISP–KASITA Bazaar",
    category: "Industry gathering",
    organiser: "Participating ISPs & KASITA Uganda",
    location: "Venue to be confirmed",
    starts: "2026-11-26",
    ends: "2026-11-27",
    image: "/blog-images/collaboration.jpg",
    imageAlt: "Professionals meeting around a table",
    imageCredit: "Christina / Unsplash",
    summary:
      "Bringing ISPs together with KASITA Uganda members and Wi-Fi hotspot operators.",
    paragraphs: [
      "The proposed bazaar brings participating internet service providers together with KASITA Uganda members and Wi-Fi hotspot operators. It is an opportunity to meet the people involved in providing connectivity and learn about the participating organisations.",
      "The Thursday–Friday dates are provisional. The venue, opening times and participation arrangements will be shared once confirmed.",
      "The confirmed programme, event photographs or poster, and instructions for attending will appear here once supplied. For enquiries in the meantime, contact the ISPAU Secretariat.",
    ],
    preview: true,
    dateNote: "Proposed dates · awaiting confirmation",
  },
  {
    slug: "network-resilience-workshop-preview",
    title: "Network resilience workshop",
    category: "Technical learning",
    organiser: "Organiser to be confirmed",
    location: "Location to be confirmed",
    starts: "2026-11-24",
    ends: "2026-11-30",
    image: "/blog-images/skills.jpg",
    imageAlt: "A technician beside telecommunications equipment",
    imageCredit: "Sammyayot254 / Unsplash",
    summary:
      "Technical learning and knowledge exchange focused on resilient networks.",
    paragraphs: [
      "A technical learning activity focused on network resilience and operational practice.",
      "The programme, speakers and attendance arrangements are awaiting confirmation from the organiser.",
      "Further information and relevant resources will be shared here when available.",
    ],
    preview: true,
    dateNote: "Dates awaiting confirmation",
  },
  {
    slug: "industry-exchange-preview",
    title: "Industry exchange & networking",
    category: "Community exchange",
    organiser: "Organiser to be confirmed",
    location: "Location to be confirmed",
    starts: "2026-11-12",
    ends: "2026-11-12",
    image: "/blog-images/networks.jpg",
    imageAlt: "Fibre optic connections in networking equipment",
    imageCredit: "Kirill Sh / Unsplash",
    summary:
      "Connecting industry participants through dialogue and knowledge exchange.",
    paragraphs: [
      "A space for internet service providers and industry participants to exchange ideas and connect.",
      "The organiser, location and activity details are awaiting confirmation.",
      "Further information and relevant resources will be shared here when available.",
    ],
    preview: true,
    dateNote: "Dates awaiting confirmation",
  },
]

// Include readable activity HTML and share metadata. Preview pages must not be indexed.
// Backend: build from the same approved activity snapshot as useActivities before enabling indexing.
export function activityPages(env: Record<string, string>): Plugin {
  let output = "dist"
  let building = false
  const origin = publicOrigin(env.VITE_PUBLIC_SITE_URL || "")
  return {
    name: "ispau-activity-pages",
    configResolved(config) {
      building = config.command === "build"
      output = path.resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      if (!building) return
      const template = await fs.readFile(
        path.join(output, "index.html"),
        "utf8",
      )
      for (const activity of activities) {
        const url = origin ? origin + activityPath(activity) : ""
        const body = `<main><article><a href="/#services?section=activities">Back to activities</a><h1>${e(activity.title)}</h1><p>${e(activity.summary)}</p><img src="${e(activity.image)}" alt="${e(activity.imageAlt)}" width="1200" height="750"><p>Organised by ${e(activity.organiser)}</p><p>${e(activityDates(activity))} · ${e(activity.dateNote)}</p><p>${e(activity.location)}</p><h2>About this activity</h2>${activity.paragraphs.map((text) => `<p>${e(text)}</p>`).join("")}</article></main>`
        const html = template
          .replace(
            /<title>[\s\S]*?<\/title>/,
            `<title>${e(activity.title)} | ISPAU Activities</title>`,
          )
          .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, "")
          .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/, "")
          .replace(
            "</head>",
            `<meta name="description" content="${e(activity.summary)}"><meta name="robots" content="noindex, nofollow">${url ? `<link rel="canonical" href="${e(url)}"><meta property="og:url" content="${e(url)}">` : ""}<meta property="og:title" content="${e(activity.title)}"><meta property="og:description" content="${e(activity.summary)}"><meta property="og:image" content="${e(origin ? new URL(activity.image, origin).href : activity.image)}"><meta property="og:type" content="article"></head>`,
          )
          .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
        const folder = path.join(output, "activities", activity.slug)
        await fs.mkdir(folder, { recursive: true })
        await fs.writeFile(path.join(folder, "index.html"), html)
      }
    },
  }
}

