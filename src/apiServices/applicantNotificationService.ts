import axiosClient from "./axiosClient";
import {
  API_APPLICANT_NOTIFICATIONS_LIST,
  API_APPLICANT_NOTIFICATIONS_RECENT,
  API_APPLICANT_NOTIFICATIONS_STATISTICS,
  API_APPLICANT_NOTIFICATIONS_MARK_ALL_READ,
  API_APPLICANT_NOTIFICATIONS_STORE,
  API_APPLICANT_NOTIFICATIONS_BULK_DELETE,
  API_APPLICANT_NOTIFICATIONS_SHOW,
  API_APPLICANT_NOTIFICATIONS_MARK_READ,
  API_APPLICANT_NOTIFICATIONS_DELETE,
} from "./APIs";

// ============================================================
// Types
// ============================================================

export type ApplicantNotificationType = "info" | "warning" | "success" | "error";

export interface ApplicantNotification {
  id: number;
  applicant_id: string;
  applicant_name: string | null;
  title: string;
  message: string;
  type: ApplicantNotificationType;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApplicantNotificationPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApplicantNotificationFilters {
  is_read?: boolean | "" | 0 | 1;
  type?: ApplicantNotificationType;
  from_date?: string;
  to_date?: string;
  search?: string;
  per_page?: number;
  [key: string]: unknown;
}

export interface ApplicantNotificationStatistics {
  total: number;
  unread: number;
  read: number;
  by_type: Record<ApplicantNotificationType, number>;
  last_7_days: number;
}

export interface ApplicantNotificationListData {
  items: ApplicantNotification[];
  pagination: ApplicantNotificationPagination | null;
  unread_count: number;
}

export interface ApplicantNotificationRecentData {
  items: ApplicantNotification[];
  unread_count: number;
}

export interface CreateApplicantNotificationPayload {
  title: string;
  message: string;
  type: ApplicantNotificationType;
  applicant_id: string;
  applicant_name?: string;
}

export interface ApiNotificationListResponse {
  success: boolean;
  message: string;
  data: ApplicantNotificationListData;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiNotificationRecentResponse {
  success: boolean;
  message: string;
  data: ApplicantNotificationRecentData;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiNotificationStatisticsResponse {
  success: boolean;
  message: string;
  data: ApplicantNotificationStatistics | null;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiNotificationSingleResponse {
  success: boolean;
  message: string;
  data: ApplicantNotification | null;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiNotificationActionResponse {
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

class ApplicantNotificationService {
  /**
   * GET /api/v1/applicant/notifications/list/{applicantId}
   * Returns paginated notifications + unread_count.
   */
  async list(
    applicantId: string,
    filters: ApplicantNotificationFilters = {},
  ): Promise<ApiNotificationListResponse> {
    const empty: ApplicantNotificationListData = {
      items: [],
      pagination: null,
      unread_count: 0,
    };

    try {
      const res = await axiosClient.get(
        API_APPLICANT_NOTIFICATIONS_LIST(applicantId),
        { params: cleanParams(filters) },
      );

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

  /**
   * GET /api/v1/applicant/notifications/recent/{applicantId}
   */
  async recent(
    applicantId: string,
    limit = 6,
  ): Promise<ApiNotificationRecentResponse> {
    const empty: ApplicantNotificationRecentData = {
      items: [],
      unread_count: 0,
    };

    try {
      const res = await axiosClient.get(
        API_APPLICANT_NOTIFICATIONS_RECENT(applicantId),
        { params: cleanParams({ limit }) },
      );

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
        message:
          body.message ?? "Recent notifications fetched successfully.",
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

  /**
   * GET /api/v1/applicant/notifications/statistics/{applicantId}
   */
  async statistics(
    applicantId: string,
  ): Promise<ApiNotificationStatisticsResponse> {
    try {
      const res = await axiosClient.get(
        API_APPLICANT_NOTIFICATIONS_STATISTICS(applicantId),
      );

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
        data: (body.data ?? null) as ApplicantNotificationStatistics | null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to fetch statistics.");
      return { success: false, message: e.message, data: null };
    }
  }

  /**
   * GET /api/v1/applicant/notifications/{id}
   */
  async show(id: string | number): Promise<ApiNotificationSingleResponse> {
    try {
      const res = await axiosClient.get(API_APPLICANT_NOTIFICATIONS_SHOW(id));

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
        data: (payload.notification ?? payload) as ApplicantNotification | null,
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

  /**
   * POST /api/v1/applicant/notifications/store
   */
  async create(
    payload: CreateApplicantNotificationPayload,
  ): Promise<ApiNotificationSingleResponse> {
    try {
      const res = await axiosClient.post(
        API_APPLICANT_NOTIFICATIONS_STORE,
        payload,
      );

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
        data: (data.notification ?? data) as ApplicantNotification | null,
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

  /**
   * PUT /api/v1/applicant/notifications/{id}/read
   */
  async markAsRead(
    id: string | number,
  ): Promise<ApiNotificationSingleResponse> {
    try {
      const res = await axiosClient.put(
        API_APPLICANT_NOTIFICATIONS_MARK_READ(id),
      );

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
        data: (data.notification ?? data) as ApplicantNotification | null,
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

  /**
   * PUT /api/v1/applicant/notifications/mark-all-read/{applicantId}
   */
  async markAllAsRead(
    applicantId: string,
  ): Promise<ApiNotificationActionResponse> {
    try {
      const res = await axiosClient.put(
        API_APPLICANT_NOTIFICATIONS_MARK_ALL_READ(applicantId),
      );

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
      const e = handleError(
        error,
        "Failed to mark all notifications as read.",
      );
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /**
   * DELETE /api/v1/applicant/notifications/{id}
   */
  async remove(id: string | number): Promise<ApiNotificationActionResponse> {
    try {
      const res = await axiosClient.delete(
        API_APPLICANT_NOTIFICATIONS_DELETE(id),
      );

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      return {
        success: ok,
        message:
          body.message ??
          (ok ? "Notification deleted successfully." : "Failed to delete notification."),
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

  /**
   * POST /api/v1/applicant/notifications/bulk-delete
   */
  async bulkDelete(
    ids: Array<string | number>,
  ): Promise<ApiNotificationActionResponse> {
    try {
      const res = await axiosClient.post(
        API_APPLICANT_NOTIFICATIONS_BULK_DELETE,
        { ids },
      );

      const body = res.data ?? {};
      const ok = body.success === true || body.status === "success";
      return {
        success: ok,
        message:
          body.message ??
          (ok ? "Notifications deleted successfully." : "Failed to delete notifications."),
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

export const applicantNotificationService = new ApplicantNotificationService();
export default applicantNotificationService;
