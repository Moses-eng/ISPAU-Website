import axiosClient from './axiosClient';
import { API_PUBLIC_CONTACTS_CREATE } from './APIs';

export type ContactStatus = 'active' | 'inactive' | 'archived';

export interface Contact {
  id: string;
  name: string;
  work_email: string;
  organisation: string;
  message: string;
  enquiry_type: string;
  status: ContactStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ContactPayload {
  name: string;
  work_email: string;
  organisation: string;
  message: string;
  enquiry_type: string;
  status?: ContactStatus;
}

interface ApiSingleResponse {
  success: boolean;
  message: string;
  data: Contact | null;
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
      message: 'No internet connection. Please check your network.',
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

class ContactService {
  async create(payload: ContactPayload): Promise<ApiSingleResponse> {
    try {
      const res = await axiosClient.post(API_PUBLIC_CONTACTS_CREATE, {
        name: payload.name,
        work_email: payload.work_email,
        organisation: payload.organisation,
        message: payload.message,
        enquiry_type: payload.enquiry_type,
        status: payload.status ?? 'active',
      });

      return {
        success: res.data?.status === 'success' || res.status === 200 || res.status === 201,
        message: res.data?.message ?? 'Your enquiry has been received.',
        // Backend returns `data.contact`
        data: res.data?.data?.contact ?? res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to send your enquiry. Please try again.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const contactService = new ContactService();
export default contactService;
