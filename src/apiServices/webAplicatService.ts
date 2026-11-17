// src/apiServices/webAplicatService.ts

import axiosClient from "./axiosClient";
import {
  API_PUBLIC_APPLICANT_REQUEST_OTP,
  API_PUBLIC_APPLICANT_VERIFY_OTP,
  API_APPLICANT_PROFILE_SHOW,
  API_APPLICANT_LOGOUT,
  API_APPLICATION_UPDATE,
  API_APPLICATION_DOWNLOAD_PDF,
} from "./APIs";
import authStore from "./authStore";

export interface ApplicantOtpResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown> | null;
}

export interface LiveApplication {
  id: string;
  legal_name?: string;
  legalName?: string;
  trading_name?: string;
  tradingName?: string;
  entity_type?: string;
  entityType?: string;
  registration_country?: string;
  registrationCountry?: string;
  registration_reference?: string;
  registrationReference?: string;
  business_email: string;
  businessEmail?: string;
  business_phone?: string;
  businessPhone?: string;
  website?: string;
  registered_address?: string;
  registeredAddress?: string;
  uganda_address?: string;
  ugandaAddress?: string;
  category?: string;
  operational_status?: string;
  operationalStatus?: string;
  requested_tier?: string;
  requestedTier?: string;
  customer_facing?: string;
  customerFacing?: string;
  pdpo_status?: string;
  pdpoStatus?: string;
  licence_relevant?: string;
  licenceRelevant?: string;
  applicant_name?: string;
  applicantName?: string;
  applicant_role?: string;
  applicantRole?: string;
  applicant_email?: string;
  applicantEmail?: string;
  applicant_phone?: string;
  applicantPhone?: string;
  representative_name?: string;
  representativeName?: string;
  representative_role?: string;
  representativeRole?: string;
  representative_email?: string;
  representativeEmail?: string;
  representative_phone?: string;
  representativePhone?: string;
  billing_email?: string;
  billingEmail?: string;
  billing_contact?: string;
  billingContact?: string;
  invoice_address?: string;
  invoiceAddress?: string;
  status:
    | "Draft"
    | "Submitted"
    | "Under review"
    | "Clarification needed"
    | "Decision pending"
    | "Approved awaiting payment"
    | "Active"
    | "Deferred"
    | "Declined";
  attachments?: string[] | null;
  clarifications?: Array<{
    id: string;
    date?: string;
    created_at?: string;
    items?: string[];
    response?: string | null;
  }>;
  reviewers?: Array<{ id: string; name?: string }>;
  verifications?: Array<Record<string, unknown>>;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicantProfileResponse {
  success: boolean;
  message: string;
  data: {
    application: LiveApplication | null;
  } | null;
  fieldErrors?: Record<string, string> | null;
}

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
    if (data.errors && typeof data.errors === "object") {
      Object.entries(data.errors).forEach(([field, msgs]) => {
        fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
      });
    }

    return {
      success: false,
      message:
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : fallback,
      data: null,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : null,
    };
  }

  if (e?.request) {
    return {
      success: false,
      message: "Network error: check connection.",
      data: null,
      fieldErrors: null,
    };
  }

  return { success: false, message: fallback, data: null, fieldErrors: null };
};

class WebAplicatService {
  async requestApplicantOtp(businessEmail: string): Promise<ApplicantOtpResponse> {
    console.log("businessEmail"+businessEmail+"URL"+API_PUBLIC_APPLICANT_REQUEST_OTP)
    try {
      const res = await axiosClient.post(API_PUBLIC_APPLICANT_REQUEST_OTP, {
        businessEmail: businessEmail.trim().toLowerCase(),
      });
      return {
        success: true,
        message: res.data?.message ?? "Code sent.",
        data: res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Could not send code.");
      return { success: false, message: e.message, data: null };
    }
  }

  async verifyApplicantOtp(
    businessEmail: string,
    code: string,
  ): Promise<ApplicantOtpResponse> {
    try {
      const res = await axiosClient.post(API_PUBLIC_APPLICANT_VERIFY_OTP, {
        businessEmail: businessEmail.trim().toLowerCase(),
        code,
      });
      return {
        success: true,
        message: res.data?.message ?? "Signed in.",
        data: res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Invalid code.");
      return { success: false, message: e.message, data: null };
    }
  }

  /**
   * Fetches the logged-in applicant's database application record
   */
  async getProfile(): Promise<ApplicantProfileResponse> {
    const userId = authStore.getUserId();

    if (!userId) {
      return {
        success: false,
        message: "You are not signed in. Please sign in again.",
        data: null,
      };
    }

    try {
      const res = await axiosClient.get(API_APPLICANT_PROFILE_SHOW(userId));
      return {
        success: true,
        message: res.data?.message ?? "Profile loaded.",
        data: res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to load application profile.");
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /**
   * Updates application details directly in the database
   */
  async updateApplication(
    updateId: string,
    payload: Record<string, unknown> | FormData,
  ): Promise<ApplicantProfileResponse> {
    try {
      let body: FormData | Record<string, unknown>;
      if (payload instanceof FormData) {
        body = payload;
        if (!body.has("updateId")) {
          body.append("updateId", updateId);
        }
      } else {
        body = { ...payload, updateId };
      }

      const res = await axiosClient.post(API_APPLICATION_UPDATE, body);
      return {
        success: true,
        message: res.data?.message ?? "Application updated successfully.",
        data: res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Could not update application.");
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  /**
   * Logs out the applicant and clears backend JWT session
   */
  async logout(): Promise<boolean> {
    try {
      await axiosClient.post(API_APPLICANT_LOGOUT);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Trigger download of summary PDF for this application
   */
  downloadSummaryPdfUrl(id: string): string {
    return API_APPLICATION_DOWNLOAD_PDF(id);
  }
}

export const webAplicatService = new WebAplicatService();
export default webAplicatService;
