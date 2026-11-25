import { useCallback, useEffect, useState } from "react"
import activityService, {
  resolveActivityImageUrl,
  type ActivityArticleDto,
} from "@/apiServices/activityService"

export type Activity = {
  id?: string
  registrationUrl?: string
  seoTitle?: string
  seoDescription?: string
  slug: string
  title: string
  category: string
  organiser: string
  location: string
  starts: string
  ends: string
  image: string
  imageAlt: string
  imageCredit: string
  summary: string
  paragraphs: string[]
  preview: boolean
  dateNote: string
}

export type ActivityStatus = "Upcoming" | "Happening now" | "Past"

export const activityPath = (activity: { slug: string }) =>
  `/activities/${activity.slug}/`

export function activityStatus(
  activity: { starts: string; ends: string },
  today?: string,
): ActivityStatus {
  if (!today && activity.starts.includes("T"))
    return Date.now() < Date.parse(activity.starts)
      ? "Upcoming"
      : Date.now() > Date.parse(activity.ends)
        ? "Past"
        : "Happening now"

  const day =
    today ||
    new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kampala" }).format(
      new Date(),
    )

  return day < activity.starts.slice(0, 10)
    ? "Upcoming"
    : day > activity.ends.slice(0, 10)
      ? "Past"
      : "Happening now"
}

export function activityDates(activity: { starts: string; ends: string }) {
  if (!activity.starts) return "Dates not set"

  const format = (date: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(date.includes("T")
        ? { hour: "2-digit" as const, minute: "2-digit" as const }
        : {}),
      timeZone: "Africa/Kampala",
    }).format(new Date(date.includes("T") ? date : date + "T12:00:00Z")) +
    (date.includes("T") ? " EAT" : "")

  return activity.starts === activity.ends
    ? format(activity.starts)
    : `${format(activity.starts)} – ${format(activity.ends)}`
}

/**
 * Extracts plain-text paragraphs from rich-text JSON or newline-separated text.
 */
function extractParagraphs(body: string | null | undefined): string[] {
  if (!body) return []
  try {
    const parsed = JSON.parse(body)

    // ProseMirror / TipTap / Custom document structure
    if (parsed && Array.isArray(parsed.content)) {
      const result: string[] = []
      for (const node of parsed.content) {
        if (node.type === "paragraph" && Array.isArray(node.content)) {
          const text = node.content.map((c: any) => c.text || "").join("")
          if (text.trim()) result.push(text)
        } else if (typeof node.text === "string" && node.text.trim()) {
          result.push(node.text)
        }
      }
      if (result.length) return result
    }

    if (parsed && Array.isArray(parsed.blocks)) {
      return parsed.blocks
        .map((b: any) => b.text || b.data?.text || "")
        .filter(Boolean)
    }

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean)
    }
  } catch {
    // If not JSON, split by lines
    return body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
  }

  return body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * Transforms an ActivityArticleDto from the Laravel backend into the frontend Activity model.
 */
export function dtoToPublicActivity(dto: ActivityArticleDto): Activity {
  const starts = dto.starts_at || dto.startsAt || ""
  const ends = dto.ends_at || dto.endsAt || starts
  const imageUrl = resolveActivityImageUrl(dto.image || dto.image_url)

  return {
    id: dto.id,
    slug: dto.slug || dto.id,
    title: dto.title || "Untitled Activity",
    category: dto.category || "Industry gathering",
    organiser: dto.organiser || "ISPAU",
    location: dto.location || "Location to be confirmed",
    starts,
    ends,
    image: imageUrl || "/blog-images/collaboration.jpg",
    imageAlt: dto.image_alt || dto.title || "Activity cover",
    imageCredit: dto.image_credit || "",
    summary: dto.summary || "",
    paragraphs: extractParagraphs(dto.body),
    preview: false,
    dateNote: dto.date_note || dto.dateNote || "",
    registrationUrl: dto.registration_url || dto.registrationUrl || undefined,
    seoTitle: dto.seo_title || undefined,
    seoDescription: dto.seo_description || undefined,
  }
}

// ============================================================
// SHARED REACT HOOK (Connected to Database API)
// ============================================================

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await activityService.listPublic()
      if (res.success) {
        setActivities(res.data.map(dtoToPublicActivity))
      } else {
        setError(res.message || "Failed to load activities.")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load activities.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    activities,
    loading,
    error,
    refresh,
  }
}
