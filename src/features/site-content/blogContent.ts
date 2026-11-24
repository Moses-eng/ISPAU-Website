import {
  emptyDocument,
  encodeRichBody,
  richTextPlain,
  validateRichDocument,
} from "./richText"

export type BlogArticle = {
  id: string
  title: string
  slug: string
  category: string
  author: string
  summary: string
  body: string
  imageUrl: string
  imageFile?: File
  imageAlt: string
  imageCredit: string
  seoTitle: string
  seoDescription: string
  status: "draft" | "published" | "archived"
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export type BlogApi = {
  list: () => Promise<BlogArticle[]>
  saveDraft: (article: BlogArticle) => Promise<BlogArticle>
  publish: (article: BlogArticle) => Promise<BlogArticle>
  archive: (id: string) => Promise<void>
  delete?: (id: string) => Promise<void>
}

export function blogIdentity(user: unknown) {
  const record =
    user && typeof user === "object" ? (user as Record<string, unknown>) : {}
  return {
    allowed: record.role === "super_admin",
    owner: String(record.id || record.email || ""),
    author: String(record.name || "ISPAU"),
  }
}

export const blogSlug = (title: string) =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140)
    .replace(/-$/, "")

export const newBlog = (author: string): BlogArticle => ({
  id: "",
  title: "",
  slug: "",
  category: "Opinion",
  author,
  summary: "",
  body: encodeRichBody(emptyDocument()),
  imageUrl: "",
  imageAlt: "",
  imageCredit: "",
  seoTitle: "",
  seoDescription: "",
  status: "draft",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  publishedAt: null,
})

export function blogSummary(article: BlogArticle) {
  const body = validateRichDocument(article.body)
  const first = (node: typeof body): string =>
    node.type === "paragraph"
      ? richTextPlain(node).trim()
      : (node.content || []).map(first).find(Boolean) || ""
  const text = (article.summary.trim() || first(body) || richTextPlain(body))
    .replace(/\s+/g, " ")
    .trim()
  const characters = Array.from(text)
  return characters.length > 160
    ? characters.slice(0, 159).join("").trimEnd() + "…"
    : text
}

export const postedTime = (value: string | null) =>
  value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Kampala",
      }).format(new Date(value)) + " EAT"
    : "Not published"

export const blogFingerprint = (article: BlogArticle) =>
  JSON.stringify({
    ...article,
    updatedAt: "",
    imageFile: article.imageFile
      ? [
          article.imageFile.name,
          article.imageFile.size,
          article.imageFile.type,
          article.imageFile.lastModified,
        ]
      : null,
  })

export function validateBlog(article: BlogArticle, publishing = false) {
  encodeRichBody(article.body)
  if (
    article.title.length > 180 ||
    article.slug.length > 140 ||
    article.category.length > 80 ||
    article.seoTitle.length > 180 ||
    article.seoDescription.length > 320
  )
    throw Error("Shorten the title, category, URL or search description.")
  if (article.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug))
    throw Error("Use lowercase words separated by hyphens in the URL slug.")
  if (article.imageUrl && !/^https?:\/\/[^\s]+$/.test(article.imageUrl))
    throw Error("Use an HTTP or HTTPS cover image URL.")
  if (
    article.imageFile &&
    (article.imageFile.size > 5242880 ||
      !["image/jpeg", "image/png", "image/webp"].includes(
        article.imageFile.type,
      ))
  )
    throw Error("Choose a JPG, PNG or WebP image up to 5 MB.")
  if (
    publishing &&
    (!article.title.trim() ||
      !(article.slug || blogSlug(article.title)) ||
      !article.category.trim() ||
      !article.author.trim() ||
      !(article.imageFile || article.imageUrl) ||
      !article.imageAlt.trim() ||
      !richTextPlain(validateRichDocument(article.body)).trim())
  )
    throw Error(
      "Publishing requires a title, URL, category, author, cover image, image description and body. The summary is optional.",
    )
}
