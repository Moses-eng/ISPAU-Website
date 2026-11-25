import {
  API_ADMIN_ACTIVITY_DELETE,
  API_ADMIN_ACTIVITY_LIST,
  API_ADMIN_ACTIVITY_SHOW,
  API_ADMIN_ACTIVITY_STORE,
  API_ADMIN_ACTIVITY_UPDATE,
} from './APIs';
import axiosClient from './axiosClient';

export interface ActivityArticleDto {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  author: string;
  organiser: string;
  location: string;
  starts_at: string | null;
  startsAt?: string | null;
  ends_at: string | null;
  endsAt?: string | null;
  date_note: string | null;
  dateNote?: string | null;
  registration_url: string | null;
  registrationUrl?: string | null;
  summary: string | null;
  body: string;
  image_url: string | null;
  image: string | null;
  image_alt: string | null;
  image_credit: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ActivityPayload {
  title: string;
  slug?: string | null;
  category: string;
  author: string;
  organiser?: string;
  location?: string;
  starts_at?: string;
  ends_at?: string;
  date_note?: string | null;
  registration_url?: string | null;
  summary?: string | null;
  body: string;
  status?: 'draft' | 'published' | 'archived';
  image_url?: string | null;
  image_alt?: string | null;
  image_credit?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  image?: File;
}

// Accepts any object safely and prevents stringifying the binary File
const buildFormData = (base: Record<string, unknown>, image?: File): FormData => {
  const fd = new FormData();
  Object.entries(base).forEach(([k, v]) => {
    if (k === 'image') return; // Do not append File object as a string
    if (v === undefined || v === null) return;
    fd.append(k, String(v));
  });
  if (image) fd.append('image', image);
  return fd;
};

class ActivityService {
  async list(): Promise<ActivityArticleDto[]> {
    const res = await axiosClient.get(API_ADMIN_ACTIVITY_LIST);
    return res.data?.data?.items ?? [];
  }

  async show(id: string): Promise<ActivityArticleDto | null> {
    const res = await axiosClient.get(API_ADMIN_ACTIVITY_SHOW(id));
    return res.data?.data?.activity ?? null;
  }

  async create(payload: ActivityPayload): Promise<ActivityArticleDto> {
    const { image, ...fields } = payload;
    const fd = buildFormData(fields as unknown as Record<string, unknown>, image);

    const res = await axiosClient.post(API_ADMIN_ACTIVITY_STORE, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.activity;
  }

  async update(id: string, payload: ActivityPayload): Promise<ActivityArticleDto> {
    const { image, ...fields } = payload;
    const fd = buildFormData(
      { updateId: id, ...fields } as unknown as Record<string, unknown>,
      image
    );

    const res = await axiosClient.post(API_ADMIN_ACTIVITY_UPDATE, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.activity;
  }

  async remove(id: string): Promise<boolean> {
    const res = await axiosClient.delete(API_ADMIN_ACTIVITY_DELETE, {
      data: { deleteId: id },
    });
    return res.data?.status === 'success';
  }
}

export const activityService = new ActivityService();
export default activityService;
