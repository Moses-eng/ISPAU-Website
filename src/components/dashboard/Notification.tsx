// src/components/dashboard/Notification.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import systemUserAuthStore from "@/apiServices/systemUserAuthStore";
import {
  getNotificationServiceForCurrentRole,
  type StaffNotification,
  type StaffNotificationFilters,
} from "@/apiServices/notificationServiceResolver";
import type { AdminNotificationStatistics } from "@/apiServices/adminNotificationService";

type TabType = "all" | "unread" | "important";

export default function Notification() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [stats, setStats] = useState<AdminNotificationStatistics | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const [selectedNotification, setSelectedNotification] = useState<StaffNotification | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionInProgress, setActionInProgress] = useState(false);

  const isMounted = useRef(true);

  const timeAgo = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const getTypeTag = (type: string) => {
    switch (type) {
      case "success":
        return <span className="tag tag-success"><span className="tag-dot" /> Success</span>;
      case "warning":
        return <span className="tag tag-warning"><span className="tag-dot" /> Warning</span>;
      case "error":
        return <span className="tag tag-danger"><span className="tag-dot" /> Alert</span>;
      default:
        return <span className="tag tag-info"><span className="tag-dot" /> Information</span>;
    }
  };

  const fetchAllData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);

    const service = getNotificationServiceForCurrentRole();

    try {
      const [listRes, statsRes] = await Promise.all([
        service.list(),
        service.statistics(),
      ]);

      if (!isMounted.current) return;

      if (listRes.success) {
        setNotifications(listRes.data.items);
        setUnreadCount(listRes.data.unread_count);
      } else {
        setError(listRes.message);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch {
      if (isMounted.current) {
        setError("Failed to connect to the notification service.");
      }
    } finally {
      if (isMounted.current && showSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void fetchAllData(true);

    const interval = setInterval(() => {
      const service = getNotificationServiceForCurrentRole();
      void service.recent(1).then((res) => {
        if (res.success && isMounted.current) {
          setUnreadCount(res.data.unread_count);
        }
      });
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchAllData]);

  // Actions
  const handleMarkAsRead = async (notification: StaffNotification) => {
    if (notification.is_read) return;
    setActionInProgress(true);
    const service = getNotificationServiceForCurrentRole();
    const res = await service.markAsRead(notification.id);
    setActionInProgress(false);

    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (selectedNotification?.id === notification.id) {
        setSelectedNotification((prev) => (prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : null));
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setActionInProgress(true);
    const service = getNotificationServiceForCurrentRole();
    const res = await service.markAllAsRead();
    setActionInProgress(false);

    if (res.success) {
      setFeedback({ text: "All notifications marked as read." });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      void fetchAllData(false);
    } else {
      setFeedback({ text: res.message || "Failed to mark all as read.", error: true });
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionInProgress(true);
    const service = getNotificationServiceForCurrentRole();
    const res = await service.remove(id);
    setActionInProgress(false);

    if (res.success) {
      setFeedback({ text: "Notification deleted." });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      if (selectedNotification?.id === id) {
        setSelectedNotification(null);
      }
      void fetchAllData(false);
    } else {
      setFeedback({ text: res.message || "Failed to delete notification.", error: true });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setActionInProgress(true);
    const service = getNotificationServiceForCurrentRole();
    const res = await service.bulkDelete(selectedIds);
    setActionInProgress(false);

    if (res.success) {
      setFeedback({ text: `${selectedIds.length} notifications deleted.` });
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      void fetchAllData(false);
    } else {
      setFeedback({ text: res.message || "Bulk delete failed.", error: true });
    }
  };

  const handleViewDetails = (notification: StaffNotification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      void handleMarkAsRead(notification);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayNotifications.map((n) => n.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const displayNotifications = useMemo(() => {
    if (activeTab === "unread") return notifications.filter((n) => !n.is_read);
    if (activeTab === "important") return notifications.filter((n) => n.type === "warning" || n.type === "error");
    return notifications;
  }, [notifications, activeTab]);

  return (
    <div className="workspace-content">
      {/* Top Heading */}
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">ISPAU · Administration Portal</span>
          <h1>Admin Notifications</h1>
          <p>Real-time notifications regarding applications, verifications, system changes, and alerts.</p>
        </div>

        <div className="workspace-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleMarkAllAsRead}
              disabled={actionInProgress}
            >
              Mark all as read
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void fetchAllData(false)}
            disabled={actionInProgress}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`workspace-feedback ${feedback.error ? "error" : ""}`} role="alert">
          {feedback.text}
          <button type="button" aria-label="Dismiss feedback" onClick={() => setFeedback(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="workspace-summaries">
        <div className="workspace-summary">
          <span>Total Notifications</span>
          <strong>{stats?.total ?? notifications.length}</strong>
          <small>All items in ledger</small>
        </div>
        <div className="workspace-summary">
          <span>Unread</span>
          <strong>{stats?.unread ?? unreadCount}</strong>
          <small>{unreadCount > 0 ? "Pending review" : "Up to date"}</small>
        </div>
        <div className="workspace-summary">
          <span>Warnings / Errors</span>
          <strong>{(stats?.by_type?.warning || 0) + (stats?.by_type?.error || 0)}</strong>
          <small>High priority items</small>
        </div>
        <div className="workspace-summary">
          <span>Last 7 Days</span>
          <strong>{stats?.last_7_days ?? 0}</strong>
          <small>Recent activity</small>
        </div>
      </div>

      {/* Tabs */}
      <div className="credit-tabs" style={{ marginTop: "24px", marginBottom: "16px" }}>
        <button
          type="button"
          className={`btn ${activeTab === "all" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("all")}
        >
          All Updates <span className="count-badge">{notifications.length}</span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === "unread" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("unread")}
        >
          Unread <span className="count-badge">{unreadCount}</span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === "important" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("important")}
        >
          Important / Alerts
        </button>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div
          className="workspace-panel"
          style={{
            margin: "0 0 16px 0",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--burgundy-tint, #f9f2f4)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 600 }}>
            {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="workspace-actions" style={{ margin: 0 }}>
            <button
              type="button"
              className="btn btn-danger"
              style={{ minHeight: "36px", padding: "0 14px", fontSize: "12px" }}
              onClick={handleBulkDelete}
              disabled={actionInProgress}
            >
              Delete Selected
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: "36px", padding: "0 14px", fontSize: "12px" }}
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="workspace-panel" style={{ padding: "0 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            Loading notifications…
          </div>
        ) : error ? (
          <div className="workspace-empty">
            <h3>Unable to load notifications</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-secondary" onClick={() => void fetchAllData(true)}>
              Retry
            </button>
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="workspace-empty">
            <h3>No notifications found</h3>
            <p>
              {activeTab === "unread"
                ? "You have no unread notifications."
                : activeTab === "important"
                ? "No high-priority notifications recorded."
                : "No notifications found."}
            </p>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 0 10px",
                borderBottom: "1px solid var(--border)",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === displayNotifications.length && displayNotifications.length > 0}
                  onChange={toggleSelectAll}
                />
                Select All
              </label>
            </div>

            <div className="notification-list">
              {displayNotifications.map((n) => (
                <div
                  key={n.id}
                  className="notification-item"
                  onClick={() => handleViewDetails(n)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: !n.is_read ? "#faf5f7" : "transparent",
                    padding: "16px 12px",
                    borderRadius: "6px",
                    transition: "background 0.15s ease",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div style={{ paddingTop: "3px" }} onClick={(e) => toggleSelectOne(n.id, e)}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(n.id)}
                      onChange={() => {}}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong
                        style={{
                          fontSize: "14px",
                          color: "var(--text)",
                          fontWeight: !n.is_read ? 700 : 500,
                        }}
                      >
                        {n.title}
                      </strong>

                      {getTypeTag(n.type)}

                      {!n.is_read && (
                        <span className="tag" style={{ background: "#fceaea", color: "#a43b3b", fontSize: "10px" }}>
                          NEW
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--muted)",
                        marginTop: "6px",
                        lineHeight: 1.5,
                      }}
                    >
                      {n.message.length > 140 ? `${n.message.slice(0, 140)}…` : n.message}
                    </p>

                    <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "11px", color: "var(--muted)" }}>
                      {n.applicant_name && <span>Applicant: <strong>{n.applicant_name}</strong></span>}
                      {n.applicant_email && <span>({n.applicant_email})</span>}
                      <span>{timeAgo(n.created_at)}</span>
                      {n.read_at && <span>• Read {timeAgo(n.read_at)}</span>}
                    </div>
                  </div>

                  <div className="workspace-actions" style={{ margin: 0, gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                    {!n.is_read && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ minHeight: "34px", padding: "0 10px", fontSize: "11px" }}
                        onClick={() => void handleMarkAsRead(n)}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ minHeight: "34px", padding: "0 10px", fontSize: "11px" }}
                      onClick={(e) => void handleDelete(n.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {selectedNotification && (
        <div
          className="portal-backdrop"
          onClick={() => setSelectedNotification(null)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            className="workspace-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", maxWidth: "600px", width: "100%" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2>{selectedNotification.title}</h2>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
                  {getTypeTag(selectedNotification.type)}
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Received: {formatDateTime(selectedNotification.created_at)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: "32px", padding: "0 10px" }}
                onClick={() => setSelectedNotification(null)}
              >
                ✕
              </button>
            </div>

            {selectedNotification.applicant_name && (
              <div
                style={{
                  background: "#f8fafc",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                <strong>Applicant:</strong> {selectedNotification.applicant_name}{" "}
                {selectedNotification.applicant_email && (
                  <span style={{ color: "var(--muted)" }}>({selectedNotification.applicant_email})</span>
                )}
              </div>
            )}

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "16px 0" }} />

            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: "var(--text)",
                whiteSpace: "pre-wrap",
                marginBottom: "24px",
              }}
            >
              {selectedNotification.message}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                fontSize: "12px",
                color: "var(--muted)",
                borderTop: "1px solid var(--border)",
                paddingTop: "16px",
              }}
            >
              <span>
                Status: {selectedNotification.is_read ? `Read on ${formatDateTime(selectedNotification.read_at)}` : "Unread"}
              </span>

              <div className="workspace-actions" style={{ margin: 0 }}>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void handleDelete(selectedNotification.id)}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
