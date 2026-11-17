// src/apiServices/bannerService.ts
import axiosClient from './axiosClient';
import { API_PUBLIC_BANNERS_LIST } from './APIs';
import { BASE_URL } from './env';

// ============================================================
// TYPES
// ============================================================

export type BannerStatus = 'active' | 'inactive' | 'archived';

// ------------------------------------------------------------
// Public banner — website shape
// ------------------------------------------------------------
export interface PublicBanner {
  id: string;
  image: string;
  name: string;
  description: string | null;
  page_name: string;
}

export interface BannerFilters {
  search?: string;
  status?: BannerStatus;
  page_name?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiPublicListResponse<T> {
  success: boolean;
  message: string;
  data: T[] | null;
  fieldErrors?: Record<string, string> | null;
}

// ============================================================
// ERROR HANDLER
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
// URL RESOLVER HELPER
// ============================================================

export function resolveBannerImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = (BASE_URL || '').replace(/\/api\/v1\/?$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
}

// ============================================================
// SERVICE
// ============================================================

class BannerService {
  // GET /api/v1/public/banners/list?page=about
  async listPublic(page?: string): Promise<ApiPublicListResponse<PublicBanner>> {
    try {
      const params =
        page && page.trim() !== ''
          ? { page: page.trim().toLowerCase() }
          : undefined;

      const res = await axiosClient.get(API_PUBLIC_BANNERS_LIST, { params });
      const items = res.data?.data?.items ?? [];

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load banners.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const bannerService = new BannerService();
export default bannerService;


