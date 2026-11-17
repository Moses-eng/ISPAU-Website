import { useEffect, useState, useCallback } from "react"
import {
  defaultSiteContent,
  type SiteContent,
  type ContentActor,
  type ContentChange,
} from "./model"
export async function contentRequest(
  actor?: ContentActor,
  change?: ContentChange,
  revision?: number,
): Promise<SiteContent> {
  const response = await fetch(`/api/site-content${actor ? "?drafts=1" : ""}`, {
    method: change ? "PUT" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(change ? { "Content-Type": "application/json" } : {}),
      ...(import.meta.env.DEV && actor
        ? { "X-Preview-Actor": encodeURIComponent(JSON.stringify(actor)) }
        : {}),
    },
    body: change ? JSON.stringify({ change, revision }) : undefined,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw Error(error.message || "Unable to load site settings.")
  }
  return response.json()
}
export default function useSiteContent(actor?: ContentActor) {
  const [content, setContent] = useState(defaultSiteContent)
  const [error, setError] = useState("")
  const key = actor ? JSON.stringify(actor) : ""
  const refresh = useCallback(async () => {
    try {
      setContent(await contentRequest(key ? JSON.parse(key) : undefined))
      setError("")
    } catch (e) {
      setError((e as Error).message)
    }
  }, [key])
  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), 10000)
    return () => clearInterval(timer)
  }, [refresh])
  const save = async (change: ContentChange, revision = content.revision) => {
    const next = await contentRequest(actor, change, revision)
    setContent(next)
    setError("")
  }
  return { content, error, refresh, save }
}
