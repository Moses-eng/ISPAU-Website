import axiosClient from './axiosClient';
import {
  API_ADMIN_RECEIPTS_LIST,
  API_ADMIN_RECEIPTS_SHOW,
  API_ADMIN_RECEIPTS_STORE,
  API_ADMIN_RECEIPTS_UPDATE,
  API_ADMIN_RECEIPTS_DELETE,
} from './APIs';

// ============================================================
// TYPES
// ============================================================

export interface Receipt {
  receipt_id: string;                  // primary key
  invoice_id: string;
  applicant_id: string;
  receipt_pdf: string | null;          // relative path: finance/receipt/{receipt_id}.pdf
  created_at: string | null;
  updated_at: string | null;
}

export interface ReceiptFilters {
  search?: string;
  invoice_id?: string;
  applicant_id?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ReceiptCreatePayload {
  invoice_id: string;
  applicant_id: string;
  receipt_pdf?: File;                  // optional on admin create
}

export interface ReceiptUpdatePayload {
  invoice_id?: string;
  applicant_id?: string;
  receipt_pdf?: File;
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
// ERROR HANDLER (shared pattern)
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
// HELPERS
// ============================================================

/**
 * Build FormData for create/update. `receipt_pdf` is appended as a File.
 * Laravel's multipart parser handles POST /store and POST /update routes directly.
 */
const buildFormData = (
  base: Record<string, unknown>,
  pdf?: File,
): FormData => {
  const fd = new FormData();
  Object.entries(base).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, String(v));
  });
  if (pdf) fd.append('receipt_pdf', pdf);
  return fd;
};

// ============================================================
// SERVICE
// ============================================================

class ReceiptService {
  // ============================================================
  // ADMIN
  // ============================================================

  // GET /api/v1/auth/admin/receipts/list
  async list(filters: ReceiptFilters = {}): Promise<ApiListResponse<Receipt>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_ADMIN_RECEIPTS_LIST, {
        params: cleanParams,
      });

      const items: Receipt[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load receipts.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // GET /api/v1/auth/admin/receipts/show/{receiptId}
  async show(receiptId: string): Promise<ApiSingleResponse<Receipt>> {
    try {
      const res = await axiosClient.get(API_ADMIN_RECEIPTS_SHOW(receiptId));
      const receipt: Receipt | null =
        res.data?.data?.receipt ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: receipt,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load receipt.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/receipts/store  (multipart/form-data)
  async create(payload: ReceiptCreatePayload): Promise<ApiSingleResponse<Receipt>> {
    try {
      const fd = buildFormData(
        {
          invoice_id: payload.invoice_id,
          applicant_id: payload.applicant_id,
        },
        payload.receipt_pdf,
      );

      const res = await axiosClient.post(API_ADMIN_RECEIPTS_STORE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const receipt: Receipt | null =
        res.data?.data?.receipt ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Receipt created.',
        data: receipt,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to create receipt.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/receipts/update  (multipart/form-data)
  // Body must include updateId — id travels in the multipart body, not the URL.
  async update(
    receiptId: string,
    payload: ReceiptUpdatePayload,
  ): Promise<ApiSingleResponse<Receipt>> {
    try {
      const fd = buildFormData(
        {
          updateId: receiptId,
          invoice_id: payload.invoice_id,
          applicant_id: payload.applicant_id,
        },
        payload.receipt_pdf,
      );

      const res = await axiosClient.post(API_ADMIN_RECEIPTS_UPDATE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const receipt: Receipt | null =
        res.data?.data?.receipt ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Receipt updated.',
        data: receipt,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update receipt.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // DELETE /api/v1/auth/admin/receipts/delete
  // Body must include deleteId — id travels in the DELETE body, not the URL.
  async remove(receiptId: string): Promise<ApiMutationResponse> {
    try {
      const res = await axiosClient.delete(API_ADMIN_RECEIPTS_DELETE, {
        data: { deleteId: receiptId },
      });

      return {
        success: true,
        message: res.data?.message ?? 'Receipt deleted.',
      };
    } catch (error) {
      const e = handleError(error, 'Failed to delete receipt.');
      return {
        success: false,
        message: e.message,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const receiptService = new ReceiptService();
export default receiptService;
