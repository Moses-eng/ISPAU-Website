import { navigateTo } from "@/app/navigation";
import { useApplicantPortal, syncPortalNotices } from "@/features/portal/services/useApplicantPortal";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import authStore from "@/apiServices/authStore";
import applicantNotificationService, {
  type ApplicantNotification,
  type ApplicantNotificationStatistics,
  type ApplicantNotificationType,
} from "@/apiServices/applicantNotificationService";
import type { View } from "@/types/View";

interface NotificationsProps {go?: (view: View) => void;}

type TabType = "all" | "unread" | "important";

export default function Notifications({ go }: NotificationsProps) {
  const portal = useApplicantPortal();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const [notifications, setNotifications] = useState<ApplicantNotification[]>([]);
  const [stats, setStats] = useState<ApplicantNotificationStatistics | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const [selectedNotification, setSelectedNotification] = useState<ApplicantNotification | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionInProgress, setActionInProgress] = useState(false);

  const isMounted = useRef(true);
  const applicantId = authStore.getUserId();

  // Helper for relative timestamps
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

  // Helper tag styling
  const getTypeTag = (type: ApplicantNotificationType) => {
    switch (type) {
      case "success":
        return <span className="tag tag-success"><span className="tag-dot" /> Success</span>;
      case "warning":
        return <span className="tag tag-warning"><span className="tag-dot" /> Attention</span>;
      case "error":
        return <span className="tag tag-danger"><span className="tag-dot" /> Alert</span>;
      default:
        return <span className="tag tag-info"><span className="tag-dot" /> Information</span>;
    }
  };

  // ==================== Data Fetching ====================

  const fetchUnreadCountOnly = useCallback(async () => {
    if (!applicantId) return;
    const res = await applicantNotificationService.recent(applicantId, 1);
    if (res.success && isMounted.current) {
      setUnreadCount(res.data.unread_count);
    }
  }, [applicantId]);

  const fetchAllData = useCallback(
    async (showSpinner = true) => {
      if (!applicantId) {
        setLoading(false);
        setError("Applicant session ID not found. Please log in.");
        return;
      }

      if (showSpinner) setLoading(true);
      setError(null);

      try {
        const [listRes, statsRes] = await Promise.all([
          applicantNotificationService.list(applicantId),
          applicantNotificationService.statistics(applicantId),
        ]);

        if (!isMounted.current) return;

        if (listRes.success) {
          setNotifications(listRes.data.items);
          syncPortalNotices(applicantId, { items: listRes.data.items });
          setUnreadCount(listRes.data.unread_count);
        } else {
          setError(listRes.message);
        }

        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (err: unknown) {
        if (isMounted.current) {
          setError("Failed to connect to the notification service.");
        }
      } finally {
        if (isMounted.current && showSpinner) {
          setLoading(false);
        }
      }
    },
    [applicantId]
  );

  useEffect(() => {
    isMounted.current = true;
    void fetchAllData(true);

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      void fetchUnreadCountOnly();
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchAllData, fetchUnreadCountOnly]);

  // ==================== Actions ====================

  const handleMarkAsRead = async (notification: ApplicantNotification) => {
    if (notification.is_read) return;
    setActionInProgress(true);
    const res = await applicantNotificationService.markAsRead(notification.id);
    setActionInProgress(false);

    if (res.success) {
      if (applicantId) syncPortalNotices(applicantId, { readIds: [notification.id] });
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
    if (!applicantId || unreadCount === 0) return;
    setActionInProgress(true);
    const res = await applicantNotificationService.markAllAsRead(applicantId);
    setActionInProgress(false);

    if (res.success) {
      syncPortalNotices(applicantId, { allRead: true });
      setFeedback({ text: "All notifications marked as read." });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      void fetchAllData(false);
    } else {
      setFeedback({ text: res.message || "Failed to mark all as read.", error: true });
    }
  };

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionInProgress(true);
    const res = await applicantNotificationService.remove(id);
    setActionInProgress(false);

    if (res.success) {
      if (applicantId) syncPortalNotices(applicantId, { removeIds: [id] });
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
    const res = await applicantNotificationService.bulkDelete(selectedIds);
    setActionInProgress(false);

    if (res.success) {
      if (applicantId) syncPortalNotices(applicantId, { removeIds: selectedIds });
      setFeedback({ text: `${selectedIds.length} notifications deleted.` });
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      void fetchAllData(false);
    } else {
      setFeedback({ text: res.message || "Bulk delete failed.", error: true });
    }
  };

  const handleViewDetails = (notification: ApplicantNotification) => {
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

  const toggleSelectOne = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Filtered views
  const displayNotifications = useMemo(() => {
    if (activeTab === "unread") return notifications.filter((n) => !n.is_read);
    if (activeTab === "important") return notifications.filter((n) => n.type === "warning" || n.type === "error");
    return notifications;
  }, [notifications, activeTab]);

  // ==================== Render ====================

  if (!authStore.isAuthenticated()) {
    return (
      <main className="workspace-demo-login">
        <div className="access-denied">
          <div>
            <h3>Sign in required</h3>
            <p>Please log in to view your organisation's notification feed.</p>
          </div>
          <button className="btn btn-primary" onClick={() => go?.("login")}>
            Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="workspace-content">
      {/* Top Heading */}
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">ISPAU · Member Portal</span>
          <h1>Notifications</h1>
          <p>Important updates regarding your membership application, verification stages, and announcements.</p>
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

      {/* Notice / Feedback */}
      {feedback && (
        <div className={`workspace-feedback ${feedback.error ? "error" : ""}`} role="alert">
          {feedback.text}
          <button type="button" aria-label="Dismiss feedback" onClick={() => setFeedback(null)}>
            ✕
          </button>
        </div>
      )}

      {portal.unreadInvoices > 0 && <section className="workspace-panel" aria-label="Unread invoices">
        <h2>Unread invoices <span className="count-badge">{portal.unreadInvoices}</span></h2>
        {portal.invoices.filter(portal.invoiceUnread).map(invoice => <article className="notification-item" key={invoice.id}>
          <div><strong>{invoice.id}</strong><p>{[invoice.currency, invoice.total].filter(Boolean).join(" ")}</p></div>
          <button type="button" className="btn btn-secondary" onClick={() => navigateTo(`/portal#/invoices?invoice=${encodeURIComponent(invoice.id)}`)}>View invoice</button>
        </article>)}
      </section>}

      {/* Summary Statistics */}
      <div className="workspace-summaries">
        <div className="workspace-summary">
          <span>Total Notifications</span>
          <strong>{stats?.total ?? notifications.length}</strong>
          <small>All updates received</small>
        </div>
        <div className="workspace-summary">
          <span>Unread Updates</span>
          <strong>{stats?.unread ?? unreadCount}</strong>
          <small>{unreadCount > 0 ? "Requires review" : "Up to date"}</small>
        </div>
        <div className="workspace-summary">
          <span>Action Required</span>
          <strong>{(stats?.by_type?.warning || 0) + (stats?.by_type?.error || 0)}</strong>
          <small>Warnings or revision items</small>
        </div>
        <div className="workspace-summary">
          <span>Last 7 Days</span>
          <strong>{stats?.last_7_days ?? 0}</strong>
          <small>Recent notifications</small>
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
          Important / Warnings
        </button>
      </div>

      {/* Batch Action Bar if items selected */}
      {selectedIds.length > 0 && (
        <div
          className="workspace-panel"
          style={{
            margin: "0 0 16px 0",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--burgundy-tint)",
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

      {/* Notifications List Container */}
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
                : "Your notifications feed is currently empty."}
            </p>
          </div>
        ) : (
          <div>
            {/* Header select-all row */}
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

            {/* List Items */}
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
                  }}
                >
                  {/* Select Checkbox */}
                  <div
                    style={{ paddingTop: "2px" }}
                    onClick={(e) => toggleSelectOne(n.id, e)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(n.id)}
                      onChange={() => {}}
                    />
                  </div>

                  {/* Notification Content */}
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
                      <span>{timeAgo(n.created_at)}</span>
                      {n.read_at && <span>• Read {timeAgo(n.read_at)}</span>}
                    </div>
                  </div>

                  {/* Actions on Item */}
                  <div className="workspace-actions" style={{ margin: 0, gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                    {!n.is_read && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ minHeight: "34px", padding: "0 10px", fontSize: "11px" }}
                        title="Mark as Read"
                        onClick={() => void handleMarkAsRead(n)}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ minHeight: "34px", padding: "0 10px", fontSize: "11px" }}
                      title="Delete"
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

      {/* ==================== View Details Modal Dialog ==================== */}
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
            style={{ position: "relative" }}
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
                  Delete Notification
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
