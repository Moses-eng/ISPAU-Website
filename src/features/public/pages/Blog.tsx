import React, { useEffect, useState, type MouseEvent } from "react"
import PublicShell from "@/components/layout/PublicShell"
import { navigateTo } from "@/app/navigation"
import type { View } from "@/types/View"
import blogService from "@/apiServices/blogService"
import {
  blogDate,
  blogPath,
  blogSummary,
  dtoToBlogPost,
  readingMinutes,
  relatedPosts,
  tileSummary,
  type BlogPost,
} from "../data/blogPosts"
import "@/styles/blog.css"

function renderMarks(text: string, marks?: any[]): React.ReactNode {
  if (!marks || marks.length === 0) return text

  return marks.reduce<React.ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{acc}</strong>
      case "italic":
        return <em>{acc}</em>
      case "underline":
        return <u>{acc}</u>
      case "strike":
        return <s>{acc}</s>
      case "code":
        return <code>{acc}</code>
      case "link":
        return (
          <a
            href={mark.attrs?.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {acc}
          </a>
        )
      case "textStyle": {
        const style: React.CSSProperties = {}
        if (mark.attrs?.color) style.color = mark.attrs.color
        if (mark.attrs?.backgroundColor) style.backgroundColor = mark.attrs.backgroundColor
        if (mark.attrs?.fontSize) style.fontSize = mark.attrs.fontSize
        if (mark.attrs?.fontFamily) style.fontFamily = mark.attrs.fontFamily
        return <span style={style}>{acc}</span>
      }
      default:
        return acc
    }
  }, text)
}

function RenderNode({ node }: { node: any }): React.ReactElement | null {
  if (!node) return null

  const getStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {}
    if (node.attrs?.textAlign) style.textAlign = node.attrs.textAlign
    if (node.attrs?.lineHeight) style.lineHeight = node.attrs.lineHeight
    return style
  }

  switch (node.type) {
    case "text":
      return <>{renderMarks(node.text || "", node.marks)}</>

    case "paragraph":
      return (
        <p style={getStyle()}>
          {node.content?.map((child: any, idx: number) => (
            <RenderNode key={idx} node={child} />
          )) || <br />}
        </p>
      )

    case "heading": {
      const level = node.attrs?.level || 2
      const children = node.content?.map((child: any, idx: number) => (
        <RenderNode key={idx} node={child} />
      ))
      if (level === 1) return <h1 style={getStyle()}>{children}</h1>
      if (level === 2) return <h2 style={getStyle()}>{children}</h2>
      return <h3 style={getStyle()}>{children}</h3>
    }

    case "bulletList":
      return (
        <ul>
          {node.content?.map((child: any, idx: number) => (
            <RenderNode key={idx} node={child} />
          ))}
        </ul>
      )

    case "orderedList":
      return (
        <ol start={node.attrs?.start || 1}>
          {node.content?.map((child: any, idx: number) => (
            <RenderNode key={idx} node={child} />
          ))}
        </ol>
      )

    case "listItem":
      return (
        <li>
          {node.content?.map((child: any, idx: number) => (
            <RenderNode key={idx} node={child} />
          ))}
        </li>
      )

    case "blockquote":
      return (
        <blockquote>
          {node.content?.map((child: any, idx: number) => (
            <RenderNode key={idx} node={child} />
          ))}
        </blockquote>
      )

    case "codeBlock":
      return (
        <pre>
          <code>
            {node.content?.map((child: any, idx: number) => (
              <RenderNode key={idx} node={child} />
            ))}
          </code>
        </pre>
      )

    case "horizontalRule":
      return <hr />

    case "hardBreak":
      return <br />

    case "doc":
      return (
        <>
          {node.content?.map((child: any, idx: number) => (
            <RenderNode key={idx} node={child} />
          ))}
        </>
      )

    default:
      return null
  }
}

function RenderRichBody({ body }: { body: string }) {
  try {
    const doc = typeof body === "string" ? JSON.parse(body) : body
    if (doc?.type === "doc" && Array.isArray(doc.content)) {
      return <RenderNode node={doc} />
    }
    return <p>{String(body)}</p>
  } catch {
    return <p>{body}</p>
  }
}

function BlogCards({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="blog-card-grid">
      {posts.map((post) => (
        <article className="blog-card" key={post.slug || post.id}>
          <a
            className="blog-card-image"
            href={blogPath(post)}
            aria-label={`Read ${post.title}`}
          >
            {post.image ? (
              <img
                src={post.image}
                alt={post.imageAlt}
                width="1200"
                height="750"
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 220,
                  backgroundColor: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                }}
              >
                No image available
              </div>
            )}
            <time dateTime={post.published}>{blogDate(post)}</time>
          </a>
          <div className="blog-card-body">
            <span className="blog-category">{post.category}</span>
            <h2>
              <a href={blogPath(post)}>{post.title}</a>
            </h2>
            <p className="blog-byline">
              By {post.author} <span aria-hidden="true">·</span>{" "}
              {readingMinutes(post)} min read
            </p>
            <p className="blog-card-summary">
              {tileSummary(blogSummary(post))}
            </p>
            <a className="blog-read-more" href={blogPath(post)}>
              Read more <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      ))}
    </div>
  )
}

export default function Blog({
  go,
  slug,
}: {
  go: (view: View) => void
  slug?: string
}) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [copyMessage, setCopyMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const loadData = async () => {
      try {
        if (slug) {
          const [articleRes, listRes] = await Promise.all([
            blogService.showPublic(slug),
            blogService.listPublic(),
          ])

          if (!cancelled) {
            if (articleRes.success && articleRes.data) {
              setCurrentPost(dtoToBlogPost(articleRes.data))
            } else {
              setCurrentPost(null)
            }
            if (listRes.success && Array.isArray(listRes.data)) {
              setPosts(listRes.data.map(dtoToBlogPost))
            }
          }
        } else {
          const listRes = await blogService.listPublic()
          if (!cancelled) {
            setCurrentPost(null)
            if (listRes.success && Array.isArray(listRes.data)) {
              setPosts(listRes.data.map(dtoToBlogPost))
            }
          }
        }
      } catch (err) {
        console.error("Failed to load blog posts:", err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [slug])

  const post = slug ? currentPost : null

  const title = post
    ? post.seoTitle || `${post.title} | ISPAU Blog`
    : slug
      ? "Article unavailable | ISPAU"
      : "Blog | ISPAU"

  const description = post
    ? post.seoDescription || blogSummary(post).slice(0, 320)
    : "Opinions, ideas and perspectives on the people and networks shaping Uganda's internet."

  const pageUrl = new URL(
    post
      ? blogPath(post)
      : slug
        ? `/blog/${encodeURIComponent(slug)}/`
        : "/blog/",
    location.origin,
  ).href

  useEffect(() => {
    const previousTitle = document.title
    const restore: (() => void)[] = []
    document.title = title

    const meta = (name: string, value: string, property = false) => {
      const attribute = property ? "property" : "name"
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${name}"]`,
      )
      const existing = element
      const previous = element?.getAttribute("content")
      if (!element) {
        element = document.createElement("meta")
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.content = value
      const target = element
      restore.push(() => {
        if (!existing) target.remove()
        else if (previous === null || previous === undefined)
          target.removeAttribute("content")
        else target.content = previous
      })
    }

    meta("description", description)
    meta("robots", slug && !post ? "noindex,follow" : "index,follow")
    meta("og:title", title, true)
    meta("og:description", description, true)
    meta("og:type", post ? "article" : "website", true)
    meta("og:url", pageUrl, true)
    if (post && post.image) {
      try {
        meta("og:image", new URL(post.image, location.origin).href, true)
      } catch {}
      meta("article:published_time", post.published, true)
      meta("article:author", post.author, true)
    }

    const previousCanonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    )
    const canonical = previousCanonical || document.createElement("link")
    const previousHref = canonical.getAttribute("href")
    canonical.rel = "canonical"
    canonical.href = pageUrl
    if (!previousCanonical) document.head.appendChild(canonical)

    return () => {
      document.title = previousTitle
      restore.forEach((reset) => reset())
      if (!previousCanonical) canonical.remove()
      else if (previousHref === null) canonical.removeAttribute("href")
      else canonical.setAttribute("href", previousHref)
    }
  }, [title, description, pageUrl, slug, post])

  const followBlogLink = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      "a[href]",
    )
    if (
      !link ||
      link.target ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return

    const url = new URL(link.href)
    if (
      url.origin === location.origin &&
      /^\/blog(?:\/|$)/.test(url.pathname)
    ) {
      event.preventDefault()
      navigateTo(url.pathname + url.search + url.hash)
    }
  }

  const shareTitle = encodeURIComponent(post?.title || "ISPAU Blog")
  const shareUrl = encodeURIComponent(pageUrl)

  return (
    <PublicShell go={go}>
      <div className="blog-page" onClick={followBlogLink}>
        {loading ? (
          <section className="blog-listing">
            <p style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
              Loading blog articles…
            </p>
          </section>
        ) : slug && !post ? (
          <section className="blog-listing">
            <h1>Article unavailable</h1>
            <p>This article could not be found.</p>
            <a className="blog-back" href="/blog/">
              Browse the blog
            </a>
          </section>
        ) : post ? (
          <>
            <article className="blog-article">
              <a className="blog-back" href="/blog/">
                ← Back to the blog
              </a>
              <header className="blog-article-heading">
                <span className="blog-category">{post.category}</span>
                <h1>{post.title}</h1>
                <p className="blog-article-byline">
                  By <strong>{post.author}</strong>{" "}
                  <span aria-hidden="true">·</span>{" "}
                  <time dateTime={post.published}>{blogDate(post)}</time>{" "}
                  <span aria-hidden="true">·</span> {readingMinutes(post)} min
                  read
                </p>
                {post.excerpt && (
                  <p className="blog-standfirst">{post.excerpt}</p>
                )}
              </header>
              <div className="blog-reading">
                {post.image && (
                  <figure className="blog-lead-photo">
                    <img
                      src={post.image}
                      alt={post.imageAlt}
                      width="1200"
                      height="750"
                      fetchPriority="high"
                    />
                    {post.imageCredit && (
                      <figcaption>Photo: {post.imageCredit}</figcaption>
                    )}
                  </figure>
                )}

                {post.body && <RenderRichBody body={post.body} />}
              </div>
              <section
                className="blog-share"
                aria-labelledby="blog-share-title"
              >
                <h2 id="blog-share-title">Share this article</h2>
                <div className="blog-share-links">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    X
                  </a>
                  <a
                    href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(pageUrl)
                        setCopyMessage("Link copied.")
                      } catch {
                        setCopyMessage(
                          "Copy this page's address from your browser.",
                        )
                      }
                    }}
                  >
                    Copy link
                  </button>
                </div>
                <p className="blog-copy-status" role="status">
                  {copyMessage}
                </p>
              </section>
              <a className="blog-back" href="/blog/">
                ← All articles
              </a>
            </article>
            <section
              className="blog-related"
              aria-labelledby="blog-related-title"
            >
              <div className="blog-related-heading">
                <div>
                  <span className="blog-category">Keep reading</span>
                  <h2 id="blog-related-title">More from ISPAU</h2>
                </div>
                <a className="blog-back" href="/blog/">
                  View all articles ↗
                </a>
              </div>
              <BlogCards posts={relatedPosts(post, posts)} />
            </section>
          </>
        ) : (
          <section className="blog-listing" aria-labelledby="blog-title">
            <div className="blog-listing-heading">
              <span className="blog-category">Ideas & perspectives</span>
              <h1 id="blog-title">The ISPAU blog</h1>
              <p>
                Opinions and ideas on the people, networks and conversations
                shaping Uganda’s internet.
              </p>
            </div>
            <BlogCards posts={posts} />
            {!posts.length && <p>No articles have been published yet.</p>}
          </section>
        )}
      </div>
    </PublicShell>
  )
}
