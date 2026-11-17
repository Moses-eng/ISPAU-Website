// src/apiServices/heroSlideService.ts

import axiosClient from './axiosClient';
import { API_PUBLIC_HERO_SLIDES_LIST } from './APIs';

export type HeroSlideStatus = 'active' | 'inactive' | 'archived';

// ------------------------------------------------------------
// Admin hero slide — full shape
// ------------------------------------------------------------
export interface HeroSlide {
  id: string;
  src: string;                  // relative: images/heroSlide/{id}/image.jpg
  description: string;
  caption: string;
  credit: string | null;
  sort_order: number;
  status: HeroSlideStatus;
  created_at: string | null;
  updated_at: string | null;
}

// ------------------------------------------------------------
// Public hero slide — website shape (server response)
// ------------------------------------------------------------
export interface PublicHeroSlide {
  id: string;
  src: string;
  description: string;
  caption: string;
  credit: string | null;
  sort_order: number;
}

// ------------------------------------------------------------
// View model — shape consumed by the carousel component
// `description` is remapped to `alt`, `src` is absolute
// ------------------------------------------------------------
export interface HeroSlideView {
  id: string;
  src: string;
  alt: string;
  caption: string;
  credit: string | null;
}

export interface HeroSlideFilters {
  search?: string;
  status?: HeroSlideStatus;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface ApiPublicListResponse {
  success: boolean;
  message: string;
  data: PublicHeroSlide[] | null;
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

class HeroSlideService {
  // ============================================================
  // PUBLIC
  // ============================================================

  // Website hero — returns ordered, active slides only.
  async listPublic(): Promise<ApiPublicListResponse> {
    try {
      const res = await axiosClient.get(API_PUBLIC_HERO_SLIDES_LIST);
      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data?.items ?? [],
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load hero slides.');
      return { success: false, message: e.message, data: null };
    }
  }
}

export const heroSlideService = new HeroSlideService();
export default heroSlideService;

