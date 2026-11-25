import { useMemo } from "react"
import EditorialManager from "./EditorialManager"
import {
  blogIdentity,
  newBlog,
  validateBlog,
  type BlogApi,
  type BlogArticle,
} from "./blogContent"
import { emptyDocument } from "./richText"
import blogService, {
  resolveBlogImageUrl,
  type BlogArticleDto,
  type BlogCreatePayload,
  type BlogUpdatePayload,
} from "@/apiServices/blogService"

function dtoToArticle(dto: BlogArticleDto): BlogArticle {
  return {
    id: dto.id,
    title: dto.title || "",
    slug: dto.slug || "",
    category: dto.category || "General",
    author: dto.author || "ISPAU",
    summary: dto.summary || "",
    body: dto.body || JSON.stringify(emptyDocument()),
    status: dto.status || "draft",
    createdAt: dto.created_at || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.created_at || new Date().toISOString(),
    publishedAt: dto.published_at || null,
    imageUrl: resolveBlogImageUrl(dto.image) || dto.image_url || "",
    imageAlt: dto.image_alt || "",
    imageCredit: dto.image_credit || "",
    seoTitle: dto.seo_title || "",
    seoDescription: dto.seo_description || "",
  }
}

function createBlogApiAdapter(): BlogApi {
  return {
    async list(): Promise<BlogArticle[]> {
      const res = await blogService.list()
      if (res.success && Array.isArray(res.data)) {
        return res.data.map(dtoToArticle)
      }
      return []
    },

    async saveDraft(article: BlogArticle): Promise<BlogArticle> {
      const payload: BlogCreatePayload | BlogUpdatePayload = {
        title: article.title || "Untitled draft",
        slug: article.slug || null,
        category: article.category,
        author: article.author,
        summary: article.summary || null,
        body: article.body,
        status: "draft",
        image_url: article.imageUrl || null,
        image_alt: article.imageAlt || null,
        image_credit: article.imageCredit || null,
        seo_title: article.seoTitle || null,
        seo_description: article.seoDescription || null,
        ...(article.imageFile ? { image: article.imageFile } : {}),
      }

      const isServerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(article.id)

      if (isServerUuid) {
        const res = await blogService.update(article.id, payload)
        if (res.success && res.data) {
          return dtoToArticle(res.data)
        }
      }

      const res = await blogService.create(payload as BlogCreatePayload)
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to save draft to server.")
      }
      return dtoToArticle(res.data)
    },

    async publish(article: BlogArticle): Promise<BlogArticle> {
      const payload: BlogCreatePayload | BlogUpdatePayload = {
        title: article.title,
        slug: article.slug || null,
        category: article.category,
        author: article.author,
        summary: article.summary || null,
        body: article.body,
        status: "published",
        image_url: article.imageUrl || null,
        image_alt: article.imageAlt || null,
        image_credit: article.imageCredit || null,
        seo_title: article.seoTitle || null,
        seo_description: article.seoDescription || null,
        ...(article.imageFile ? { image: article.imageFile } : {}),
      }

      const isServerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(article.id)

      let res
      if (isServerUuid) {
        res = await blogService.update(article.id, payload)
      } else {
        res = await blogService.create(payload as BlogCreatePayload)
      }

      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to publish article.")
      }

      return dtoToArticle(res.data)
    },

    async archive(id: string): Promise<void> {
      const res = await blogService.update(id, { status: "archived" })
      if (!res.success) {
        throw new Error(res.message || "Failed to archive article.")
      }
    },

    async delete(id: string): Promise<void> {
      const res = await blogService.remove(id)
      if (!res.success) {
        throw new Error(res.message || "Failed to delete article.")
      }
    },
  }
}

export default function BlogSettings({
  user,
  api,
}: {
  user: unknown
  api?: BlogApi
}) {
  const connectedApi = useMemo(() => api || createBlogApiAdapter(), [api])
  return (
    <EditorialManager
      key={blogIdentity(user).owner}
      user={user}
      api={connectedApi}
      kind="blogs"
      create={newBlog}
      validate={validateBlog}
    />
  )
}
