import { newBlog, validateBlog, type BlogArticle } from "./blogContent"
import type { EditorialApi } from "./EditorialManager"

export type ActivityArticle = BlogArticle & {
  organiser: string
  location: string
  startsAt: string
  endsAt: string
  dateNote: string
  registrationUrl: string
}
export type ActivityApi = EditorialApi<ActivityArticle>

// Temporary draft IDs only; a connected API assigns its own authoritative IDs.
const activityDraftId = () =>
  `activity-draft-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`

export const newActivity = (author: string): ActivityArticle => ({
  ...newBlog(author),
  id: activityDraftId(),
  category: "Industry gathering",
  organiser: "",
  location: "",
  startsAt: "",
  endsAt: "",
  dateNote: "",
  registrationUrl: "",
})

export function validateActivity(article: ActivityArticle, publishing = false) {
  validateBlog(article, publishing)
  if (
    article.organiser.length > 180 ||
    article.location.length > 240 ||
    article.dateNote.length > 240
  )
    throw Error("Shorten the organiser, location or date note.")
  for (const value of [article.startsAt, article.endsAt]) {
    if (
      value &&
      (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        value,
      ) ||
        !Number.isFinite(Date.parse(value)))
    )
      throw Error("Enter valid activity dates and times.")
  }
  if (
    article.startsAt &&
    article.endsAt &&
    Date.parse(article.endsAt) < Date.parse(article.startsAt)
  )
    throw Error("The activity must end on or after its start date and time.")
  if (article.registrationUrl) {
    try {
      const url = new URL(article.registrationUrl)
      if (
        !/^https?:$/.test(url.protocol) ||
        url.username ||
        url.password ||
        /[\u0000-\u0020]/.test(article.registrationUrl) ||
        article.registrationUrl.length > 2048
      )
        throw Error()
    } catch {
      throw Error(
        "Use an HTTP or HTTPS registration link without login details.",
      )
    }
  }
  if (
    publishing &&
    (!article.organiser.trim() ||
      !article.location.trim() ||
      !article.startsAt ||
      !article.endsAt)
  )
    throw Error(
      "Publishing an activity requires an organiser, location, start date and end date.",
    )
}

export const activitySchedule = (article: ActivityArticle) =>
  !article.startsAt || !article.endsAt
    ? "Dates not set"
    : Date.now() < Date.parse(article.startsAt)
      ? "Upcoming"
      : Date.now() > Date.parse(article.endsAt)
        ? "Past"
        : "Current / Ongoing"

// datetime-local has no timezone. Convert explicitly to/from Uganda time (EAT).
export function activityDateInput(value: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return ""
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value))
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || ""
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

// Local Activities drafts only: a separate database, namespace and owner key.
// Never read Blog records, use blogService, or claim that these are live publications.
type StoredActivity = { key: string; owner: string; article: ActivityArticle }
async function activityStore<T>(
  owner: string,
  write: boolean,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  if (!owner) throw Error("Sign in again before opening activity drafts.")
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("ispau-activity-drafts-v1", 1)
    request.onupgradeneeded = () =>
      request.result.createObjectStore("activities", { keyPath: "key" })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(
        Error(
          "Activity draft storage is unavailable. Check browser storage permissions.",
        ),
      )
    request.onblocked = () =>
      reject(Error("Close other Activities editors and try again."))
  })
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(
      "activities",
      write ? "readwrite" : "readonly",
    )
    let request: IDBRequest<T>
    try {
      request = action(transaction.objectStore("activities"))
    } catch (error) {
      db.close()
      reject(error)
      return
    }
    transaction.oncomplete = () => {
      db.close()
      resolve(request.result)
    }
    transaction.onabort = transaction.onerror = () => {
      db.close()
      reject(Error("Activity draft could not be stored. Please retry."))
    }
  })
}

export function localActivityApi(owner: string): ActivityApi {
  const key = (id: string) => JSON.stringify([owner, id])
  return {
    async list() {
      const records = await activityStore<StoredActivity[]>(
        owner,
        false,
        (store) => store.getAll(),
      )
      return records
        .filter((record) => record.owner === owner)
        .map((record) => record.article)
    },
    async saveDraft(article) {
      validateActivity(article)
      const draft: ActivityArticle = {
        ...article,
        id: article.id || activityDraftId(),
        status: "draft",
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      }
      await activityStore(owner, true, (store) =>
        store.put({
          key: key(draft.id),
          owner,
          article: draft,
        } satisfies StoredActivity),
      )
      return draft
    },
    async publish() {
      throw Error(
        "Connect the Activities API before publishing. Blog endpoints must not be used for activities.",
      )
    },
    async archive(id) {
      const record = await activityStore<StoredActivity | undefined>(
        owner,
        false,
        (store) => store.get(key(id)),
      )
      if (record)
        await activityStore(owner, true, (store) =>
          store.put({
            ...record,
            article: { ...record.article, status: "archived" },
          }),
        )
    },
    async delete(id) {
      await activityStore(owner, true, (store) => store.delete(key(id)))
    },
  }
}
