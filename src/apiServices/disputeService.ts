// src/apiServices/disputeService.ts

import axiosClient from './axiosClient';
import {API_PUBLIC_DISPUTES_CREATE,} from './APIs';

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

  // POST /api/v1/public/disputes/store  (public — no auth)
  async create(payload: DisputePayload): Promise<ApiSingleResponse> {
    try {
      const res = await axiosClient.post(API_PUBLIC_DISPUTES_CREATE, {
        name: payload.name,
        email: payload.email,
        reason: payload.reason,
        recordId: payload.recordId,
      });
      return {
        success: true,
        message: res.data?.message ?? 'Created.',
        data: res.data?.data?.dispute ?? null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to create dispute.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const disputeService = new DisputeService();
export default disputeService;
