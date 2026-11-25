// src/apiServices/activityService.ts
import { API_PUBLIC_ACTIVITY_LIST, API_PUBLIC_ACTIVITY_SHOW } from './APIs';
import axiosClient from './axiosClient';
import { BASE_URL } from './env';


// ============================================================
// TYPES
// ============================================================

export type ActivityStatus = 'draft' | 'published' | 'archived';

export interface ActivityArticleDto {
  id: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  author: string | null;
  organiser: string | null;
  location: string | null;
  starts_at: string | null;
  startsAt?: string | null;
  ends_at: string | null;
  endsAt?: string | null;
  date_note: string | null;
  dateNote?: string | null;
  registration_url: string | null;
  registrationUrl?: string | null;
  summary: string | null;
  body: string | null;
  image_url: string | null;      // External image URL
  image: string | null;          // Relative path: images/activities/{id}/image.jpg
  image_alt: string | null;
  image_credit: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: ActivityStatus;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PublicActivityFilters {
  search?: string;
  category?: string;
  organiser?: string;
  timeline?: 'upcoming' | 'past' | 'all';
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
// IMAGE RESOLVER HELPER
// ============================================================

export function resolveActivityImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  return BASE_URL+"/"+path;
}

// ============================================================
// SERVICE
// ============================================================

class ActivityService {
  /**
   * GET /api/v1/public/activity/list
   * Lists published activities for the public website.
   */
  async listPublic(
    filters: PublicActivityFilters = {},
  ): Promise<ApiListResponse<ActivityArticleDto>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_PUBLIC_ACTIVITY_LIST, {
        params: cleanParams,
      });

      const items: ActivityArticleDto[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Activities loaded successfully.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load activities.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /**
   * GET /api/v1/public/activity/show/{slug}
   * Retrieves a single published activity by its slug for the public website.
   */
  async showPublic(slug: string): Promise<ApiSingleResponse<ActivityArticleDto>> {
    try {
      const res = await axiosClient.get(API_PUBLIC_ACTIVITY_SHOW(slug));
      const activity: ActivityArticleDto | null =
        res.data?.data?.activity ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Activity loaded successfully.',
        data: activity,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load activity details.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const activityService = new ActivityService();
export default activityService;
