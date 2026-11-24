import axiosClient from './axiosClient';
import {
  API_ADMIN_APPLICATIONS_LIST,
  API_ADMIN_APPLICATIONS_SHOW,
  API_ADMIN_APPLICATIONS_UPDATE,
  API_ADMIN_APPLICATIONS_DELETE,
  API_ADMIN_APPLICATIONS_SUMMARY_PDF,
  API_ADMIN_APPLICATIONS_CLARIFICATIONS_LIST,
  API_ADMIN_APPLICATIONS_CLARIFICATIONS_RAISE,
  API_ADMIN_APPLICATIONS_CLARIFICATIONS_RESPOND,
  API_ADMIN_APPLICATIONS_CLARIFICATIONS_CLOSE,
  API_ADMIN_APPLICATIONS_REVIEWERS_WITHDRAW,
  API_ADMIN_APPLICATIONS_REVIEWERS_ASSIGN,
  API_ADMIN_APPLICATIONS_REVIEWERS_LIST,
  API_ADMIN_APPLICATIONS_VERIFICATIONS_LIST,
  API_ADMIN_APPLICATIONS_VERIFICATIONS_RECORD,
} from './APIs';

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under review'
  | 'Clarification needed'
  | 'Decision pending'
  | 'Approved awaiting payment'
  | 'Active'
  | 'Deferred'
  | 'Declined';

export interface ApplicationAttachments {
  registrationEvidence?: string;
  licenceEvidence?: string;
  authorityEvidence?: string;
  pdpoEvidence?: string;
  publicLogo?: string;
  [key: string]: string | undefined;
}
export interface Clarification {
  id: string;
  application_id: string;
  reviewer_id: string;
  reviewer_name: string;
  assigned_by: string;
  assigned_by_name: string | null;
  subject: string;
  message: string;
  items: string[];
  response: string | null;
  responded_at: string | null;
  status: "Open" | "Responded" | "Accepted" | "Rejected" | "Closed";
  requested_at: string;
}

 export interface VerificationCheck {
  label: string;
  result: "Verified" | "Clarification needed" | "Not applicable";
  note: string;
}
export interface Verification {
  id: string;
  application_id: string;
  reviewer_id: string;
  reviewer_name: string;
  assigned_by: string;
  assigned_by_name: string | null;
  checks: {
    registration: VerificationCheck;
    authority:    VerificationCheck;
    regulatory:   VerificationCheck;
  };
  status: "Recorded" | "Superseded";
  recorded_at: string;
}
  export interface Reviewer {
  id: string;
  application_id: string;
  reviewer_id: string;
  reviewer_name: string;
  assigned_by: string;
  assigned_by_name: string | null;
  status: "Assigned" | "In review" | "Completed" | "Withdrawn";
  assigned_at: string;
  completed_at: string | null;
}
export interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;

  legal_name: string;
  trading_name: string | null;
  entity_type: string;
  registration_country: string;
  registration_reference: string;
  business_email: string;
  business_phone: string;
  website: string | null;
  registered_address: string;
  uganda_address: string;

  category: string;
  operational_status: string;
  requested_tier: string;
  customer_facing: string;

  pdpo_status: string;
  licence_relevant: string;

  applicant_name: string;
  applicant_role: string;
  applicant_email: string;
  applicant_phone: string;
  representative_name: string;
  representative_role: string;
  representative_email: string;
  representative_phone: string;

  billing_email: string;
  billing_contact: string;
  invoice_address: string;

  organisation_details: {
    services?: string;
    regions?: string;
    parent_group?: string;
    [key: string]: unknown;
  } | null;

  compliance_details: {
    pdpo_reference?: string;
    pdpo_validity?: string;
    pdpo_explanation?: string;
    licence_type?: string;
    licence_status?: string;
    licence_number?: string;
    licence_holder?: string;
    licence_validity?: string;
    licence_type_2?: string;
    licence_status_2?: string;
    licence_number_2?: string;
    licence_holder_2?: string;
    [key: string]: unknown;
  } | null;

  applicant_details: {
    alternate_representative?: string;
    same_representative?: boolean;
    authority_confirmed?: boolean;
    [key: string]: unknown;
  } | null;

  billing_details: {
    tin?: string;
    purchase_order?: string;
    support_contact?: string;
    [key: string]: unknown;
  } | null;

  profile_optional: {
    joining_reasons?: string;
    priorities?: string;
    working_groups?: string;
    public_name?: string;
    public_description?: string;
    public_services?: string;
    public_coverage?: string;
    public_website?: string;
    public_contact?: string;
    [key: string]: unknown;
  } | null;

  restrictions: {
    has_restrictions?: 'Yes' | 'No';
    restriction_details?: string;
  } | null;

  declarations: {
    accuracy?: boolean;
    authority?: boolean;
    rules?: boolean;
    restrictions?: boolean;
    privacy?: boolean;
    directory?: boolean;
    promotional?: boolean;
  } | null;

  attachments: ApplicationAttachments | null;
}

export interface ApplicationFilters {
  search?: string;
  status?: string;
  requested_tier?: string;
  category?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  include_drafts?: boolean;
}

export interface ApplicationUpdatePayload {
    status: ApplicationStatus;
}

export interface ApiListResponse {
  success: boolean;
  message: string;
  data: Application[];
  total: number;
}

export interface ApiSingleResponse {
  success: boolean;
  message: string;
  data: Application | null;
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
    if (data.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([field, msgs]) => {
        fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
      });
    }
    return {
      success: false,
      message: data.message || fallback,
      data: null,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : null,
    };
  }

  return { success: false, message: fallback, data: null, fieldErrors: null };
};

class ApplicationService {
  // applicationService.list({ status: "Active", search: query }) on Members
  async list(filters: ApplicationFilters = {}): Promise<ApiListResponse> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
      );

      const res = await axiosClient.get(API_ADMIN_APPLICATIONS_LIST, {
        params: cleanParams,
      });

      const items = res.data?.data?.items ?? [];
      const total = res.data?.data?.total ?? items.length;

      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: items,
        total,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load applications.');
      return { success: false, message: e.message, data: [], total: 0 };
    }
  }



  async show(id: string): Promise<ApiSingleResponse> {
    try {
      const res = await axiosClient.get(API_ADMIN_APPLICATIONS_SHOW(id));
      const app = res.data?.data?.application ?? res.data?.data ?? null;
      return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: app,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load application.');
      return { success: false, message: e.message, data: null };
    }
  }

  async update(id: string, payload: ApplicationUpdatePayload): Promise<ApiSingleResponse> {
    try {
      const res = await axiosClient.post(API_ADMIN_APPLICATIONS_UPDATE, {
        updateId: id,
        status: payload.status,
      });
      return {
        success: true,
        message: res.data?.message ?? 'Updated.',
        data: res.data?.data?.application ?? res.data?.data ?? null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update application.');
      return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
      };
    }
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await axiosClient.delete(API_ADMIN_APPLICATIONS_DELETE, {
        data: { deleteId: id },
      });
      return { success: true, message: res.data?.message ?? 'Deleted.' };
    } catch (error) {
      const e = handleError(error, 'Failed to delete application.');
      return { success: false, message: e.message };
    }
  }
  async downloadSummary(id: string, legalName?: string): Promise<{ success: boolean; message: string }> {
      try {
        if (typeof API_ADMIN_APPLICATIONS_SUMMARY_PDF !== 'function') {
          throw new Error('API_ADMIN_APPLICATIONS_SUMMARY_PDF endpoint is not configured in APIs.ts');
        }

        const url = API_ADMIN_APPLICATIONS_SUMMARY_PDF(id);
        const res = await axiosClient.get(url, {
          responseType: 'blob',
        });

        // Handle cases where the server returned a JSON error inside a blob response
        if (res.data?.type === 'application/json') {
          const text = await res.data.text();
          const json = JSON.parse(text);
          throw new Error(json.message || 'Failed to generate PDF summary.');
        }

        // Resolve filename
        let downloadName = '';
        const disposition = res.headers?.['content-disposition'] || '';
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          downloadName = match[1].replace(/['"]/g, '').trim();
        } else {
          const safeName = (legalName || 'Application').replace(/[^a-zA-Z0-9_-]/g, '_');
          downloadName = `ISPAU_Application_${safeName}_${id}.pdf`;
        }

        const blob = new Blob([res.data], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', downloadName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);

        return { success: true, message: 'PDF downloaded successfully.' };
      } catch (error: any) {
        let errorMsg = 'Failed to download application summary PDF.';
        if (error?.response?.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const json = JSON.parse(text);
            if (json.message) errorMsg = json.message;
          } catch {
            // ignore
          }
        } else if (error?.message) {
          errorMsg = error.message;
        }
        return { success: false, message: errorMsg };
      }
    }


  // ======================= CLARIFICATIONS ==========================

    async listClarifications(applicationId: string): Promise<{
    success: boolean;
    message: string;
    data: Clarification[];
  }> {
    try {
      const res = await axiosClient.get(
        API_ADMIN_APPLICATIONS_CLARIFICATIONS_LIST(applicationId),
      );
      const items = res.data?.data?.items ?? [];
      return { success: true, message: res.data?.message ?? "Loaded.", data: items };
    } catch (error) {
      const e = handleError(error, "Failed to load clarifications.");
      return { success: false, message: e.message, data: [] };
    }
  }

  async raiseClarification(payload: {
    applicationId: string;
    reviewerId: string;
    assigned_by?: string;

    reviewerName: string;
    assignedByName?: string;
    subject: string;
    message: string;

    items?: string[];
    applicantEmail?: string;
    applicantName?: string;
  }): Promise<{ success: boolean; message: string; data: Clarification | null }> {
    try {
      const res = await axiosClient.post(
        API_ADMIN_APPLICATIONS_CLARIFICATIONS_RAISE,
        payload,
      );
      return {
        success: true,
        message: res.data?.message ?? "Clarification raised.",
        data: res.data?.data?.clarification ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to raise clarification.");
      return { success: false, message: e.message, data: null };
    }
  }

  async respondClarification(
    id: string,
    response: string,
    status: Clarification["status"] = "Responded",
  ): Promise<{ success: boolean; message: string; data: Clarification | null }> {
    try {
      const res = await axiosClient.post(API_ADMIN_APPLICATIONS_CLARIFICATIONS_RESPOND(id),
        { response, status },
      );
      return {
        success: true,
        message: res.data?.message ?? "Response recorded.",
        data: res.data?.data?.clarification ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to save clarification response.");
      return { success: false, message: e.message, data: null };
    }
  }

  async closeClarification(
    id: string,
    status: "Accepted" | "Rejected" | "Closed" = "Closed",
  ): Promise<{ success: boolean; message: string; data: Clarification | null }> {
    try {
      const res = await axiosClient.post(
        API_ADMIN_APPLICATIONS_CLARIFICATIONS_CLOSE(id),
        { status },
      );
      return {
        success: true,
        message: res.data?.message ?? "Clarification closed.",
        data: res.data?.data?.clarification ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to close clarification.");
      return { success: false, message: e.message, data: null };
    }
  }
  // ======================= Reviewer ==========================
  async listReviewers(applicationId: string): Promise<{
    success: boolean;
    message: string;
    data: Reviewer[];
  }> {
    try {
      const res = await axiosClient.get(
        API_ADMIN_APPLICATIONS_REVIEWERS_LIST(applicationId),
      );
      const items = res.data?.data?.items ?? [];
      return { success: true, message: res.data?.message ?? "Loaded.", data: items };
    } catch (error) {
      const e = handleError(error, "Failed to load reviewers.");
      return { success: false, message: e.message, data: [] };
    }
  }

  async assignReviewer(payload: {
    applicationId: string;
    reviewerId: string;
    reviewerName: string;
    assignedByName?: string;
    assigned_by?: string;
  }): Promise<{ success: boolean; message: string; data: Reviewer | null }> {
    try {
      const res = await axiosClient.post(
        API_ADMIN_APPLICATIONS_REVIEWERS_ASSIGN,
        payload,
      );
      return {
        success: true,
        message: res.data?.message ?? "Reviewer assigned.",
        data: res.data?.data?.reviewer ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to assign reviewer.");
      return { success: false, message: e.message, data: null };
    }
  }

  async withdrawReviewer(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await axiosClient.delete(
        API_ADMIN_APPLICATIONS_REVIEWERS_WITHDRAW(id),
      );
      return { success: true, message: res.data?.message ?? "Withdrawn." };
    } catch (error) {
      const e = handleError(error, "Failed to withdraw reviewer.");
      return { success: false, message: e.message };
    }
  }
  // ======================= Verification ==========================

    async listVerifications(applicationId: string): Promise<{
    success: boolean;
    message: string;
    data: Verification[];
  }> {
    try {
      const res = await axiosClient.get(
        API_ADMIN_APPLICATIONS_VERIFICATIONS_LIST(applicationId),
      );
      const items = res.data?.data?.items ?? [];
      return { success: true, message: res.data?.message ?? "Loaded.", data: items };
    } catch (error) {
      const e = handleError(error, "Failed to load verifications.");
      return { success: false, message: e.message, data: [] };
    }
  }

  async recordVerification(payload: {
    applicationId: string;
    reviewerId: string;
    reviewerName: string;
    assignedByName?: string;
    /** raw dialog field names — exactly as rendered */
    "result-0": string;
    "note-0":   string;
    "result-1": string;
    "note-1":   string;
    "result-2": string;
    "note-2":   string;
  }): Promise<{ success: boolean; message: string; data: Verification | null }> {

    console.log("payload"+JSON.stringify(payload))
    try {
      const res = await axiosClient.post(
        API_ADMIN_APPLICATIONS_VERIFICATIONS_RECORD,
        payload,
      );
      return {
        success: true,
        message: res.data?.message ?? "Verification recorded.",
        data: res.data?.data?.verification ?? null,
      };
    } catch (error) {
      const e = handleError(error, "Failed to record verification.");
      return { success: false, message: e.message, data: null };
    }
  }
}

export const applicationService = new ApplicationService();
export default applicationService;

