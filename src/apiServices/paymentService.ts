import axiosClient from './axiosClient';
import {
  API_ADMIN_PAYMENTS_LIST,
  API_ADMIN_PAYMENTS_SHOW,
  API_ADMIN_PAYMENTS_STORE,
  API_ADMIN_PAYMENTS_UPDATE,
  API_ADMIN_PAYMENTS_DELETE,
} from './APIs';

// ============================================================
// TYPES
// ============================================================

export type PaymentStatus = 'active' | 'not active';

export interface Payment {
  payment_id: string;
  invoice_id: string;
  payment_no: string;
  applicant_id: string;
  created_by: string | null;
  amount: string;
  status: PaymentStatus;
  period: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaymentFilters {
  search?: string;
  invoice_id?: string;
  applicant_id?: string;
  created_by?: string;
  status?: PaymentStatus;
  payment_reference?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaymentCreatePayload {
  invoice_id: string;
  applicant_id: string;
  created_by?: string | null;
  amount: number | string;
  status?: PaymentStatus;
  period?: string | null;
  paid_at?: string | null;
  payment_reference?: string | null;
}

export interface PaymentUpdatePayload {
  invoice_id?: string;
  applicant_id?: string;
  created_by?: string | null;
  amount?: number | string;
  status?: PaymentStatus;
  period?: string | null;
  paid_at?: string | null;
  payment_reference?: string | null;
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
// SERVICE
// ============================================================

class PaymentService {
  // ============================================================
  // ADMIN
  // ============================================================

  // GET /api/v1/auth/admin/payments/list
  async list(filters: PaymentFilters = {}): Promise<ApiListResponse<Payment>> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== '' && v !== null,
        ),
      );

      const res = await axiosClient.get(API_ADMIN_PAYMENTS_LIST, {
        params: cleanParams,
      });

      const items: Payment[] = res.data?.data?.items ?? [];
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load payments.');
      return {
        success: false,
        message: e.message,
        data: [],
        total: 0,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // GET /api/v1/auth/admin/payments/show/{paymentId}
  async show(paymentId: string): Promise<ApiSingleResponse<Payment>> {
    try {
      const res = await axiosClient.get(API_ADMIN_PAYMENTS_SHOW(paymentId));
      const payment: Payment | null =
        res.data?.data?.payment ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: payment,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load payment.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/payments/store  (application/x-www-form-urlencoded or JSON)
  async create(payload: PaymentCreatePayload): Promise<ApiSingleResponse<Payment>> {
    try {
      const body: Record<string, unknown> = {
        invoice_id: payload.invoice_id,
        applicant_id: payload.applicant_id,
        amount: payload.amount,
        status: payload.status ?? 'active',
      };

      if (payload.created_by !== undefined && payload.created_by !== null) {
        body.created_by = payload.created_by;
      }
      if (payload.period !== undefined && payload.period !== null) {
        body.period = payload.period;
      }
      if (payload.paid_at !== undefined && payload.paid_at !== null) {
        body.paid_at = payload.paid_at;
      }
      if (payload.payment_reference !== undefined && payload.payment_reference !== null) {
        body.payment_reference = payload.payment_reference;
      }

      const res = await axiosClient.post(API_ADMIN_PAYMENTS_STORE, body);

      const payment: Payment | null =
        res.data?.data?.payment ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Payment created.',
        data: payment,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to create payment.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // POST /api/v1/auth/admin/payments/update
  // Body must include updateId — id travels in the body, not the URL.
  async update(
    paymentId: string,
    payload: PaymentUpdatePayload,
  ): Promise<ApiSingleResponse<Payment>> {
    try {
      const body: Record<string, unknown> = {
        updateId: paymentId,
      };

      if (payload.invoice_id !== undefined)     body.invoice_id = payload.invoice_id;
      if (payload.applicant_id !== undefined)   body.applicant_id = payload.applicant_id;
      if (payload.created_by !== undefined)     body.created_by = payload.created_by;
      if (payload.amount !== undefined)         body.amount = payload.amount;
      if (payload.status !== undefined)         body.status = payload.status;
      if (payload.period !== undefined)         body.period = payload.period;
      if (payload.paid_at !== undefined)        body.paid_at = payload.paid_at;
      if (payload.payment_reference !== undefined) body.payment_reference = payload.payment_reference;

      const res = await axiosClient.post(API_ADMIN_PAYMENTS_UPDATE, body);

      const payment: Payment | null =
        res.data?.data?.payment ?? res.data?.data ?? null;

      return {
        success: true,
        message: res.data?.message ?? 'Payment updated.',
        data: payment,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update payment.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // DELETE /api/v1/auth/admin/payments/delete
  // Body must include deleteId — id travels in the DELETE body, not the URL.
  async remove(paymentId: string): Promise<ApiMutationResponse> {
    try {
      const res = await axiosClient.delete(API_ADMIN_PAYMENTS_DELETE, {
        data: { deleteId: paymentId },
      });

      return {
        success: true,
        message: res.data?.message ?? 'Payment deleted.',
      };
    } catch (error) {
      const e = handleError(error, 'Failed to delete payment.');
      return {
        success: false,
        message: e.message,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;
