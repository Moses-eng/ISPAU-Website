export type ContentStatus = "active" | "inactive" | "archived"
export type BannerPage = "home" | "about" | "membership" | "services"
export type SiteSlide = {
  id: string
  page_name: BannerPage
  name: string
  image: string
  description: string
  caption: string
  credit: string
  status: ContentStatus
}
export type MembershipTier = {
  id: string
  name: string
  cost: number
  description: string
  status: ContentStatus
}
export type SiteContent = {
  slides: SiteSlide[]
  tiers: MembershipTier[]
  revision: number
}
export type ContentActor = { id: string; kind: string; roles: string[] }
export type ContentChange =
  { kind: "slides"; item: SiteSlide } | { kind: "tiers"; item: MembershipTier }
const images = [
  ["1763284710278-417ddaf2beb9", "Infrastructure in Uganda", "Michael Starkie"],
  ["1594915440248-1e419eba6611", "Network infrastructure", "Kirill Sh"],
  ["1629837093109-11325d6e7afd", "Technical work", "Sammyayot254"],
  ["1573164574511-73c773193279", "Industry collaboration", "Christina"],
]
export function defaultSiteContent(): SiteContent {
  return {
    revision: 0,
    slides: (
      ["home", "about", "membership", "services"] as BannerPage[]
    ).flatMap((page) =>
      images
        .filter(
          (_, i) =>
            page === "home" ||
            page === "about" ||
            i === (page === "membership" ? 2 : 1),
        )
        .map(([photo, name, credit], i) => ({
          id: `${page}-${i}`,
          page_name: page,
          name,
          image: `https://images.unsplash.com/photo-${photo}?fit=crop&fm=jpg&q=85&w=1400`,
          description: name,
          caption: name,
          credit: `${credit} / Unsplash`,
          status: "active" as const,
        })),
    ),
    tiers: [
      {
        id: "platinum",
        name: "Platinum",
        cost: 1000,
        description: "For ISPs, major operators and infrastructure owners.",
        status: "active",
      },
      {
        id: "silver",
        name: "Silver",
        cost: 500,
        description:
          "For smaller ISPs, emerging operators, startups and wireless providers.",
        status: "active",
      },
      {
        id: "associate",
        name: "Associate",
        cost: 250,
        description:
          "For vendors, equipment providers and content delivery organisations.",
        status: "active",
      },
      {
        id: "affiliate",
        name: "Affiliate",
        cost: 150,
        description: "For academic, research and non-profit organisations.",
        status: "active",
      },
    ],
  }
}
export const canManageContent = (actor: ContentActor | null) =>
  actor?.kind === "staff" && actor.roles.includes("super_admin")
export function publicSiteContent(state: SiteContent): SiteContent {
  return {
    revision: state.revision,
    slides: state.slides.filter((s) => s.status === "active"),
    tiers: state.tiers.filter((t) => t.status === "active"),
  }
}
export function saveContent(
  state: SiteContent,
  actor: ContentActor | null,
  change: ContentChange,
  revision: number,
): SiteContent {
  if (!canManageContent(actor))
    throw Error("Only Super Admin can change site settings.")
  if (revision !== state.revision)
    throw Error(
      "Settings changed in another window. Close this form and reopen the latest record before saving.",
    )
  const item = change.item
  if (
    !item.id ||
    !item.name?.trim() ||
    !item.description?.trim() ||
    !["active", "inactive", "archived"].includes(item.status)
  )
    throw Error("Name, description and a valid status are required.")
  if (change.kind === "slides") {
    const s = change.item
    if (
      !["home", "about", "membership", "services"].includes(s.page_name) ||
      !s.caption.trim() ||
      !s.credit.trim() ||
      !/^https:\/\/[^\s]+$|^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
        s.image,
      ) ||
      s.image.length > 7000000
    )
      throw Error(
        "Choose a page, caption, credit and a valid HTTPS or uploaded JPG/PNG/WebP image (up to 5 MB).",
      )
  } else if (change.kind === "tiers") {
    if (!Number.isFinite(change.item.cost) || change.item.cost < 0)
      throw Error("Annual USD cost must be zero or greater.")
    if (
      state.tiers.some(
        (t) =>
          t.id !== item.id &&
          t.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
      )
    )
      throw Error("A tier with that name already exists.")
  } else throw Error("Unknown settings collection.")
  const next = structuredClone(state)
  const common = {
    id: item.id,
    name: item.name.trim(),
    description: item.description.trim(),
    status: item.status,
  }
  if (change.kind === "slides") {
    const s = change.item,
      value = {
        ...common,
        page_name: s.page_name,
        image: s.image,
        caption: s.caption.trim(),
        credit: s.credit.trim(),
      }
    const index = next.slides.findIndex((row) => row.id === item.id)
    if (index < 0) next.slides.push(value)
    else next.slides[index] = value
  } else {
    const value = { ...common, cost: change.item.cost },
      index = next.tiers.findIndex((row) => row.id === item.id)
    if (index < 0) next.tiers.push(value)
    else next.tiers[index] = value
  }
  next.revision++
  return next
}
