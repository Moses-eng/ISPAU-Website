import axiosClient from "./axiosClient";
import {
  API_OPERATIONS_OFFICER_NOTIFICATIONS_LIST,
  API_OPERATIONS_OFFICER_NOTIFICATIONS_RECENT,
  API_OPERATIONS_OFFICER_NOTIFICATIONS_STATISTICS,
  API_OPERATIONS_OFFICER_NOTIFICATIONS_MARK_ALL_READ,
  API_OPERATIONS_OFFICER_NOTIFICATIONS_STORE,
  API_OPERATIONS_OFFICER_NOTIFICATIONS_BULK_DELETE,
  API_OPERATIONS_OFFICER_NOTIFICATIONS_SHOW,
  API_OPERATIONS_OFFICER_NOTIFICATIONS_MARK_READ,
  API_OPERATIONS_OFFICER_NOTIFICATIONS_DELETE,
} from "./APIs";

// ============================================================
// Types
// ============================================================

export type OperationsOfficerNotificationType = "info" | "warning" | "success" | "error";

export interface OperationsOfficerNotification {
  id: string;
  applicant_id: string;
  applicant_name: string | null;
  applicant_email: string | null;
  title: string;
  message: string;
  type: OperationsOfficerNotificationType;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OperationsOfficerNotificationPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface OperationsOfficerNotificationFilters {
  is_read?: boolean | "" | 0 | 1;
  type?: OperationsOfficerNotificationType;
  applicant_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  per_page?: number;
  [key: string]: unknown;
}

export interface OperationsOfficerNotificationStatistics {
  total: number;
  unread: number;
  read: number;
  by_type: Record<OperationsOfficerNotificationType, number>;
  last_7_days: number;
}

export interface OperationsOfficerNotificationListData {
  items: OperationsOfficerNotification[];
  pagination: OperationsOfficerNotificationPagination | null;
  unread_count: number;
}

export interface OperationsOfficerNotificationRecentData {
  items: OperationsOfficerNotification[];
  unread_count: number;
}

export interface CreateOperationsOfficerNotificationPayload {
  title: string;
  message: string;
  type: OperationsOfficerNotificationType;
  applicant_id: string;
  applicant_name?: string;
  applicant_email?: string;
}

export interface ApiOperationsOfficerNotificationListResponse {
  success: boolean;
  message: string;
  data: OperationsOfficerNotificationListData;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiOperationsOfficerNotificationRecentResponse {
  success: boolean;
  message: string;
  data: OperationsOfficerNotificationRecentData;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiOperationsOfficerNotificationStatisticsResponse {
  success: boolean;
  message: string;
  data: OperationsOfficerNotificationStatistics | null;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiOperationsOfficerNotificationSingleResponse {
  success: boolean;
  message: string;
  data: OperationsOfficerNotification | null;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiOperationsOfficerNotificationActionResponse {
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

class OperationsOfficerNotificationService {
  /** GET /api/v1/operations-officer/notifications */
  async list(
    filters: OperationsOfficerNotificationFilters = {},
  ): Promise<ApiOperationsOfficerNotificationListResponse> {
    const empty: OperationsOfficerNotificationListData = {
      items: [],
      pagination: null,
      unread_count: 0,
    };

    try {
      const res = await axiosClient.get(API_OPERATIONS_OFFICER_NOTIFICATIONS_LIST, {
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

  /** GET /api/v1/operations-officer/notifications/recent */
  async recent(limit = 6): Promise<ApiOperationsOfficerNotificationRecentResponse> {
    const empty: OperationsOfficerNotificationRecentData = {
      items: [],
      unread_count: 0,
    };

    try {
      const res = await axiosClient.get(API_OPERATIONS_OFFICER_NOTIFICATIONS_RECENT, {
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

  /** GET /api/v1/operations-officer/notifications/statistics */
  async statistics(): Promise<ApiOperationsOfficerNotificationStatisticsResponse> {
    try {
      const res = await axiosClient.get(API_OPERATIONS_OFFICER_NOTIFICATIONS_STATISTICS);

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
        data: (body.data ?? null) as OperationsOfficerNotificationStatistics | null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to fetch statistics.");
      return { success: false, message: e.message, data: null };
    }
  }

  /** GET /api/v1/operations-officer/notifications/{id} */
  async show(id: string): Promise<ApiOperationsOfficerNotificationSingleResponse> {
    try {
      const res = await axiosClient.get(API_OPERATIONS_OFFICER_NOTIFICATIONS_SHOW(id));

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
        data: (payload.notification ?? payload) as OperationsOfficerNotification | null,
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

  /** POST /api/v1/operations-officer/notifications/store */
  async create(
    payload: CreateOperationsOfficerNotificationPayload,
  ): Promise<ApiOperationsOfficerNotificationSingleResponse> {
    try {
      const res = await axiosClient.post(API_OPERATIONS_OFFICER_NOTIFICATIONS_STORE, payload);

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
        data: (data.notification ?? data) as OperationsOfficerNotification | null,
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

  /** PUT /api/v1/operations-officer/notifications/{id}/read */
  async markAsRead(id: string): Promise<ApiOperationsOfficerNotificationSingleResponse> {
    try {
      const res = await axiosClient.put(API_OPERATIONS_OFFICER_NOTIFICATIONS_MARK_READ(id));

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
        data: (data.notification ?? data) as OperationsOfficerNotification | null,
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

  /** PUT /api/v1/operations-officer/notifications/mark-all-read */
  async markAllAsRead(): Promise<ApiOperationsOfficerNotificationActionResponse> {
    try {
      const res = await axiosClient.put(API_OPERATIONS_OFFICER_NOTIFICATIONS_MARK_ALL_READ);

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

  /** DELETE /api/v1/operations-officer/notifications/{id} */
  async remove(id: string): Promise<ApiOperationsOfficerNotificationActionResponse> {
    try {
      const res = await axiosClient.delete(API_OPERATIONS_OFFICER_NOTIFICATIONS_DELETE(id));

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

  /** POST /api/v1/operations-officer/notifications/bulk-delete */
  async bulkDelete(
    ids: string[],
  ): Promise<ApiOperationsOfficerNotificationActionResponse> {
    try {
      const res = await axiosClient.post(API_OPERATIONS_OFFICER_NOTIFICATIONS_BULK_DELETE, {
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

export const operationsOfficerNotificationService = new OperationsOfficerNotificationService();
export default operationsOfficerNotificationService;
