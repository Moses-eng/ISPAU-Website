import axiosClient from "./axiosClient";
import {
  API_ADMIN_NOTIFICATIONS_LIST,
  API_ADMIN_NOTIFICATIONS_RECENT,
  API_ADMIN_NOTIFICATIONS_STATISTICS,
  API_ADMIN_NOTIFICATIONS_MARK_ALL_READ,
  API_ADMIN_NOTIFICATIONS_STORE,
  API_ADMIN_NOTIFICATIONS_BULK_DELETE,
  API_ADMIN_NOTIFICATIONS_SHOW,
  API_ADMIN_NOTIFICATIONS_MARK_READ,
  API_ADMIN_NOTIFICATIONS_DELETE,
} from "./APIs";

// ============================================================
// Types
// ============================================================

export type AdminNotificationType = "info" | "warning" | "success" | "error";

export interface AdminNotification {
  id: string;
  applicant_id: string;
  applicant_name: string | null;
  applicant_email: string | null;
  title: string;
  message: string;
  type: AdminNotificationType;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminNotificationPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface AdminNotificationFilters {
  is_read?: boolean | "" | 0 | 1;
  type?: AdminNotificationType;
  applicant_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  per_page?: number;
  [key: string]: unknown;
}

export interface AdminNotificationStatistics {
  total: number;
  unread: number;
  read: number;
  by_type: Record<AdminNotificationType, number>;
  last_7_days: number;
}

export interface AdminNotificationListData {
  items: AdminNotification[];
  pagination: AdminNotificationPagination | null;
  unread_count: number;
}

export interface AdminNotificationRecentData {
  items: AdminNotification[];
  unread_count: number;
}

export interface CreateAdminNotificationPayload {
  title: string;
  message: string;
  type: AdminNotificationType;
  applicant_id: string;
  applicant_name?: string;
  applicant_email?: string;
}

export interface ApiAdminNotificationListResponse {
  success: boolean;
  message: string;
  data: AdminNotificationListData;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiAdminNotificationRecentResponse {
  success: boolean;
  message: string;
  data: AdminNotificationRecentData;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiAdminNotificationStatisticsResponse {
  success: boolean;
  message: string;
  data: AdminNotificationStatistics | null;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiAdminNotificationSingleResponse {
  success: boolean;
  message: string;
  data: AdminNotification | null;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiAdminNotificationActionResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown> | null;
  fieldErrors?: Record<string, string> | null;
}

// ============================================================
// Error handler
// ============================================================

const handleError = (
  error: unknown,
  fallback: string,
): {
  success: false;
  message: string;
  data: null;
  fieldErrors: Record<string, string> | null;
} => {
  const e = error as {
    response?: {
      status?: number;
      data?: { message?: string; errors?: Record<string, string[]> };
    };
    request?: unknown;
  };

  if (e?.response) {
    const data = e.response.data ?? {};
    const fieldErrors: Record<string, string> = {};

    if (data.errors && typeof data.errors === "object") {
      Object.entries(data.errors).forEach(([field, msgs]) => {
        fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
      });
    }

    return {
      success: false,
      message:
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : fallback,
      data: null,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : null,
    };
  }

  if (e?.request) {
    return {
      success: false,
      message: "Network error. Please check your connection.",
      data: null,
      fieldErrors: null,
    };
  }

  return { success: false, message: fallback, data: null, fieldErrors: null };
};

const cleanParams = (filters: Record<string, unknown> = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== "" && v !== null,
    ),
  );

// ============================================================
// Service
// ============================================================

class AdminNotificationService {
  /** GET /api/v1/admin/notifications */
  async list(
    filters: AdminNotificationFilters = {},
  ): Promise<ApiAdminNotificationListResponse> {
    const empty: AdminNotificationListData = {
      items: [],
      pagination: null,
      unread_count: 0,
    };

    try {
      const res = await axiosClient.get(API_ADMIN_NOTIFICATIONS_LIST, {
        params: cleanParams(filters),
      });

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      if (!ok) {
        return {
          success: false,
          message: body.message ?? "Failed to fetch notifications.",
          data: empty,
        };
      }

      const payload = body.data ?? {};
      return {
        success: true,
        message: body.message ?? "Notifications fetched successfully.",
        data: {
          items: Array.isArray(payload.items) ? payload.items : [],
          pagination: payload.pagination ?? null,
          unread_count:
            typeof payload.unread_count === "number"
              ? payload.unread_count
              : 0,
        },
      };
    } catch (error) {
      const e = handleError(error, "Failed to fetch notifications.");
      return { success: false, message: e.message, data: empty };
    }
  }

  /** GET /api/v1/admin/notifications/recent */
  async recent(limit = 6): Promise<ApiAdminNotificationRecentResponse> {
    const empty: AdminNotificationRecentData = {
      items: [],
      unread_count: 0,
    };

    try {
      const res = await axiosClient.get(API_ADMIN_NOTIFICATIONS_RECENT, {
        params: cleanParams({ limit }),
      });

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      if (!ok) {
        return {
          success: false,
          message: body.message ?? "Failed to fetch recent notifications.",
          data: empty,
        };
      }

      const payload = body.data ?? {};
      return {
        success: true,
        message: body.message ?? "Recent notifications fetched successfully.",
        data: {
          items: Array.isArray(payload.items) ? payload.items : [],
          unread_count:
            typeof payload.unread_count === "number"
              ? payload.unread_count
              : 0,
        },
      };
    } catch (error) {
      const e = handleError(error, "Failed to fetch recent notifications.");
      return { success: false, message: e.message, data: empty };
    }
  }

  /** GET /api/v1/admin/notifications/statistics */
  async statistics(): Promise<ApiAdminNotificationStatisticsResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_NOTIFICATIONS_STATISTICS);

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      if (!ok) {
        return {
          success: false,
          message: body.message ?? "Failed to fetch statistics.",
          data: null,
        };
      }

      return {
        success: true,
        message: body.message ?? "Statistics fetched successfully.",
        data: (body.data ?? null) as AdminNotificationStatistics | null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to fetch statistics.");
      return { success: false, message: e.message, data: null };
    }
  }

  /** GET /api/v1/admin/notifications/{id} */
  async show(id: string): Promise<ApiAdminNotificationSingleResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_NOTIFICATIONS_SHOW(id));

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      if (!ok) {
        return {
          success: false,
          message: body.message ?? "Failed to fetch notification.",
          data: null,
        };
      }

      const payload = body.data ?? {};
      return {
        success: true,
        message: body.message ?? "Notification fetched successfully.",
        data: (payload.notification ?? payload) as AdminNotification | null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to fetch notification.");
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /** POST /api/v1/admin/notifications/store */
  async create(
    payload: CreateAdminNotificationPayload,
  ): Promise<ApiAdminNotificationSingleResponse> {
    try {
      const res = await axiosClient.post(API_ADMIN_NOTIFICATIONS_STORE, payload);

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      if (!ok) {
        return {
          success: false,
          message: body.message ?? "Failed to create notification.",
          data: null,
        };
      }

      const data = body.data ?? {};
      return {
        success: true,
        message: body.message ?? "Notification created successfully.",
        data: (data.notification ?? data) as AdminNotification | null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to create notification.");
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /** PUT /api/v1/admin/notifications/{id}/read */
  async markAsRead(id: string): Promise<ApiAdminNotificationSingleResponse> {
    try {
      const res = await axiosClient.put(API_ADMIN_NOTIFICATIONS_MARK_READ(id));

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      if (!ok) {
        return {
          success: false,
          message: body.message ?? "Failed to mark notification as read.",
          data: null,
        };
      }

      const data = body.data ?? {};
      return {
        success: true,
        message: body.message ?? "Notification marked as read.",
        data: (data.notification ?? data) as AdminNotification | null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to mark notification as read.");
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /** PUT /api/v1/admin/notifications/mark-all-read */
  async markAllAsRead(): Promise<ApiAdminNotificationActionResponse> {
    try {
      const res = await axiosClient.put(API_ADMIN_NOTIFICATIONS_MARK_ALL_READ);

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      return {
        success: ok,
        message:
          body.message ??
          (ok
            ? "All notifications marked as read."
            : "Failed to mark all notifications as read."),
        data: body.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to mark all notifications as read.");
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /** DELETE /api/v1/admin/notifications/{id} */
  async remove(id: string): Promise<ApiAdminNotificationActionResponse> {
    try {
      const res = await axiosClient.delete(API_ADMIN_NOTIFICATIONS_DELETE(id));

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      return {
        success: ok,
        message:
          body.message ??
          (ok
            ? "Notification deleted successfully."
            : "Failed to delete notification."),
        data: body.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to delete notification.");
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /** POST /api/v1/admin/notifications/bulk-delete */
  async bulkDelete(
    ids: string[],
  ): Promise<ApiAdminNotificationActionResponse> {
    try {
      const res = await axiosClient.post(API_ADMIN_NOTIFICATIONS_BULK_DELETE, {
        ids,
      });

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      return {
        success: ok,
        message:
          body.message ??
          (ok
            ? "Notifications deleted successfully."
            : "Failed to delete notifications."),
        data: body.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to delete notifications.");
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const adminNotificationService = new AdminNotificationService();
export default adminNotificationService;
