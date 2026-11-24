import axiosClient from './axiosClient';
import {
  API_ADMIN_BLOG_LIST,
  API_ADMIN_BLOG_SHOW,
  API_ADMIN_BLOG_STORE,
  API_ADMIN_BLOG_UPDATE,
  API_ADMIN_BLOG_DELETE,
} from './APIs';
import { BASE_URL } from './env';

// ============================================================
// TYPES
// ============================================================

export type BlogStatus = 'draft' | 'published' | 'archived';

export interface BlogArticleDto {
  id: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  author: string | null;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  image: string | null;
  image_alt: string | null;
  image_credit: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: BlogStatus;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BlogFilters {
  search?: string;
  status?: BlogStatus;
  category?: string;
  author?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface BlogCreatePayload {
  title: string;
  slug?: string | null;
  category: string;
  author: string;
  summary?: string | null;
  body: string;
  status?: BlogStatus;
  image_url?: string | null;
  image_alt?: string | null;
  image_credit?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  image?: File;
}

export interface BlogUpdatePayload extends Partial<Omit<BlogCreatePayload, 'image'>> {
  status?: BlogStatus;
  image?: File;
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
// FORMDATA HELPER
// ============================================================

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

export function resolveBlogImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  return BASE_URL;
}

// ============================================================
// SERVICE
// ============================================================

class BlogService {
  async list(filters: BlogFilters = {}): Promise<ApiListResponse<BlogArticleDto>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_ADMIN_BLOG_LIST, { params: cleanParams });

      const items: BlogArticleDto[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load articles.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  async show(id: string): Promise<ApiSingleResponse<BlogArticleDto>> {
    try {
      const res = await axiosClient.get(API_ADMIN_BLOG_SHOW(id));
      const article: BlogArticleDto | null =
        res.data?.data?.article ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: article,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load article.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  async create(payload: BlogCreatePayload): Promise<ApiSingleResponse<BlogArticleDto>> {
    try {
      const fd = buildFormData(
        {
          title:           payload.title,
          slug:            payload.slug ?? undefined,
          category:        payload.category,
          author:          payload.author,
          summary:         payload.summary ?? undefined,
          body:            payload.body,
          status:          payload.status ?? 'draft',
          image_url:       payload.image_url ?? undefined,
          image_alt:       payload.image_alt ?? undefined,
          image_credit:    payload.image_credit ?? undefined,
          seo_title:       payload.seo_title ?? undefined,
          seo_description: payload.seo_description ?? undefined,
        },
        payload.image,
      );

      const res = await axiosClient.post(API_ADMIN_BLOG_STORE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const article: BlogArticleDto | null =
        res.data?.data?.article ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Article saved.',
        data: article,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to save article.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  async update(
    id: string,
    payload: BlogUpdatePayload,
  ): Promise<ApiSingleResponse<BlogArticleDto>> {
    try {
      const fd = buildFormData(
        {
          updateId:        id,
          title:           payload.title,
          slug:            payload.slug,
          category:        payload.category,
          author:          payload.author,
          summary:         payload.summary,
          body:            payload.body,
          status:          payload.status,
          image_url:       payload.image_url,
          image_alt:       payload.image_alt,
          image_credit:    payload.image_credit,
          seo_title:       payload.seo_title,
          seo_description: payload.seo_description,
        },
        payload.image,
      );

      const res = await axiosClient.post(API_ADMIN_BLOG_UPDATE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const article: BlogArticleDto | null =
        res.data?.data?.article ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Article updated.',
        data: article,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update article.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  async remove(id: string): Promise<ApiMutationResponse> {
    try {
      const res = await axiosClient.delete(API_ADMIN_BLOG_DELETE, {
        data: { deleteId: id },
      });

      return {
        success: true,
        message: res.data?.message ?? 'Article deleted.',
      };
    } catch (error) {
      const e = handleError(error, 'Failed to delete article.');
      return {
        success: false,
        message: e.message,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const blogService = new BlogService();
export default blogService;
