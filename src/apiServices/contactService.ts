// src/apiServices/contactService.ts

import axiosClient from './axiosClient';
import {
  API_ADMIN_CONTACTS_LIST,
  API_ADMIN_CONTACTS_SHOW,
  API_ADMIN_CONTACTS_UPDATE,
  API_ADMIN_CONTACTS_DELETE,
} from './APIs';

export type ContactStatus = 'active' | 'inactive' | 'archived';

export interface Contact {
  id: string;
  name: string;
  work_email: string;
  organisation: string;
  message: string;
  enquiry_type: string;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
}

export interface ContactPayload {
  name: string;
  work_email: string;
  organisation: string;
  message: string;
  enquiry_type: string;
  status?: ContactStatus;
}

interface ApiListResponse {
  success: boolean;
  message: string;
  data: Contact[] | null;
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

class ContactService {
  // GET /api/v1/auth/admin/contacts/list
  async list(): Promise<ApiListResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_CONTACTS_LIST);
      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data?.items ?? [],
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load contacts.');
      return { success: false, message: e.message, data: null };
    }
  }

  // GET /api/v1/auth/admin/contacts/show/{id}
  async show(id: string): Promise<ApiSingleResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_CONTACTS_SHOW(id));
      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load contact.');
      return { success: false, message: e.message, data: null };
    }
  }

  // POST /api/v1/auth/admin/contacts/update
  // Body must include: updateId
  async update(id: string, payload: ContactPayload): Promise<ApiSingleResponse> {
    try {
      const res = await axiosClient.post(API_ADMIN_CONTACTS_UPDATE, {
        updateId: id,
        name: payload.name,
        work_email: payload.work_email,
        organisation: payload.organisation,
        message: payload.message,
        enquiry_type: payload.enquiry_type,
        status: payload.status ?? 'active',
      });
      return {
        success: true,
        message: res.data?.message ?? 'Updated.',
        data: res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update contact.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // DELETE /api/v1/auth/admin/contacts/delete
  // Body must include: deleteId
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await axiosClient.delete(API_ADMIN_CONTACTS_DELETE, {
        data: { deleteId: id },
      });
      return { success: true, message: res.data?.message ?? 'Deleted.' };
    } catch (error) {
      const e = handleError(error, 'Failed to delete contact.');
      return { success: false, message: e.message };
    }
  }
}

export const contactService = new ContactService();
export default contactService;


