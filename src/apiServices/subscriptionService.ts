import axiosClient from './axiosClient';
import {
  API_ADMIN_SUBSCRIPTIONS_LIST,
  API_ADMIN_SUBSCRIPTIONS_SHOW,
} from './APIs';

// ============================================================
// TYPES
// ============================================================

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  applicant_id: string;
  invoice_id: string;
  payment_id: string | null;
  payment_confirmed_at: string | null;   // ISO8601
  starts_at: string | null;              // ISO8601
  ends_at: string | null;                // ISO8601
  status: SubscriptionStatus;
  days_remaining: number;                // computed server-side
  created_at: string | null;
  updated_at: string | null;
}

export interface SubscriptionFilters {
  applicant_id?: string;
  status?: SubscriptionStatus;
  sort?: string;                         // e.g. 'created_at', 'ends_at'
  order?: 'asc' | 'desc';
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  fieldErrors?: Record<string, string> | null;
}

export interface ApiSingleResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  fieldErrors?: Record<string, string> | null;
}

// ============================================================
// ERROR HANDLER (shared pattern with invoiceService)
// ============================================================

const handleError = (error: unknown, fallback: string) => {
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
    if (data.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([field, msgs]) => {
        fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
      });
    }
    return {
      success: false as const,
      message: data.message || fallback,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : null,
    };
  }

  return { success: false as const, message: fallback, fieldErrors: null };
};

// ============================================================
// SERVICE
// ============================================================

class SubscriptionService {
  // ============================================================
  // ADMIN
  // ============================================================

  // GET /api/v1/auth/admin/subscriptions/list
  async list(
    filters: SubscriptionFilters = {},
  ): Promise<ApiListResponse<Subscription>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_ADMIN_SUBSCRIPTIONS_LIST, {
        params: cleanParams,
      });

      const items: Subscription[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load subscriptions.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // GET /api/v1/auth/admin/subscriptions/show/{id}
  async show(id: string): Promise<ApiSingleResponse<Subscription>> {
    try {
      const res = await axiosClient.get(API_ADMIN_SUBSCRIPTIONS_SHOW(id));

      // Backend wraps in data.subscription (per SubscriptionActionResponseData),
      // but fall back to data itself in case the response shape is flattened.
      const subscription: Subscription | null =
        res.data?.data?.subscription ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: subscription,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load subscription.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
