import axiosClient from './axiosClient';
import {
  API_ADMIN_INVOICES_LIST,
  API_ADMIN_INVOICES_SHOW,
  API_ADMIN_INVOICES_STORE,
  API_ADMIN_INVOICES_UPDATE,
  API_ADMIN_INVOICES_DELETE,
} from './APIs';

// ============================================================
// TYPES
// ============================================================

export type InvoiceStatus = 'active' | 'not active';
export type InvoicePaymentStatus = 'Confirmed' | 'Pending';

export interface Invoice {
  id: string;
  applicant_id: string;
  invoice_number: string;
  total: string;                       // decimal returned as string
  status: InvoiceStatus;
  invoice_date: string;                // Y-m-d
  start_date: string | null;           // Y-m-d
  end_date: string | null;             // Y-m-d
  invoice_pdf: string | null;          // relative path: finance/invoices/{id}.pdf
  membership_period: string | null;
  confirmed_by: string | null;         // system_users.id — must be finance_admin
  payment_status: InvoicePaymentStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface InvoiceFilters {
  search?: string;
  applicant_id?: string;
  status?: InvoiceStatus;
  payment_status?: InvoicePaymentStatus;
  confirmed_by?: string;
  start_date_from?: string;            // Y-m-d
  end_date_to?: string;                // Y-m-d
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface InvoiceCreatePayload {
  applicant_id: string;
  total: number | string;
  invoice_date: string;                // Y-m-d
  start_date?: string | null;          // Y-m-d
  end_date?: string | null;            // Y-m-d
  status?: InvoiceStatus;
  membership_period?: string | null;   // days
  confirmed_by?: string | null;        // must be finance_admin
  payment_status?: InvoicePaymentStatus;
  invoice_pdf?: File;                  // uploaded by finance admin
}

export interface InvoiceUpdatePayload {
  applicant_id?: string;
  total?: number | string;
  invoice_date?: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: InvoiceStatus;
  membership_period?: string | null;
  confirmed_by?: string | null;
  payment_status?: InvoicePaymentStatus;
  invoice_pdf?: File;
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
 * Build FormData for create/update. `invoice_pdf` is appended as a File.
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
  if (pdf) fd.append('invoice_pdf', pdf);
  return fd;
};

// ============================================================
// SERVICE
// ============================================================

class InvoiceService {
  // ============================================================
  // ADMIN
  // ============================================================

  // GET /api/v1/auth/admin/invoices/list
  async list(filters: InvoiceFilters = {}): Promise<ApiListResponse<Invoice>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_ADMIN_INVOICES_LIST, {
        params: cleanParams,
      });

      const items: Invoice[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load invoices.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // GET /api/v1/auth/admin/invoices/show/{id}
  async show(id: string): Promise<ApiSingleResponse<Invoice>> {
    try {
      const res = await axiosClient.get(API_ADMIN_INVOICES_SHOW(id));
      const invoice: Invoice | null =
        res.data?.data?.invoice ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: invoice,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load invoice.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/invoices/store  (multipart/form-data)
  async create(payload: InvoiceCreatePayload): Promise<ApiSingleResponse<Invoice>> {
    try {
      const fd = buildFormData(
        {
          applicant_id: payload.applicant_id,
          total: payload.total,
          invoice_date: payload.invoice_date,
          start_date: payload.start_date ?? undefined,
          end_date: payload.end_date ?? undefined,
          status: payload.status ?? 'active',
          membership_period: payload.membership_period ?? undefined,
          confirmed_by: payload.confirmed_by ?? undefined,
          payment_status: payload.payment_status ?? 'Pending',
        },
        payload.invoice_pdf,
      );

      const res = await axiosClient.post(API_ADMIN_INVOICES_STORE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const invoice: Invoice | null =
        res.data?.data?.invoice ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Invoice created.',
        data: invoice,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to create invoice.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/invoices/update  (multipart/form-data)
  // Body must include updateId — id travels in the multipart body, not the URL.
  async update(
    id: string,
    payload: InvoiceUpdatePayload,
  ): Promise<ApiSingleResponse<Invoice>> {
    try {
      const fd = buildFormData(
        {
          updateId: id,
          applicant_id: payload.applicant_id,
          total: payload.total,
          invoice_date: payload.invoice_date,
          start_date: payload.start_date,
          end_date: payload.end_date,
          status: payload.status,
          membership_period: payload.membership_period,
          confirmed_by: payload.confirmed_by,
          payment_status: payload.payment_status,
        },
        payload.invoice_pdf,
      );

      const res = await axiosClient.post(API_ADMIN_INVOICES_UPDATE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const invoice: Invoice | null =
        res.data?.data?.invoice ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Invoice updated.',
        data: invoice,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update invoice.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // DELETE /api/v1/auth/admin/invoices/delete
  // Body must include deleteId — id travels in the DELETE body, not the URL.
  async remove(id: string): Promise<ApiMutationResponse> {
    try {
      const res = await axiosClient.delete(API_ADMIN_INVOICES_DELETE, {
        data: { deleteId: id },
      });

      return {
        success: true,
        message: res.data?.message ?? 'Invoice deleted.',
      };
    } catch (error) {
      const e = handleError(error, 'Failed to delete invoice.');
      return {
        success: false,
        message: e.message,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
