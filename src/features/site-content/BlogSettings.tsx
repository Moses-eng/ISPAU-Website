import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import {
  blogFingerprint,
  blogIdentity,
  blogSlug,
  blogSummary,
  newBlog,
  postedTime,
  validateBlog,
  type BlogApi,
  type BlogArticle,
} from "./blogContent"
import { emptyDocument, validateRichDocument } from "./richText"
import blogService, {
  resolveBlogImageUrl,
  type BlogArticleDto,
  type BlogCreatePayload,
  type BlogUpdatePayload,
} from "@/apiServices/blogService"
import "@/styles/blog-settings.css"

const RichTextEditor = lazy(() => import("./RichTextEditor"))

function Cover({ article }: { article: BlogArticle }) {
  const [source, setSource] = useState("")
  useEffect(() => {
    const url = article.imageFile
      ? URL.createObjectURL(article.imageFile)
      : article.imageUrl
    setSource(url)
    return () => {
      if (article.imageFile) URL.revokeObjectURL(url)
    }
  }, [article.imageFile, article.imageUrl])
  return source ? (
    <img
      className="editorial-cover"
      src={source}
      alt={article.imageAlt || "Selected cover"}
    />
  ) : null
}

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
  const { allowed, author } = blogIdentity(user)
  const connectedApi = useMemo(() => api || createBlogApiAdapter(), [api])

  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [editing, setEditing] = useState<BlogArticle | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState("")
  const [message, setMessage] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [customSlug, setCustomSlug] = useState(false)

  const saved = useRef("")
  const dirty = useRef(false)
  const latest = useRef(editing)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  latest.current = editing

  const apiRef = useRef(connectedApi)
  apiRef.current = connectedApi

  useEffect(() => {
    let active = true
    setEditing(null)
    latest.current = null
    dirty.current = false
    setArticles([])
    if (!allowed) {
      setLoading(false)
      return
    }

    setLoading(true)
    connectedApi
      .list()
      .then((remote) => {
        if (active) {
          setArticles(remote)
          setFailure("")
        }
      })
      .catch((error) => {
        if (active) setFailure((error as Error).message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [allowed, connectedApi])

  const persist = async () => {
    const snapshot = latest.current
    if (!snapshot || !dirty.current || !allowed) return
    const fingerprint = blogFingerprint(snapshot)

    const operation = queue.current
      .catch(() => {})
      .then(async () => {
        if (saved.current === fingerprint) return
        setSaveMessage("Saving draft to server…")

        const serverSaved = await apiRef.current.saveDraft(snapshot)
        if (serverSaved && serverSaved.id) {
          // If this was a new item, update its ID to the newly created server UUID
          if (latest.current && (!latest.current.id || latest.current.id === snapshot.id)) {
            latest.current = { ...latest.current, id: serverSaved.id }
            setEditing((current) => (current ? { ...current, id: serverSaved.id } : null))
          }

          setArticles((current) => [
            ...current.filter(
              (item) => item.id !== serverSaved.id && item.id !== snapshot.id,
            ),
            serverSaved,
          ])
        }

        saved.current = blogFingerprint(latest.current || snapshot)
        dirty.current = false
        setFailure("")
        setSaveMessage("Draft saved to server.")
      })

    queue.current = operation
    try {
      await operation
    } catch (error) {
      setFailure((error as Error).message)
      setSaveMessage("Draft not saved to server. Please retry.")
      throw error
    }
  }

  const persistRef = useRef(persist)
  persistRef.current = persist

  useEffect(() => {
    if (!editing || busy || !dirty.current) return
    const timer = setTimeout(
      () => void persistRef.current().catch(() => {}),
      1500,
    )
    return () => clearTimeout(timer)
  }, [editing, busy])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (
        latest.current &&
        dirty.current &&
        saved.current !== blogFingerprint(latest.current)
      ) {
        event.preventDefault()
        event.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", warn)
    return () => {
      window.removeEventListener("beforeunload", warn)
      void persistRef.current().catch(() => {})
    }
  }, [])

  if (!allowed)
    return <p role="alert">Only Super Admin can manage Blog articles.</p>

  const change = (patch: Partial<BlogArticle>) => {
    setEditing((current) => (current ? { ...current, ...patch } : null))
    dirty.current = true
    setFailure("")
    setSaveMessage("Changes waiting to save…")
  }

  const open = (article?: BlogArticle) => {
    const value = article || newBlog(author)
    try {
      validateRichDocument(value.body)
    } catch {
      setFailure(
        "This article's saved body is invalid. Check its formatting before saving.",
      )
      return
    }
    setEditing(value)
    dirty.current = false
    saved.current = blogFingerprint(value)
    setCustomSlug(!!value.slug && value.slug !== blogSlug(value.title))
    setFailure("")
    setMessage("")
    setSaveMessage("Editing article.")
  }

  const close = async () => {
    if (busy) return
    setBusy(true)
    const hadChanges = dirty.current
    try {
      await persist()
      latest.current = null
      dirty.current = false
      setEditing(null)
      setMessage(hadChanges ? "Draft saved to server." : "Closed.")
    } catch {
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    if (!editing || busy) return
    setBusy(true)
    setFailure("")
    try {
      const article = {
        ...editing,
        slug: editing.slug || blogSlug(editing.title),
      }
      validateBlog(article, true)
      await persist()

      const result = await connectedApi.publish(article)
      if (
        result.status !== "published" ||
        !result.publishedAt ||
        !Number.isFinite(Date.parse(result.publishedAt))
      )
        throw Error("The server did not return a valid published article.")

      setArticles((current) => [
        ...current.filter((item) => item.id !== result.id && item.id !== article.id),
        result,
      ])
      dirty.current = false
      latest.current = null
      setEditing(null)
      setMessage("Article published successfully to the website.")
    } catch (error) {
      setFailure((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const archive = async () => {
    if (!editing?.id || busy) return
    setBusy(true)
    try {
      await queue.current.catch(() => {})
      await connectedApi.archive(editing.id)
      setArticles((current) =>
        current.map((item) =>
          item.id === editing.id ? { ...item, status: "archived" } : item,
        ),
      )
      latest.current = null
      dirty.current = false
      setEditing(null)
      setMessage("Article archived successfully.")
    } catch (error) {
      setFailure((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this article?")) return
    setBusy(true)
    setFailure("")
    try {
      const res = await blogService.remove(id)
      if (!res.success) {
        throw new Error(res.message || "Failed to delete article.")
      }
      setArticles((current) => current.filter((item) => item.id !== id))
      setMessage("Article deleted successfully.")
    } catch (error) {
      setFailure((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const rows = articles
    .filter((article) =>
      (article.title + " " + article.author + " " + article.category)
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Date.parse(b.publishedAt || b.updatedAt) -
        Date.parse(a.publishedAt || a.updatedAt),
    )

  const field = (
    name:
      | "author"
      | "category"
      | "imageAlt"
      | "imageCredit"
      | "seoTitle"
      | "seoDescription",
    label: string,
  ) =>
    editing && (
      <label className="field">
        <span>{label}</span>
        <input
          name={name}
          value={editing[name]}
          disabled={busy}
          onChange={(event) => change({ [name]: event.target.value })}
        />
      </label>
    )

  return (
    <div className="blog-settings editorial-manager">
      {message && (
        <p className="workspace-feedback" role="status">
          {message}
        </p>
      )}
      {failure && !editing && (
        <p className="workspace-feedback error" role="alert">
          {failure}
        </p>
      )}
      <section className="workspace-panel">
        <div className="editorial-list-heading">
          <div>
            <h2>Blog articles</h2>
            <p>
              Write articles, manage publications and prepare content for the public website.
            </p>
          </div>
          <Button onClick={() => open()} disabled={loading}>
            Add blog
          </Button>
        </div>
        <label className="field blog-search">
          <span>Search articles</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, author or category"
          />
        </label>
        {loading ? (
          <p role="status">Loading Blog articles from server…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(article) => article.id}
            label="Blog articles"
            columns={[
              {
                label: "Title",
                cell: (article) => (
                  <>
                    <strong>{article.title || "Untitled draft"}</strong>
                    <small className="blog-record-note">
                      /blog/{article.slug || blogSlug(article.title) || "untitled"}/
                    </small>
                  </>
                ),
              },
              {
                label: "Author / category",
                cell: (article) => (
                  <>
                    {article.author}
                    <small className="blog-record-note">
                      {article.category}
                    </small>
                  </>
                ),
              },
              {
                label: "Status",
                cell: (article) => (
                  <span
                    className={`editorial-status editorial-${article.status}`}
                  >
                    {article.status}
                  </span>
                ),
              },
              {
                label: "Published (EAT)",
                cell: (article) => postedTime(article.publishedAt),
              },
              {
                label: "Action",
                cell: (article) => (
                  <div className="workspace-actions" style={{ margin: 0, gap: "6px" }}>
                    <Button kind="secondary" onClick={() => open(article)}>
                      Edit blog
                    </Button>
                    <Button
                      kind="danger"
                      onClick={() => void handleDelete(article.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>

      {editing && (
        <Dialog title="Blog article" onClose={() => void close()}>
          <form
            className="editorial-form"
            onSubmit={(event) => {
              event.preventDefault()
              void close()
            }}
          >
            {failure && (
              <p className="workspace-feedback error" role="alert">
                {failure}
              </p>
            )}
            <p className="editorial-draft-status" role="status">
              {saveMessage}
            </p>
            <div className="editorial-form-layout">
              <div className="editorial-main-fields">
                <label className="field">
                  <span>Title</span>
                  <input
                    name="title"
                    value={editing.title}
                    maxLength={180}
                    disabled={busy}
                    onChange={(event) =>
                      change({
                        title: event.target.value,
                        ...(!customSlug && !editing.publishedAt
                          ? { slug: blogSlug(event.target.value) }
                          : {}),
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>URL slug</span>
                  <input
                    name="slug"
                    value={editing.slug}
                    maxLength={140}
                    readOnly={!!editing.publishedAt}
                    disabled={busy}
                    onChange={(event) => {
                      setCustomSlug(!!event.target.value.trim())
                      change({ slug: event.target.value })
                    }}
                  />
                  <small>
                    {editing.publishedAt
                      ? "Locked after publication to preserve shared links."
                      : "Generated from the title unless you enter your own. Leave blank to generate it when publishing."}
                  </small>
                </label>
                <label className="field">
                  <span>Summary (optional)</span>
                  <textarea
                    name="summary"
                    rows={3}
                    value={editing.summary}
                    disabled={busy}
                    onChange={(event) =>
                      change({ summary: event.target.value })
                    }
                  />
                  <small>
                    The public tile uses up to 160 characters. Leave blank to
                    use the first body paragraph.
                  </small>
                </label>
                <div>
                  <h3>Body</h3>
                  <Suspense fallback={<p>Loading editor…</p>}>
                    <RichTextEditor
                      key={editing.id || "new-blog"}
                      value={JSON.parse(editing.body || JSON.stringify(emptyDocument()))}
                      onChange={(body) =>
                        change({ body: JSON.stringify(body) })
                      }
                      disabled={busy}
                    />
                  </Suspense>
                </div>
                <div className="workspace-note">
                  <strong>Tile summary</strong>
                  <p className="blog-summary-preview">
                    {(() => {
                      try {
                        return (
                          blogSummary(editing) ||
                          "Your summary or first body paragraph will appear here."
                        )
                      } catch {
                        return "Check the body formatting before saving."
                      }
                    })()}
                  </p>
                </div>
                <details className="editorial-search-fields">
                  <summary>Search appearance (optional)</summary>
                  {field("seoTitle", "Search title")}
                  {field("seoDescription", "Search description")}
                </details>
              </div>
              <aside className="editorial-side-fields">
                <fieldset>
                  <legend>Publication</legend>
                  <p>
                    {editing.publishedAt
                      ? "Unpublished changes to an existing article"
                      : "Draft"}
                  </p>
                  {field("author", "Author")}
                  {field("category", "Category")}
                  <label className="field">
                    <span>Published at</span>
                    <input readOnly value={postedTime(editing.publishedAt)} />
                    <small>
                      The backend assigns the first posting date and time.
                    </small>
                  </label>
                </fieldset>
                <fieldset>
                  <legend>Cover image</legend>
                  <Cover article={editing} />
                  <label className="field">
                    <span>Choose JPG, PNG or WebP (up to 5 MB)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        try {
                          validateBlog({
                            ...editing,
                            imageFile: file,
                            imageUrl: "",
                          })
                          change({ imageFile: file, imageUrl: "" })
                        } catch (error) {
                          setFailure((error as Error).message)
                          event.target.value = ""
                        }
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Or image URL (HTTP/HTTPS)</span>
                    <input
                      name="imageUrl"
                      type="url"
                      value={editing.imageUrl}
                      disabled={busy}
                      onChange={(event) =>
                        change({
                          imageUrl: event.target.value,
                          imageFile: undefined,
                        })
                      }
                    />
                  </label>
                  {field("imageAlt", "Image description (alternative text)")}
                  {field("imageCredit", "Photo credit (optional)")}
                  {(editing.imageFile || editing.imageUrl) && (
                    <Button
                      kind="secondary"
                      disabled={busy}
                      onClick={() =>
                        change({ imageFile: undefined, imageUrl: "" })
                      }
                    >
                      Remove cover
                    </Button>
                  )}
                </fieldset>
              </aside>
            </div>
            <div className="workspace-actions editorial-actions">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save draft & close"}
              </Button>
              <Button
                kind="secondary"
                disabled={busy}
                onClick={() => void publish()}
              >
                {editing.publishedAt ? "Publish changes" : "Publish article"}
              </Button>
              {editing.publishedAt && editing.status !== "archived" && (
                <Button
                  kind="danger"
                  disabled={busy}
                  onClick={() => void archive()}
                >
                  Archive article
                </Button>
              )}
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
