import axiosClient from './axiosClient';
import {
  API_ADMIN_HERO_SLIDES_LIST,
  API_ADMIN_HERO_SLIDES_SHOW,
  API_ADMIN_HERO_SLIDES_STORE,
  API_ADMIN_HERO_SLIDES_UPDATE,
  API_ADMIN_HERO_SLIDES_DELETE,
} from './APIs';

// ============================================================
// TYPES
// ============================================================

export type HeroSlideStatus = 'active' | 'inactive' | 'archived';

// ------------------------------------------------------------
// Admin hero slide — full shape
// ------------------------------------------------------------
export interface HeroSlide {
  id: string;
  src: string;                    // relative path: images/heroSlide/{id}/image.jpg
  description: string;
  caption: string;
  credit: string | null;
  sort_order: number;
  status: HeroSlideStatus;
  created_at: string | null;
  updated_at: string | null;
}

// ------------------------------------------------------------
// Public hero slide — website shape
// ------------------------------------------------------------
export interface PublicHeroSlide {
  id: string;
  src: string;
  description: string;
  caption: string;
  credit: string | null;
  sort_order: number;
}

export interface HeroSlideFilters {
  search?: string;
  status?: HeroSlideStatus;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface HeroSlideCreatePayload {
  image: File;
  description: string;
  caption: string;
  credit?: string | null;
  sort_order?: number;
  status?: HeroSlideStatus;
}

export interface HeroSlideUpdatePayload {
  image?: File;
  description?: string;
  caption?: string;
  credit?: string | null;
  sort_order?: number;
  status?: HeroSlideStatus;
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
// ERROR HANDLER (shared pattern with tierService)
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

class HeroSlideService {
  // ============================================================
  // ADMIN
  // ============================================================

  // GET /api/v1/auth/admin/hero-slides/list
  async list(filters: HeroSlideFilters = {}): Promise<ApiListResponse<HeroSlide>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_ADMIN_HERO_SLIDES_LIST, {
        params: cleanParams,
      });

      const items: HeroSlide[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load hero slides.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // GET /api/v1/auth/admin/hero-slides/show/{id}
  async show(id: string): Promise<ApiSingleResponse<HeroSlide>> {
    try {
      const res = await axiosClient.get(API_ADMIN_HERO_SLIDES_SHOW(id));
      const slide: HeroSlide | null =
        res.data?.data?.slide ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: slide,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load hero slide.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/hero-slides/store  (multipart/form-data)
  async create(payload: HeroSlideCreatePayload): Promise<ApiSingleResponse<HeroSlide>> {
    try {
      const fd = buildFormData(
        {
          description: payload.description,
          caption: payload.caption,
          credit: payload.credit ?? undefined,
          sort_order: payload.sort_order ?? 0,
          status: payload.status ?? 'active',
        },
        payload.image,
      );

      const res = await axiosClient.post(API_ADMIN_HERO_SLIDES_STORE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const slide: HeroSlide | null =
        res.data?.data?.slide ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Hero slide created.',
        data: slide,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to create hero slide.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/hero-slides/update  (multipart/form-data)
  // Body must include updateId — id travels in the multipart body, not the URL.
  async update(
    id: string,
    payload: HeroSlideUpdatePayload,
  ): Promise<ApiSingleResponse<HeroSlide>> {
    try {
      const fd = buildFormData(
        {
          updateId: id,
          description: payload.description,
          caption: payload.caption,
          credit: payload.credit ?? undefined,
          sort_order: payload.sort_order,
          status: payload.status,
        },
        payload.image,
      );

      const res = await axiosClient.post(API_ADMIN_HERO_SLIDES_UPDATE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const slide: HeroSlide | null =
        res.data?.data?.slide ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Hero slide updated.',
        data: slide,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update hero slide.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // DELETE /api/v1/auth/admin/hero-slides/delete
  // Body must include deleteId — id travels in the DELETE body, not the URL.
  async remove(id: string): Promise<ApiMutationResponse> {
    try {
      const res = await axiosClient.delete(API_ADMIN_HERO_SLIDES_DELETE, {
        data: { deleteId: id },
      });

      return {
        success: true,
        message: res.data?.message ?? 'Hero slide deleted.',
      };
    } catch (error) {
      const e = handleError(error, 'Failed to delete hero slide.');
      return {
        success: false,
        message: e.message,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const heroSlideService = new HeroSlideService();
export default heroSlideService;
