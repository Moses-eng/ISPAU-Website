import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import Button from "@/components/ui/Button"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import {
  blogFingerprint,
  blogIdentity,
  blogSlug,
  blogSummary,
  postedTime,
  type BlogApi,
  type BlogArticle,
} from "./blogContent"
import { emptyDocument, validateRichDocument } from "./richText"
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

export type EditorialApi<T extends BlogArticle> = Omit<
  BlogApi,
  "list" | "saveDraft" | "publish"
> & {
  list: () => Promise<T[]>
  saveDraft: (article: T) => Promise<T>
  publish: (article: T) => Promise<T>
}

export default function EditorialManager<T extends BlogArticle>({
  user,
  api: connectedApi,
  kind,
  create,
  validate,
  byline,
  renderFields,
  additionalColumns = [],
  previewOnly = false,
}: {
  user: unknown
  api: EditorialApi<T>
  kind: "blogs" | "activities"
  create: (author: string) => T
  validate: (article: T, publishing?: boolean) => void
  byline?: (article: T) => string
  renderFields?: (
    article: T,
    change: (patch: Partial<T>) => void,
    busy: boolean,
  ) => ReactNode
  additionalColumns?: { label: string; cell: (article: T) => ReactNode }[]
  previewOnly?: boolean
}) {
  const { allowed, author } = blogIdentity(user)
  const activity = kind === "activities"
  const noun = activity ? "activity" : "article"
  const heading = activity ? "Activities" : "Blog articles"
  const destination = previewOnly ? "on this device" : "to server"

  const [articles, setArticles] = useState<T[]>([])
  const [editing, setEditing] = useState<T | null>(null)
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
        setSaveMessage(`Saving draft ${destination}…`)

        const serverSaved = await apiRef.current.saveDraft(snapshot)
        if (serverSaved && serverSaved.id) {
          // If this was a new item, update its ID to the newly created server UUID
          if (
            latest.current &&
            (!latest.current.id || latest.current.id === snapshot.id)
          ) {
            latest.current = { ...latest.current, id: serverSaved.id }
            setEditing((current) =>
              current ? { ...current, id: serverSaved.id } : null,
            )
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
        setSaveMessage(`Draft saved ${destination}.`)
      })

    queue.current = operation
    try {
      await operation
    } catch (error) {
      setFailure((error as Error).message)
      setSaveMessage(`Draft not saved ${destination}. Please retry.`)
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
    return <p role="alert">Only Super Admin can manage {heading}.</p>

  const change = (patch: Partial<T>) => {
    setEditing((current) => (current ? { ...current, ...patch } : null))
    dirty.current = true
    setFailure("")
    setSaveMessage("Changes waiting to save…")
  }

  const open = (article?: T) => {
    const value = article || create(author)
    try {
      validateRichDocument(value.body)
    } catch {
      setFailure(
        `This ${noun}'s saved body is invalid. Check its formatting before saving.`,
      )
      return
    }
    setEditing(value)
    dirty.current = false
    saved.current = blogFingerprint(value)
    setCustomSlug(!!value.slug && value.slug !== blogSlug(value.title))
    setFailure("")
    setMessage("")
    setSaveMessage(`Editing ${noun}.`)
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
      setMessage(hadChanges ? `Draft saved ${destination}.` : "Closed.")
    } catch {
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    if (!editing || busy || previewOnly) return
    setBusy(true)
    setFailure("")
    try {
      const article = {
        ...editing,
        slug: editing.slug || blogSlug(editing.title),
      }
      validate(article, true)
      await persist()

      const result = await connectedApi.publish(article)
      if (
        result.status !== "published" ||
        !result.publishedAt ||
        !Number.isFinite(Date.parse(result.publishedAt))
      )
        throw Error(`The server did not return a valid published ${noun}.`)

      setArticles((current) => [
        ...current.filter(
          (item) => item.id !== result.id && item.id !== article.id,
        ),
        result,
      ])
      dirty.current = false
      latest.current = null
      setEditing(null)
      setMessage(
        activity
          ? "Activity published successfully to the website."
          : "Article published successfully to the website.",
      )
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
      setMessage(
        activity
          ? "Activity archived successfully."
          : "Article archived successfully.",
      )
    } catch (error) {
      setFailure((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !connectedApi.delete ||
      !window.confirm(
        `Are you sure you want to permanently delete this ${noun}?`,
      )
    )
      return
    setBusy(true)
    setFailure("")
    try {
      await connectedApi.delete(id)
      setArticles((current) => current.filter((item) => item.id !== id))
      setMessage(
        activity
          ? "Activity deleted successfully."
          : "Article deleted successfully.",
      )
    } catch (error) {
      setFailure((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const rows = articles
    .filter((article) =>
      (
        article.title +
        " " +
        (byline ? byline(article) : article.author) +
        " " +
        article.category
      )
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
          onChange={(event) =>
            change({ [name]: event.target.value } as Partial<T>)
          }
        />
      </label>
    )

  return (
    <div className="blog-settings editorial-manager" data-editorial-kind={kind}>
      {previewOnly && (
        <p className="workspace-note">
          Activity drafts are saved on this device. Publishing requires the
          Activities backend connection.
        </p>
      )}
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
            <h2>{heading}</h2>
            <p>
              {activity
                ? "Manage activity information, dates and cover images for the public website."
                : "Write articles, manage publications and prepare content for the public website."}
            </p>
          </div>
          <Button onClick={() => open()} disabled={loading}>
            {activity ? "Add activity" : "Add blog"}
          </Button>
        </div>
        <label className="field blog-search">
          <span>{activity ? "Search activities" : "Search articles"}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              activity
                ? "Title, organiser or category"
                : "Title, author or category"
            }
          />
        </label>
        {loading ? (
          <p role="status">
            Loading {heading}
            {previewOnly ? "…" : " from server…"}
          </p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(article) => article.id}
            label={heading}
            columns={[
              {
                label: "Title",
                cell: (article) => (
                  <>
                    <strong>{article.title || "Untitled draft"}</strong>
                    <small className="blog-record-note">
                      /{activity ? "activities" : "blog"}/
                      {article.slug || blogSlug(article.title) || "untitled"}/
                    </small>
                  </>
                ),
              },
              {
                label: activity ? "Organiser / category" : "Author / category",
                cell: (article) => (
                  <>
                    {byline ? byline(article) : article.author}
                    <small className="blog-record-note">
                      {article.category}
                    </small>
                  </>
                ),
              },
              ...additionalColumns,
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
                  <div
                    className="workspace-actions"
                    style={{ margin: 0, gap: "6px" }}
                  >
                    <Button kind="secondary" onClick={() => open(article)}>
                      {activity ? "Edit activity" : "Edit blog"}
                    </Button>
                    <Button
                      kind="danger"
                      disabled={!connectedApi.delete}
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
        <Dialog
          title={activity ? "Activity" : "Blog article"}
          onClose={() => void close()}
        >
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
                      } as Partial<T>)
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
                      change({ slug: event.target.value } as Partial<T>)
                    }}
                  />
                  <small>
                    {editing.publishedAt
                      ? "Locked after publication to preserve shared links."
                      : "Generated from the title unless you enter your own. Leave blank to generate it when publishing."}
                  </small>
                </label>
                {renderFields?.(editing, change, busy)}
                <label className="field">
                  <span>Summary (optional)</span>
                  <textarea
                    name="summary"
                    rows={3}
                    value={editing.summary}
                    disabled={busy}
                    onChange={(event) =>
                      change({ summary: event.target.value } as Partial<T>)
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
                      key={editing.id || `new-${kind}`}
                      value={JSON.parse(
                        editing.body || JSON.stringify(emptyDocument()),
                      )}
                      onChange={(body) =>
                        change({ body: JSON.stringify(body) } as Partial<T>)
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
                      ? `Unpublished changes to an existing ${noun}`
                      : "Draft"}
                  </p>
                  {!activity && field("author", "Author")}
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
                          validate({
                            ...editing,
                            imageFile: file,
                            imageUrl: "",
                          })
                          change({
                            imageFile: file,
                            imageUrl: "",
                          } as Partial<T>)
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
                        } as Partial<T>)
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
                        change({
                          imageFile: undefined,
                          imageUrl: "",
                        } as Partial<T>)
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
                disabled={busy || previewOnly}
                onClick={() => void publish()}
              >
                {editing.publishedAt
                  ? "Publish changes"
                  : activity
                    ? "Publish activity"
                    : "Publish article"}
              </Button>
              {editing.publishedAt && editing.status !== "archived" && (
                <Button
                  kind="danger"
                  disabled={busy}
                  onClick={() => void archive()}
                >
                  Archive {noun}
                </Button>
              )}
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
