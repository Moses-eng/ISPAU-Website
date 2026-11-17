import axiosClient from './axiosClient';
import {
  API_ADMIN_TIERS_LIST,
  API_ADMIN_TIERS_SHOW,
  API_PUBLIC_TIERS_STORE,
  API_ADMIN_TIERS_UPDATE,
  API_ADMIN_TIERS_DELETE,
} from './APIs';

// ============================================================
// TYPES
// ============================================================

export type TierStatus = 'active' | 'inactive' | 'archived';

export interface Tier {
  id: string;
  name: string;
  cost: number;
  description: string | null;
  status: TierStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface TierFilters {
  search?: string;
  status?: TierStatus;
  min_cost?: number;
  max_cost?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface TierCreatePayload {
  name: string;
  cost: number;
  description?: string | null;
  status?: TierStatus;
}

export interface TierUpdatePayload {
  name?: string;
  cost?: number;
  description?: string | null;
  status?: TierStatus;
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

export interface ApiMutationResponse {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string> | null;
}

// ============================================================
// ERROR HANDLER (shared pattern with applicationService)
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

class TierService {
  // GET /api/v1/auth/admin/tiers/list
  async list(filters: TierFilters = {}): Promise<ApiListResponse<Tier>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_ADMIN_TIERS_LIST, {
        params: cleanParams,
      });

      const items: Tier[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load tiers.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // GET /api/v1/auth/admin/tiers/show/{id}
  async show(id: string): Promise<ApiSingleResponse<Tier>> {
    try {
      const res = await axiosClient.get(API_ADMIN_TIERS_SHOW(id));
      const tier: Tier | null = res.data?.data?.tier ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: tier,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load tier.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/public/tiers/store
  // Public endpoint — but we still use the shared axiosClient for consistency.
  // If your axiosClient forces an admin token on every request, pass a config
  // flag through or swap to a bare axios instance here.
  async create(payload: TierCreatePayload): Promise<ApiSingleResponse<Tier>> {
    try {
      const res = await axiosClient.post(API_PUBLIC_TIERS_STORE, payload);
      const tier: Tier | null = res.data?.data?.tier ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Tier created.',
        data: tier,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to create tier.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/tiers/update
  // Body must include updateId — the endpoint takes the id from the body,
  // not the URL, exactly like the Contact/Tier backend controllers.
  async update(
    id: string,
    payload: TierUpdatePayload,
  ): Promise<ApiSingleResponse<Tier>> {
    try {
      const res = await axiosClient.post(API_ADMIN_TIERS_UPDATE, {
        updateId: id,
        ...payload,
      });
      const tier: Tier | null = res.data?.data?.tier ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Tier updated.',
        data: tier,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update tier.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // DELETE /api/v1/auth/admin/tiers/delete
  // Body must include deleteId — id travels in the DELETE body, not the URL.
  async remove(id: string): Promise<ApiMutationResponse> {
    try {
      const res = await axiosClient.delete(API_ADMIN_TIERS_DELETE, {
        data: { deleteId: id },
      });

      return {
        success: true,
        message: res.data?.message ?? 'Tier deleted.',
      };
    } catch (error) {
      const e = handleError(error, 'Failed to delete tier.');
      return {
        success: false,
        message: e.message,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const tierService = new TierService();
export default tierService;
