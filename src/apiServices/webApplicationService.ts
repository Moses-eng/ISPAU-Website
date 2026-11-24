import axiosClient from './axiosClient';
import { API_PUBLIC_APPLICATIONS_CREATE, API_PUBLIC_APPLICATIONS_DRAFT } from './APIs';

export interface MembershipApplicationPayload {
  id?: string | null;
  // Organisation identity
  legalName: string;
  tradingName?: string | null;
  entityType: string;
  registrationCountry: string;
  registrationReference: string;
  businessEmail: string;
  businessPhone: string;
  website?: string | null;
  registeredAddress: string;
  ugandaAddress: string;

  // Account
  password?: string | null;
  password_confirmation?: string | null;

  // Profile
  category: string;
  operationalStatus: string;
  requestedTier: string;
  customerFacing: 'Yes' | 'No';
  services?: string | null;
  regions?: string | null;
  parentGroup?: string | null;

  // Compliance
  pdpoStatus: string;
  pdpoReference?: string | null;
  pdpoValidity?: string | null;
  pdpoExplanation?: string | null;
  licenceRelevant: string;
  licenceType?: string | null;
  licenceStatus?: string | null;
  licenceNumber?: string | null;
  licenceHolder?: string | null;
  licenceValidity?: string | null;
  licenceType2?: string | null;
  licenceStatus2?: string | null;
  licenceNumber2?: string | null;
  licenceHolder2?: string | null;

  // Applicant / representative
  applicantName: string;
  applicantRole: string;
  applicantEmail: string;
  applicantPhone: string;
  representativeName: string;
  representativeRole: string;
  representativeEmail: string;
  representativePhone: string;
  alternateRepresentative?: string | null;
  sameRepresentative?: boolean;
  authorityConfirmed?: boolean;

  // Billing
  billingEmail: string;
  billingContact: string;
  invoiceAddress: string;
  tin?: string | null;
  purchaseOrder?: string | null;
  supportContact?: string | null;

  // Optional public profile
  joiningReasons?: string | null;
  priorities?: string | null;
  workingGroups?: string | null;
  publicName?: string | null;
  publicDescription?: string | null;
  publicServices?: string | null;
  publicCoverage?: string | null;
  publicWebsite?: string | null;
  publicContact?: string | null;

  // Restrictions
  hasRestrictions?: 'No' | 'Yes';
  restrictionDetails?: string | null;

  // Declarations
  accuracyDeclaration: boolean;
  authorityDeclaration: boolean;
  rulesDeclaration: boolean;
  restrictionsDeclaration: boolean;
  privacyDeclaration: boolean;
  directoryConsent?: boolean;
  promotionalConsent?: boolean;

  // Files: supports single File or File[] per category
  uploads?: {
    registrationEvidence?: File | File[] | null;
    licenceEvidence?: File | File[] | null;
    authorityEvidence?: File | File[] | null;
    pdpoEvidence?: File | File[] | null;
    publicLogo?: File | null;
    [key: string]: File | File[] | null | undefined;
  };
}

export interface WebApplicationResponse {
  success: boolean;
  message: string;
  data: any | null;
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

  return { success: false, message: fallback, data: null, fieldErrors: null };
};

const serializeFormData = (payload: MembershipApplicationPayload): FormData => {
  const form = new FormData();

  const scalarKeys: (keyof MembershipApplicationPayload)[] = [
    'id', 'legalName', 'tradingName', 'entityType', 'registrationCountry',
    'registrationReference', 'businessEmail', 'businessPhone', 'website',
    'password', 'password_confirmation',
    'registeredAddress', 'ugandaAddress',
    'category', 'operationalStatus', 'requestedTier', 'customerFacing',
    'services', 'regions', 'parentGroup',
    'pdpoStatus', 'pdpoReference', 'pdpoValidity', 'pdpoExplanation',
    'licenceRelevant', 'licenceType', 'licenceStatus', 'licenceNumber',
    'licenceHolder', 'licenceValidity',
    'licenceType2', 'licenceStatus2', 'licenceNumber2', 'licenceHolder2',
    'applicantName', 'applicantRole', 'applicantEmail', 'applicantPhone',
    'representativeName', 'representativeRole', 'representativeEmail',
    'representativePhone', 'alternateRepresentative',
    'billingEmail', 'billingContact', 'invoiceAddress',
    'tin', 'purchaseOrder', 'supportContact',
    'joiningReasons', 'priorities', 'workingGroups',
    'publicName', 'publicDescription', 'publicServices', 'publicCoverage',
    'publicWebsite', 'publicContact',
    'hasRestrictions', 'restrictionDetails',
  ];

  for (const key of scalarKeys) {
    const value = payload[key];
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  }

  const boolKeys: (keyof MembershipApplicationPayload)[] = [
    'sameRepresentative', 'authorityConfirmed',
    'accuracyDeclaration', 'authorityDeclaration', 'rulesDeclaration',
    'restrictionsDeclaration', 'privacyDeclaration',
    'directoryConsent', 'promotionalConsent',
  ];
  for (const key of boolKeys) {
    const value = payload[key];
    if (value !== undefined && value !== null) {
      form.append(key, value ? '1' : '0');
    }
  }

  if (payload.uploads) {
    for (const [uploadKey, val] of Object.entries(payload.uploads)) {
      if (Array.isArray(val)) {
        val.forEach((file) => {
          if (file instanceof File) {
            form.append(`uploads[${uploadKey}][]`, file);
          }
        });
      } else if (val instanceof File) {
        form.append(`uploads[${uploadKey}]`, val);
      }
    }
  }

  return form;
};

class WebApplicationService {
  async submitApplication(payload: MembershipApplicationPayload): Promise<WebApplicationResponse> {
    try {
      const form = serializeFormData(payload);
      const res = await axiosClient.post(API_PUBLIC_APPLICATIONS_CREATE, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return {
        success: true,
        message: res.data?.message ?? 'Application submitted.',
        data: res.data?.data ?? null,
      };
    } catch (error) {
      return handleError(error, 'Failed to submit application.');
    }
  }

  async saveDraft(payload: MembershipApplicationPayload): Promise<WebApplicationResponse> {
    try {
      const form = serializeFormData(payload);
      const res = await axiosClient.post(API_PUBLIC_APPLICATIONS_DRAFT, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      sessionStorage.removeItem("ispau.draft_application");

      return {
        success: true,
        message: res.data?.message ?? 'Draft saved.',
        data: res.data?.data ?? null,
      };
    } catch (error) {
      return handleError(error, 'Failed to save draft to server.');
    }
  }
}

export const webApplicationService = new WebApplicationService();
export default webApplicationService;
