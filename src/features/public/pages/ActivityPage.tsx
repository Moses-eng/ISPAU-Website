import { useEffect, useState } from "react"
import PublicShell from "@/components/layout/PublicShell"
import EmptyState from "@/components/dashboard/EmptyState"
import type { View } from "@/types/View"
import {
  activityDates,
  activityPath,
  activityStatus,
  dtoToPublicActivity,
  useActivities,
  type Activity,
} from "../data/activities"
import activityService from "@/apiServices/activityService"
import useActivityViews from "../services/useActivityViews"
import "@/styles/activities.css"

export default function ActivityPage({
  slug,
  go,
}: {
  slug: string
  go: (view: View) => void
}) {
  const { activities, loading: listLoading, refresh } = useActivities()
  const [activity, setActivity] = useState<Activity | null>(() => {
    return activities.find((item) => item.slug === slug) ?? null
  })
  const [loading, setLoading] = useState(!activity && listLoading)
  const [error, setError] = useState("")
  const [copyState, setCopyState] = useState("")

  const views = useActivityViews(activity?.slug || slug)

  // Sync from loaded list or fetch individually from server
  useEffect(() => {
    const found = activities.find((item) => item.slug === slug)
    if (found) {
      setActivity(found)
      setLoading(false)
      return
    }

    if (!listLoading) {
      setLoading(true)
      activityService
        .showPublic(slug)
        .then((res) => {
          if (res.success && res.data) {
            setActivity(dtoToPublicActivity(res.data))
          } else {
            setError(res.message || "Activity not found.")
          }
        })
        .catch((err) => {
          setError(err?.message || "Failed to load activity.")
        })
        .finally(() => setLoading(false))
    }
  }, [slug, activities, listLoading])

  const url = activity
    ? new URL(
        activityPath(activity),
        import.meta.env.VITE_PUBLIC_SITE_URL || location.origin,
      ).href
    : ""

  useEffect(() => {
    const previousTitle = document.title
    document.title = activity
      ? activity.seoTitle || `${activity.title} | ISPAU Activities`
      : "Activity unavailable | ISPAU"

    const restore: (() => void)[] = []
    const meta = (name: string, content: string, property = false) => {
      const attribute = property ? "property" : "name"
      const existing = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${name}"]`,
      )
      const node = existing || document.createElement("meta")
      const previous = node.content
      node.setAttribute(attribute, name)
      node.content = content
      if (!existing) document.head.append(node)
      restore.push(() => {
        if (existing) node.content = previous
        else node.remove()
      })
    }

    if (activity) {
      meta("og:title", activity.title, true)
      meta("og:description", activity.summary, true)
      meta("og:image", activity.image, true)
      meta("og:image:alt", activity.imageAlt, true)
      meta("og:url", url, true)
      meta("og:type", "article", true)
    }

    return () => {
      document.title = previousTitle
      restore.forEach((undo) => undo())
    }
  }, [activity, url])

  if (loading) {
    return (
      <PublicShell go={go}>
        <section className="section">
          <p role="status">Loading activity…</p>
        </section>
      </PublicShell>
    )
  }

  if (error || !activity) {
    return (
      <PublicShell go={go}>
        <section className="section">
          <EmptyState
            title="Activity unavailable"
            text={error || "This activity could not be found."}
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void refresh()}
              >
                Retry & browse activities
              </button>
            }
          />
        </section>
      </PublicShell>
    )
  }

  const shareText = encodeURIComponent(`${activity.title}\n${url}`)

  return (
    <PublicShell go={go}>
      <article className="event-detail">
        <div className="event-detail-heading">
          <a className="event-back" href="/#services?section=activities">
            ← Back to activities
          </a>
          <div className="event-detail-labels">
            <span className="event-category">{activity.category}</span>
          </div>
          <h1>{activity.title}</h1>
          <p className="event-detail-intro">{activity.summary}</p>
          <p className="event-organiser">
            Organised by <strong>{activity.organiser}</strong>
          </p>
        </div>

        <div className="event-detail-layout">
          <figure className="event-detail-photo">
            <img
              src={activity.image}
              alt={activity.imageAlt}
              width="1200"
              height="750"
              fetchPriority="high"
            />
            {activity.imageCredit && (
              <figcaption>Photo: {activity.imageCredit}</figcaption>
            )}
          </figure>

          <aside className="event-facts" aria-label="Activity information">
            <span
              className={`event-status ${
                activityStatus(activity) === "Happening now" ? "event-live" : ""
              }`}
            >
              {activityStatus(activity)}
            </span>
            <dl className="event-meta">
              <div>
                <dt>Date</dt>
                <dd>
                  <time dateTime={activity.starts}>
                    {activityDates(activity)}
                  </time>
                  {activity.dateNote && <small>{activity.dateNote}</small>}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{activity.location}</dd>
              </div>
              <div>
                <dt>Organiser</dt>
                <dd>{activity.organiser}</dd>
              </div>
            </dl>

            <button className="btn btn-primary" onClick={() => go("contact")}>
              Enquire about this activity
            </button>

            {activity.registrationUrl && (
              <a
                className="btn btn-secondary"
                href={activity.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Registration details ↗
              </a>
            )}

            {import.meta.env.DEV && (
              <p className="event-view-count" aria-live="polite">
                {views} engaged {views === 1 ? "view" : "views"}
                <small>Count for this browser only</small>
              </p>
            )}
          </aside>
        </div>

        <div className="event-story">
          <h2>About this activity</h2>
          {activity.paragraphs.length > 0 ? (
            activity.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          ) : (
            <p>{activity.summary}</p>
          )}

          <div className="event-share" aria-labelledby="event-share-title">
            <h2 id="event-share-title">Share this activity</h2>
            <div className="event-share-links">
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  activity.title,
                )}&url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
              >
                X
              </a>
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  url,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
              >
                LinkedIn
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url)
                    setCopyState("Link copied.")
                  } catch {
                    setCopyState(
                      "Copy the activity address from your browser to share it.",
                    )
                  }
                }}
              >
                Copy link
              </button>
            </div>
            {copyState && <p role="status">{copyState}</p>}
          </div>
        </div>
      </article>
    </PublicShell>
  )
}
