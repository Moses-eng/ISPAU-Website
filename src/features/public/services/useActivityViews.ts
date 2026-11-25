import { useEffect, useState } from "react"

const counted = new Set<string>()
const fallbackCounts = new Map<string, number>()
const countKey = (slug: string) => `ispau-activity-views:${slug}`
function readCount(slug: string) {
  try {
    return Math.max(0, Number(localStorage.getItem(countKey(slug))) || 0)
  } catch {
    return fallbackCounts.get(slug) || 0
  }
}

// Local preview only. A shared production total needs a server-side analytics endpoint.
export default function useActivityViews(slug: string) {
  const [views, setViews] = useState(() => readCount(slug))
  useEffect(() => {
    setViews(readCount(slug))
    if (!import.meta.env.DEV || !slug) return
    const sessionKey = `ispau-activity-counted:${slug}`
    let alreadyCounted = counted.has(slug)
    try {
      alreadyCounted ||= sessionStorage.getItem(sessionKey) === "true"
    } catch {
      /* In-memory deduplication remains available. */
    }
    if (alreadyCounted) return
    let elapsed = 0
    let started: number | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let finished = false
    const qualify = () => {
      if (finished) return
      finished = true
      counted.add(slug)
      const total = readCount(slug) + 1
      fallbackCounts.set(slug, total)
      try {
        localStorage.setItem(countKey(slug), String(total))
        sessionStorage.setItem(sessionKey, "true")
      } catch {
        /* Keep the local preview usable without storage. */
      }
      setViews(total)
    }
    const update = () => {
      clearTimeout(timer)
      if (started !== null) elapsed += performance.now() - started
      started = null
      if (finished) return
      if (elapsed >= 60_000) {
        qualify()
        return
      }
      if (document.visibilityState === "visible") {
        started = performance.now()
        timer = setTimeout(update, Math.max(1, 60_000 - elapsed))
      }
    }
    update()
    document.addEventListener("visibilitychange", update)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", update)
    }
  }, [slug])
  return views
}
