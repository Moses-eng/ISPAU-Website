// src/apiServices/tierService.ts

import axiosClient from './axiosClient';
import {
  API_PUBLIC_TIERS_LIST,
} from './APIs';

export type TierStatus = 'active' | 'inactive' | 'archived';

// ------------------------------------------------------------
// Admin tier — full shape
// ------------------------------------------------------------
export interface Tier {
  id: string;
  name: string;
  cost: number;
  description: string | null;
  status: TierStatus;
  created_at: string | null;
  updated_at: string | null;
}

// ------------------------------------------------------------
// Public tier — website pricing page shape
// ------------------------------------------------------------
export interface PublicTier {
  id: string;
  name: string;
  cost: number;
  description: string | null;
}

export interface TierPayload {
  name: string;
  cost: number;
  description?: string | null;
  status?: TierStatus;
}

export interface TierFilters {
  search?: string;
  status?: TierStatus;
  min_cost?: number;
  max_cost?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
interface ApiPublicListResponse {
  success: boolean;
  message: string;
  data: PublicTier[] | null;
}

const handleError = (
  error: unknown,
  fallback: string
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
    if (data.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([field, msgs]) => {
        fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
      });
    }

    return {
      success: false,
      message:
        typeof data.message === 'string' && data.message.length > 0
          ? data.message
          : fallback,
      data: null,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : null,
    };
  }

  if (e?.request) {
    return {
      success: false,
      message: 'No internet connection.',
      data: null,
      fieldErrors: null,
    };
  }

  return {
    success: false,
    message: fallback,
    data: null,
    fieldErrors: null,
  };
};

class TierService {
  // ============================================================
  // PUBLIC
  // ============================================================

  // Website pricing page — returns only id, name, cost, description.
  async listPublic(): Promise<ApiPublicListResponse> {
    try {
      const res = await axiosClient.get(API_PUBLIC_TIERS_LIST);
      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data?.items ?? [],
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load tiers.');
      return { success: false, message: e.message, data: null };
    }
  }
}

export const tierService = new TierService();
export default tierService;

