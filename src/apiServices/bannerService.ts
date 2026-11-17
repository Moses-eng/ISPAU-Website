import axiosClient from './axiosClient';
import {
  API_ADMIN_BANNERS_LIST,
  API_ADMIN_BANNERS_SHOW,
  API_ADMIN_BANNERS_STORE,
  API_ADMIN_BANNERS_UPDATE,
  API_ADMIN_BANNERS_DELETE,
} from './APIs';

// ============================================================
// TYPES
// ============================================================

export type BannerStatus = 'active' | 'inactive' | 'archived';

// ------------------------------------------------------------
// Admin banner — full shape
// ------------------------------------------------------------
export interface Banner {
  id: string;
  image: string;                  // relative path: images/Banner/{id}/image.jpg
  name: string;
  description: string | null;
  page_name: string;
  status: BannerStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface BannerFilters {
  search?: string;
  status?: BannerStatus;
  page_name?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface BannerCreatePayload {
  image: File;
  name: string;
  description?: string | null;
  page_name: string;
  status?: BannerStatus;
}

export interface BannerUpdatePayload {
  image?: File;
  name?: string;
  description?: string | null;
  page_name?: string;
  status?: BannerStatus;
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

export interface ApiPublicListResponse<T> {
  success: boolean;
  message: string;
  data: T[] | null;
  fieldErrors?: Record<string, string> | null;
}

// ============================================================
// ERROR HANDLER (shared pattern with tierService / heroSlideService)
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
// HELPERS
// ============================================================

/**
 * Build a FormData body for create/update. Laravel's multipart parser
 * accepts PUT/PATCH from FormData only when `_method` is set — but the
 * backend route is POST /update, so no spoofing needed.
 */
const buildFormData = (
  base: Record<string, unknown>,
  image?: File,
): FormData => {
  const fd = new FormData();
  Object.entries(base).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, String(v));
  });
  if (image) fd.append('image', image);
  return fd;
};

// ============================================================
// SERVICE
// ============================================================

class BannerService {
  // ============================================================
  // PUBLIC
  // ============================================================


  // ============================================================
  // ADMIN
  // ============================================================

  // GET /api/v1/auth/admin/banners/list
  async list(filters: BannerFilters = {}): Promise<ApiListResponse<Banner>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_ADMIN_BANNERS_LIST, {
        params: cleanParams,
      });

      const items: Banner[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load banners.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // GET /api/v1/auth/admin/banners/show/{id}
  async show(id: string): Promise<ApiSingleResponse<Banner>> {
    try {
      const res = await axiosClient.get(API_ADMIN_BANNERS_SHOW(id));
      const banner: Banner | null =
        res.data?.data?.banner ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: banner,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load banner.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/banners/store  (multipart/form-data)
  async create(payload: BannerCreatePayload): Promise<ApiSingleResponse<Banner>> {
    try {
      const fd = buildFormData(
        {
          name: payload.name,
          description: payload.description ?? undefined,
          page_name: payload.page_name,
          status: payload.status ?? 'active',
        },
        payload.image,
      );

      const res = await axiosClient.post(API_ADMIN_BANNERS_STORE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const banner: Banner | null =
        res.data?.data?.banner ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Banner created.',
        data: banner,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to create banner.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/banners/update  (multipart/form-data)
  // Body must include updateId — id travels in the multipart body, not the URL.
  async update(
    id: string,
    payload: BannerUpdatePayload,
  ): Promise<ApiSingleResponse<Banner>> {
    try {
      const fd = buildFormData(
        {
          updateId: id,
          name: payload.name,
          description: payload.description,
          page_name: payload.page_name,
          status: payload.status,
        },
        payload.image,
      );

      const res = await axiosClient.post(API_ADMIN_BANNERS_UPDATE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const banner: Banner | null =
        res.data?.data?.banner ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Banner updated.',
        data: banner,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update banner.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // DELETE /api/v1/auth/admin/banners/delete
  // Body must include deleteId — id travels in the DELETE body, not the URL.
  async remove(id: string): Promise<ApiMutationResponse> {
    try {
      const res = await axiosClient.delete(API_ADMIN_BANNERS_DELETE, {
        data: { deleteId: id },
      });

      return {
        success: true,
        message: res.data?.message ?? 'Banner deleted.',
      };
    } catch (error) {
      const e = handleError(error, 'Failed to delete banner.');
      return {
        success: false,
        message: e.message,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const bannerService = new BannerService();
export default bannerService;
