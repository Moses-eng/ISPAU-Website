import axiosClient from './axiosClient';
import {
  API_ADMIN_STATISTICS,
  API_ADMIN_STATISTICS_BADGES,
} from './APIs';

// ============================================================
// TYPES
// ============================================================

export interface InvoiceStatistics {
  finance: number;
  applicants: number;
  other: number;
}

export interface ApiStatisticsResponse {
  success: boolean;
  message: string;
  data: InvoiceStatistics | null;
  fieldErrors?: Record<string, string> | null;
}

const EMPTY_STATS: InvoiceStatistics = { finance: 0, applicants: 0, other: 0 };

// ============================================================
// ERROR HANDLER (shared pattern — identical to invoiceService)
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

class StatisticsService {
  // ============================================================
  // STATISTICS  (used by badges / counters)
  // ============================================================

  // GET /api/v1/auth/admin/statistics
  async statistics(financeId?: string): Promise<ApiStatisticsResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_STATISTICS, {
        params: financeId ? { finance_id: financeId } : {},
      });

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data ?? EMPTY_STATS,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load statistics.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  // GET /api/v1/auth/admin/statistics/badges
  async statisticsBadges(financeId?: string): Promise<ApiStatisticsResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_STATISTICS_BADGES, {
        params: financeId ? { finance_id: financeId } : {},
      });

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data ?? EMPTY_STATS,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load badge counts.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }
}

export const statisticsService = new StatisticsService();
export default statisticsService;
