// src/components/dashboard/Notification.tsx
import { useState, useEffect } from "react"
import Icon from "@/components/ui/Icon"
import authStore from "@/apiServices/authStore"
import applicantNotificationService from "@/apiServices/applicantNotificationService"
import { navigateTo } from "@/app/navigation"

export default function NotificationMenu({
  actorKey,
  onNavigate,
}: {
  actorKey?: string
  items?: unknown[]
  onNavigate?: (route: string) => void
}) {
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // 1. Fetch unread count using applicantNotificationService
  useEffect(() => {
    let isMounted = true

    const fetchUnread = async () => {
      const applicantId = authStore.getUserId() || actorKey
      if (!applicantId) return

      try {
        const res = await applicantNotificationService.recent(applicantId, 1)
        if (res.success && isMounted) {
          setUnreadCount(res.data.unread_count ?? 0)
        }
      } catch (err) {
        console.error("Failed to fetch unread notification count", err)
      }
    }

    void fetchUnread()

    // Poll every 30 seconds for live updates
    const timer = setInterval(() => {
      void fetchUnread()
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [actorKey])

  // 2. Properly navigate to /#/notifications
  const handleOpenNotifications = () => {
    if (onNavigate) {
      onNavigate("notifications")
    } else {
      navigateTo("/portal#/notifications")
    }
  }

  return (
    <button
      className="notification-trigger"
      type="button"
      style={{ position: "relative" }}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      onClick={handleOpenNotifications}
    >
      <Icon name="bell" />

      {/* Red circle badge for unread count */}
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "3px",
            right: "3px",
            backgroundColor: "#d32f2f",
            color: "#ffffff",
            borderRadius: "9999px",
            minWidth: "18px",
            height: "18px",
            padding: "0 4px",
            fontSize: "11px",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            boxShadow: "0 0 0 2px #ffffff",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  )
}
