// src/apiServices/webApiService.ts

import axiosClient from './axiosClient';
import { API_PUBLIC_CONTACTS_CREATE } from './APIs';

// ============================================================
// CONTACT (public contact form)
// ============================================================

export interface WebContactPayload {
  name: string;
  work_email: string;
  organisation: string;
  message: string;
  enquiry_type: string;
}

export interface WebEnquiryResponse {
  success: boolean;
  message: string;
  data: unknown | null;
  fieldErrors?: Record<string, string> | null;
}

// ============================================================
// ERROR HANDLING
// ============================================================

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

// ============================================================
// SERVICE
// ============================================================

class WebApiService {
  /**
   * POST /api/v1/public/contacts/store (public — no auth)
   */
  async contactSendMessage(
    payload: WebContactPayload
  ): Promise<WebEnquiryResponse> {
    try {
      const res = await axiosClient.post(API_PUBLIC_CONTACTS_CREATE, {
        name: payload.name,
        work_email: payload.work_email,
        organisation: payload.organisation,
        message: payload.message,
        enquiry_type: payload.enquiry_type,
        status: 'active',
      });

      return {
        success: true,
        message: res.data?.message ?? 'Message sent.',
        data: res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to send message.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const webApiService = new WebApiService();
export default webApiService;
