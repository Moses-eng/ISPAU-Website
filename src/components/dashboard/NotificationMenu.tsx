import { useState } from "react"
import Dialog from "./Dialog"
import Button from "@/components/ui/Button"
import CountBadge from "@/components/ui/CountBadge"
import Icon from "@/components/ui/Icon"
import {
  unreadAlerts,
  type WorkspaceAlert,
} from "@/features/notifications/model"
export default function NotificationMenu({
  actorKey,
  items,
  onNavigate,
}: {
  actorKey: string
  items: WorkspaceAlert[]
  onNavigate: (route: string) => void
}) {
  const key = `ispau-alerts-read:${actorKey}`
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) || "[]")
      return Array.isArray(saved)
        ? saved.filter((value): value is string => typeof value === "string")
        : []
    } catch {
      return []
    }
  })
  const unread = unreadAlerts(items, read)
  const mark = (ids: string[]) => {
    const next = [...new Set([...read, ...ids])]
    setRead(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      /* Read state remains usable for this session. */
    }
  }
  return (
    <>
      <button
        className="notification-trigger"
        type="button"
        aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
        onClick={() => setOpen(true)}
      >
        <Icon name="bell" />
        <CountBadge count={unread.length} label="unread notifications" />
      </button>
      {open && (
        <Dialog title="Notifications" onClose={() => setOpen(false)}>
          {unread.length > 0 && (
            <Button
              kind="ghost"
              onClick={() => mark(items.map((item) => item.id))}
            >
              Mark all as read
            </Button>
          )}
          {items.length ? (
            <div className="notification-list">
              {items.map((item) => (
                <article key={item.id} className="notification-item">
                  <div>
                    <strong>{item.title}</strong>
                    <CountBadge
                      count={read.includes(item.id) ? 0 : 1}
                      label="unread notification"
                    />
                    <p>{item.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      mark([item.id])
                      setOpen(false)
                      onNavigate(item.route)
                    }}
                  >
                    View
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p>You’re all caught up.</p>
          )}
        </Dialog>
      )}
    </>
  )
}
