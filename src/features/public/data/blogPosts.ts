import {
  resolveBlogImageUrl,
  type BlogArticleDto,
} from "@/apiServices/blogService"

export type BlogPost = {
  id?: string
  seoTitle?: string
  seoDescription?: string
  slug: string
  title: string
  category: string
  author: string
  published: string
  image: string
  imageAlt: string
  imageCredit: string
  excerpt: string
  body?: string
}

/**
 * Recursively extracts plain text from TipTap/ProseMirror JSON nodes or fallback text/HTML strings
 */
function extractPlainText(input: any): string {
  if (!input) return ""

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      if (parsed && typeof parsed === "object") {
        return extractPlainText(parsed)
      }
    } catch {
      // Plain text or HTML fallback: strip tags and collapse whitespace
      return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    }
  }

  if (typeof input !== "object") return ""
  if (input.text) return input.text

  if (Array.isArray(input.content)) {
    return input.content
      .map(extractPlainText)
      .filter(Boolean)
      .join(" ")
  }

  return ""
}

export function dtoToBlogPost(dto: BlogArticleDto): BlogPost {
  const imageUrl = resolveBlogImageUrl(dto.image) || dto.image_url || ""

  let excerpt = dto.summary || ""
  if (!excerpt && dto.body) {
    excerpt = extractPlainText(dto.body)
  }

  return {
    id: dto.id,
    slug: dto.slug || "",
    title: dto.title || "Untitled",
    category: dto.category || "General",
    author: dto.author || "ISPAU",
    published: dto.published_at || dto.created_at || new Date().toISOString(),
    image: imageUrl,
    imageAlt: dto.image_alt || dto.title || "Article cover image",
    imageCredit: dto.image_credit || "",
    excerpt,
    body: dto.body || undefined,
    seoTitle: dto.seo_title || undefined,
    seoDescription: dto.seo_description || undefined,
  }
}

export const blogPath = (post: BlogPost) => `/blog/${post.slug}/`

export const blogDate = (post: BlogPost) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Kampala",
  }).format(
    new Date(
      post.published.length === 10
        ? post.published + "T09:00:00+03:00"
        : post.published,
    ),
  ) + " EAT"

export const blogSummary = (post: BlogPost) =>
  (post.excerpt || "").replace(/\s+/g, " ").trim()

export const tileSummary = (text: string) => {
  const characters = Array.from(text)
  return characters.length > 160
    ? characters.slice(0, 159).join("").trimEnd() + "…"
    : text
}

export const readingMinutes = (post: BlogPost) => {
  let text = post.excerpt || ""
  if (post.body) {
    text += " " + extractPlainText(post.body)
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export const relatedPosts = (post: BlogPost, posts: BlogPost[] = []) =>
  posts
    .filter((item) => item.slug !== post.slug)
    .sort(
      (a, b) =>
        Number(b.category === post.category) -
          Number(a.category === post.category) ||
        Date.parse(b.published) - Date.parse(a.published),
    )
    .slice(0, 2)
