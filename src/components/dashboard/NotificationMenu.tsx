// src/components/dashboard/NotificationMenu.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getNotificationServiceForCurrentRole, type StaffNotification } from "@/apiServices/notificationServiceResolver";

interface NotificationMenuProps {
  onNavigate: (route: string) => void;
}

export default function NotificationMenu({ onNavigate }: NotificationMenuProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchRecent = useCallback(async () => {
    try {
      const service = getNotificationServiceForCurrentRole();
      const res = await service.recent(5);
      if (res.success && res.data) {
        setNotifications(res.data.items);
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      // Silently catch in polling
    }
  }, []);

  useEffect(() => {
    void fetchRecent();
    const interval = setInterval(() => {
      void fetchRecent();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchRecent]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const service = getNotificationServiceForCurrentRole();
    const res = await service.markAsRead(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleItemClick = (notification: StaffNotification) => {
    setOpen(false);
    if (!notification.is_read) {
      const service = getNotificationServiceForCurrentRole();
      void service.markAsRead(notification.id);
    }
    onNavigate("notifications");
  };

  return (
    <div className="relative inline-block" ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-secondary"
        style={{
          position: "relative",
          padding: "8px 12px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) void fetchRecent();
        }}
        aria-label="Open notifications menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              backgroundColor: "#d32f2f",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 700,
              borderRadius: "10px",
              padding: "1px 6px",
              lineHeight: "14px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "340px",
            background: "#ffffff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            borderRadius: "8px",
            zIndex: 1000,
            border: "1px solid var(--border, #e2e8f0)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border, #e2e8f0)",
            }}
          >
            <strong style={{ fontSize: "14px" }}>Notifications</strong>
            {unreadCount > 0 && (
              <span className="tag tag-danger" style={{ fontSize: "11px" }}>
                {unreadCount} unread
              </span>
            )}
          </div>

          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted, #64748b)", fontSize: "13px" }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border, #f1f5f9)",
                    cursor: "pointer",
                    backgroundColor: !n.is_read ? "#faf5f7" : "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: !n.is_read ? 700 : 500, color: "var(--text, #1e293b)" }}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={(e) => void handleMarkAsRead(n.id, e)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary, #881337)",
                          fontSize: "11px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted, #64748b)", lineHeight: 1.4 }}>
                    {n.message.length > 75 ? `${n.message.slice(0, 75)}…` : n.message}
                  </p>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: "10px 16px",
              textAlign: "center",
              background: "#f8fafc",
              borderTop: "1px solid var(--border, #e2e8f0)",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", fontSize: "12px", minHeight: "32px" }}
              onClick={() => {
                setOpen(false);
                onNavigate("notifications");
              }}
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
