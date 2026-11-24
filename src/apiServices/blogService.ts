import axiosClient from './axiosClient';
import {
  API_PUBLIC_BLOG_LIST,
  API_PUBLIC_BLOG_SHOW,
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
  image_url: string | null;      // external URL fallback
  image: string | null;          // relative path: images/blogs/{id}/image.jpg
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
  image_url?: string | null;
  image_alt?: string | null;
  image_credit?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  image?: File;                  // uploaded cover (multipart)
}

export interface BlogUpdatePayload extends Partial<Omit<BlogCreatePayload, 'image'>> {
  image?: File;
}

export interface PublicBlogFilters {
  search?: string;
  category?: string;
  limit?: number;
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
// ERROR HANDLER (unchanged)
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


export function resolveBlogImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  const base = BASE_URL +"/"+path;
  return base;
}

// ============================================================
// SERVICE
// ============================================================

class BlogService {

  // ---------------- PUBLIC (website) ----------------

  // GET /api/v1/public/blog/list
  async listPublic(filters: PublicBlogFilters = {}): Promise<ApiListResponse<BlogArticleDto>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_PUBLIC_BLOG_LIST, { params: cleanParams });

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

  // GET /api/v1/public/blog/show/{slug}
  async showPublic(slug: string): Promise<ApiSingleResponse<BlogArticleDto>> {
    try {
      const res = await axiosClient.get(API_PUBLIC_BLOG_SHOW(slug));
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
}

export const blogService = new BlogService();
export default blogService;
