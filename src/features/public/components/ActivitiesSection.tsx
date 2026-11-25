import { useState } from "react"
import {
  activityDates,
  activityPath,
  activityStatus,
  useActivities,
  type Activity,
} from "../data/activities"
import "@/styles/activities.css"

export default function ActivitiesSection() {
  const { activities, loading, error, refresh } = useActivities()
  const [filter, setFilter] = useState("All activities")
  const rows = activities.filter(
    (activity) =>
      filter === "All activities" || activityStatus(activity) === filter,
  )
  return (
    <section
      className="section events-section"
      id="activities"
      aria-labelledby="activities-title"
    >
      <div className="events-heading">
        <div>
          <span className="eyebrow">Around the industry</span>
          <h2 id="activities-title">Activities & events</h2>
          <p>
            Places to meet, ideas to exchange and opportunities to take part.
          </p>
        </div>
      </div>
      {loading && <p role="status">Loading activities…</p>}
      {error && (
        <p role="alert">
          Activities are temporarily unavailable.{" "}
          <button type="button" onClick={() => void refresh()}>
            Retry
          </button>
        </p>
      )}
      <div className="events-filters" role="group" aria-label="Activity status">
        {["All activities", "Upcoming", "Happening now", "Past"].map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={filter === name}
            onClick={() => setFilter(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {rows.length} activities shown
      </p>
      <ActivityCardGrid activities={rows} />
      {!rows.length && !loading && !error && (
        <p className="events-empty">
          No activities in this category at the moment. Browse all activities
          for more.
        </p>
      )}
    </section>
  )
}

export function ActivityCardGrid({ activities }: { activities: Activity[] }) {
  return (
    <div className="events-grid">
      {activities.map((activity) => (
        <article className="event-card" key={activity.slug}>
          <a
            className="event-image-link"
            href={activityPath(activity)}
            aria-label={`Read about ${activity.title}`}
          >
            <img
              src={activity.image}
              alt={activity.imageAlt}
              loading="lazy"
              width="1200"
              height="750"
            />
            <span
              className={`event-status ${activityStatus(activity) === "Happening now" ? "event-live" : ""}`}
            >
              {activityStatus(activity)}
            </span>
          </a>
          <div className="event-card-body">
            <span className="event-category">{activity.category}</span>
            <h3>
              <a href={activityPath(activity)}>{activity.title}</a>
            </h3>
            <p className="event-organiser">
              Organised by <strong>{activity.organiser}</strong>
            </p>
            <p className="event-summary">
              {activity.summary.trim() ||
                activity.paragraphs.find((text) => text.trim())}
            </p>
            <dl className="event-meta">
              <div>
                <dt>When</dt>
                <dd>
                  <time dateTime={activity.starts}>
                    {activityDates(activity)}
                  </time>
                  <small>{activity.dateNote}</small>
                </dd>
              </div>
              <div>
                <dt>Where</dt>
                <dd>{activity.location}</dd>
              </div>
            </dl>
            <a className="event-read-more" href={activityPath(activity)}>
              Read more <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      ))}
    </div>
  )
}
