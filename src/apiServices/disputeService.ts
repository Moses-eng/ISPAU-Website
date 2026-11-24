// src/apiServices/disputeService.ts

import axiosClient from './axiosClient';
import {
  API_ADMIN_DISPUTES_LIST,
  API_ADMIN_DISPUTES_SHOW,
  API_ADMIN_DISPUTES_UPDATE,
  API_ADMIN_DISPUTES_DELETE,
} from './APIs';

export type DisputeStatus = 'pending' | 'reviewed' | 'resolved' | 'rejected';

export interface Dispute {
  id: string;
  name: string;
  email: string;
  reason: string;
  recordId: string;      // plain string, not uuid
  status: DisputeStatus;
  created_at: string;
  updated_at: string;
}

export interface DisputePayload {
  name: string;
  email: string;
  reason: string;
  recordId: string;
  // status is intentionally omitted on create (backend forces "pending").
  // Included on update so admins can transition: pending → reviewed → resolved | rejected
  status?: DisputeStatus;
}

interface ApiListResponse {
  success: boolean;
  message: string;
  data: Dispute[] | null;
}

interface ApiSingleResponse {
  success: boolean;
  message: string;
  data: Dispute | null;
  fieldErrors?: Record<string, string> | null;
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

    // Flatten Laravel-style { field: [msg] } → { field: msg }
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

class DisputeService {
  // GET /api/v1/auth/admin/disputes/list
  async list(): Promise<ApiListResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_DISPUTES_LIST);
      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data?.items ?? [],
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load disputes.');
      return { success: false, message: e.message, data: null };
    }
  }

  // GET /api/v1/auth/admin/disputes/show/{id}
  async show(id: string): Promise<ApiSingleResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_DISPUTES_SHOW(id));
      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data?.dispute ?? null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load dispute.');
      return { success: false, message: e.message, data: null };
    }
  }

  // POST /api/v1/auth/admin/disputes/update
  // Body must include: updateId
  async update(id: string, payload: DisputePayload): Promise<ApiSingleResponse> {
    try {
      const res = await axiosClient.post(API_ADMIN_DISPUTES_UPDATE, {
        updateId: id,
        name: payload.name,
        email: payload.email,
        reason: payload.reason,
        recordId: payload.recordId,
        ...(payload.status ? { status: payload.status } : {}),
      });
      return {
        success: true,
        message: res.data?.message ?? 'Updated.',
        data: res.data?.data?.dispute ?? null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update dispute.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // DELETE /api/v1/auth/admin/disputes/delete
  // Body must include: deleteId
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await axiosClient.delete(API_ADMIN_DISPUTES_DELETE, {
        data: { deleteId: id },
      });
      return { success: true, message: res.data?.message ?? 'Deleted.' };
    } catch (error) {
      const e = handleError(error, 'Failed to delete dispute.');
      return { success: false, message: e.message };
    }
  }
}

export const disputeService = new DisputeService();
export default disputeService;
