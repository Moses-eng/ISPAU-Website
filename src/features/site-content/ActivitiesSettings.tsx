import { useMemo } from "react"
import EditorialManager from "./EditorialManager"
import { blogIdentity, postedTime } from "./blogContent"
import {
  activityDateInput,
  activitySchedule,
  newActivity,
  validateActivity,
  type ActivityApi,
  type ActivityArticle,
} from "./activityContent"
import { BASE_URL } from "@/apiServices/env"
import activityService, {
  type ActivityArticleDto,
  type ActivityPayload,
} from "@/apiServices/activityService"


// ============================================================
// DTO <-> ARTICLE CONVERTERS
// ============================================================

function dtoToArticle(dto: ActivityArticleDto): ActivityArticle {
  const serverImage = dto.image
    ? dto.image.startsWith("http")
      ? dto.image
      : `${BASE_URL}/${dto.image}`
    : ""

  return {
    id: dto.id,
    title: dto.title ?? "",
    slug: dto.slug ?? "",
    category: dto.category ?? "",
    author: dto.author ?? "",
    organiser: dto.organiser ?? "",
    location: dto.location ?? "",
    startsAt: dto.startsAt ?? dto.starts_at ?? "",
    endsAt: dto.endsAt ?? dto.ends_at ?? "",
    dateNote: dto.dateNote ?? dto.date_note ?? "",
    registrationUrl: dto.registrationUrl ?? dto.registration_url ?? "",
    summary: dto.summary ?? "",
    body: dto.body ?? "",
    imageUrl: serverImage || dto.image_url || "",
    imageAlt: dto.image_alt ?? "",
    imageCredit: dto.image_credit ?? "",
    seoTitle: dto.seo_title ?? "",
    seoDescription: dto.seo_description ?? "",
    status: dto.status ?? "draft",
    publishedAt: dto.published_at ?? null,
    createdAt: dto.created_at ?? new Date().toISOString(),
    updatedAt: dto.updated_at ?? new Date().toISOString(),
  }
}

function articleToPayload(
  article: ActivityArticle,
  statusOverride?: "draft" | "published" | "archived",
): ActivityPayload {
  return {
    title: article.title,
    slug: article.slug || undefined,
    category: article.category,
    author: article.author,
    organiser: article.organiser || undefined,
    location: article.location || undefined,
    starts_at: article.startsAt || undefined,
    ends_at: article.endsAt || undefined,
    date_note: article.dateNote || null,
    registration_url: article.registrationUrl || null,
    summary: article.summary || null,
    body: article.body,
    status: statusOverride ?? article.status,
    image_url:
      article.imageUrl?.startsWith("http") && !article.imageFile
        ? article.imageUrl
        : null,
    image_alt: article.imageAlt || null,
    image_credit: article.imageCredit || null,
    seo_title: article.seoTitle || null,
    seo_description: article.seoDescription || null,
    image: article.imageFile,
  }
}

// ============================================================
// SERVER BACKEND API IMPLEMENTATION
// ============================================================

export const serverActivityApi: ActivityApi = {
  async list(): Promise<ActivityArticle[]> {
    const items = await activityService.list()
    return items.map(dtoToArticle)
  },

  async saveDraft(article: ActivityArticle): Promise<ActivityArticle> {
    validateActivity(article, false)
    const payload = articleToPayload(article, "draft")
    const isNew = !article.id || article.id.startsWith("activity-draft-")

    const saved = isNew
      ? await activityService.create(payload)
      : await activityService.update(article.id, payload)

    return dtoToArticle(saved)
  },

  async publish(article: ActivityArticle): Promise<ActivityArticle> {
    validateActivity(article, true)
    const payload = articleToPayload(article, "published")
    const isNew = !article.id || article.id.startsWith("activity-draft-")

    const saved = isNew
      ? await activityService.create(payload)
      : await activityService.update(article.id, payload)

    return dtoToArticle(saved)
  },

  async archive(id: string): Promise<void> {
    await activityService.update(id, { status: "archived" } as ActivityPayload)
  },

  async delete(id: string): Promise<void> {
    const success = await activityService.remove(id)
    if (!success) {
      throw new Error("Failed to delete activity from server.")
    }
  },
}

// ============================================================
// FORM SUB-COMPONENT
// ============================================================

function ActivityFields({
  article,
  change,
  busy,
}: {
  article: ActivityArticle
  change: (patch: Partial<ActivityArticle>) => void
  busy: boolean
}) {
  const field = (
    name: "organiser" | "location" | "dateNote" | "registrationUrl",
    label: string,
    maxLength: number,
  ) => (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={name === "registrationUrl" ? "url" : "text"}
        value={article[name]}
        maxLength={maxLength}
        disabled={busy}
        onChange={(event) => change({ [name]: event.target.value })}
      />
    </label>
  )

  return (
    <div className="editorial-main-fields">
      <h3>Activity details</h3>
      <p>
        Organiser, location and dates are required before publication. All times
        are Uganda time (EAT).
      </p>
      {field("organiser", "Organiser", 180)}
      {field("location", "Location / venue", 240)}
      {(["startsAt", "endsAt"] as const).map((name) => (
        <label className="field" key={name}>
          <span>
            {name === "startsAt" ? "Starts at (EAT)" : "Ends at (EAT)"}
          </span>
          <input
            name={name}
            type="datetime-local"
            value={activityDateInput(article[name])}
            min={
              name === "endsAt"
                ? activityDateInput(article.startsAt) || undefined
                : undefined
            }
            disabled={busy}
            onChange={(event) =>
              change({
                [name]: event.target.value
                  ? `${event.target.value}:00+03:00`
                  : "",
              })
            }
          />
        </label>
      ))}
      {field("dateNote", "Date note (optional)", 240)}
      {field("registrationUrl", "Registration link (optional)", 2048)}
      <small>
        Current, Upcoming and Past are calculated from these dates; publication
        status is separate.
      </small>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ActivitiesSettings({
  user,
  api,
}: {
  user: unknown
  api?: ActivityApi
}) {
  const { owner } = blogIdentity(user)
  // Use passed api prop or default directly to the live server backend API
  const connectedApi = useMemo(() => api || serverActivityApi, [api])

  return (
    <EditorialManager
      key={owner}
      user={user}
      api={connectedApi}
      kind="activities"
      create={newActivity}
      validate={validateActivity}
      previewOnly={false}
      byline={(article) => article.organiser}
      renderFields={(article, change, busy) => (
        <ActivityFields article={article} change={change} busy={busy} />
      )}
      additionalColumns={[
        {
          label: "Activity dates (EAT)",
          cell: (article) => (
            <>
              <span>{activitySchedule(article)}</span>
              <small className="blog-record-note">
                {article.startsAt
                  ? postedTime(article.startsAt)
                  : "Start not set"}{" "}
                – {article.endsAt ? postedTime(article.endsAt) : "End not set"}
              </small>
              <small className="blog-record-note">
                {article.location || "Location not set"}
              </small>
            </>
          ),
        },
      ]}
    />
  )
}
