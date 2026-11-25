import { BASE_URL } from "./env";

type ResourceId = string | number;

// ============================================================
// PUBLIC
// ============================================================
export const API_PUBLIC_CONTACTS_CREATE = BASE_URL + "/api/v1/public/contacts/store";
export const API_PUBLIC_APPLICATIONS_CREATE = BASE_URL + "/api/v1/public/applications/store";
export const API_PUBLIC_APPLICATIONS_DRAFT = '/api/v1/public/applications/draft';
export const API_PUBLIC_TIERS_LIST = BASE_URL + '/api/v1/public/tiers/list';
export const API_PUBLIC_HERO_SLIDES_LIST = BASE_URL + '/api/v1/public/hero-slides/list';
export const API_PUBLIC_BANNERS_LIST   = BASE_URL + '/api/v1/public/banners/list';
export const API_PUBLIC_DIRECTORY_LIST = "/api/v1/public/directory/list";
export const API_PUBLIC_DIRECTORY_SHOW = (id: string) => `/api/v1/public/directory/show/${id}`;
export const API_PUBLIC_DISPUTES_CREATE = BASE_URL + "/api/v1/public/disputes/store";




export const API_PUBLIC_APPLICANT_REQUEST_OTP = BASE_URL + "/api/v1/public/applications/auth/request-otp";
export const API_PUBLIC_APPLICANT_VERIFY_OTP = BASE_URL + "/api/v1/public/applications/auth/verify-otp";
export const API_APPLICANT_PROFILE_SHOW = (id: ResourceId) => BASE_URL + `/api/v1/auth/applicant/profile/show/${id}`;
export const API_APPLICANT_LOGOUT = BASE_URL + "/api/v1/auth/applicant/logout";
export const API_APPLICANT_PROFILE_UPDATE     = BASE_URL + "/api/v1/auth/applicant/profile/update";


export const API_APPLICATION_UPDATE = BASE_URL + "/api/v1/public/applications/update";
export const API_APPLICATION_DOWNLOAD_PDF = (id: ResourceId) => `${BASE_URL}/api/v1/public/applications/${id}/pdf`;

// ============================================================
// APPLICANT NOTIFICATIONS
// ============================================================
export const API_APPLICANT_NOTIFICATIONS_LIST        = (applicantId: ResourceId) =>BASE_URL + `/api/v1/applicant/notifications/list/${applicantId}`;
export const API_APPLICANT_NOTIFICATIONS_RECENT      = (applicantId: ResourceId) =>BASE_URL + `/api/v1/applicant/notifications/recent/${applicantId}`;
export const API_APPLICANT_NOTIFICATIONS_STATISTICS  = (applicantId: ResourceId) =>BASE_URL + `/api/v1/applicant/notifications/statistics/${applicantId}`;
export const API_APPLICANT_NOTIFICATIONS_MARK_ALL_READ = (applicantId: ResourceId) =>BASE_URL + `/api/v1/applicant/notifications/mark-all-read/${applicantId}`;
export const API_APPLICANT_NOTIFICATIONS_STORE       = BASE_URL + "/api/v1/applicant/notifications/store";
export const API_APPLICANT_NOTIFICATIONS_BULK_DELETE = BASE_URL + "/api/v1/applicant/notifications/bulk-delete";
export const API_APPLICANT_NOTIFICATIONS_SHOW        = (id: ResourceId) =>BASE_URL + `/api/v1/applicant/notifications/${id}`;
export const API_APPLICANT_NOTIFICATIONS_MARK_READ   = (id: ResourceId) =>BASE_URL + `/api/v1/applicant/notifications/${id}/read`;
export const API_APPLICANT_NOTIFICATIONS_DELETE      = (id: ResourceId) =>BASE_URL + `/api/v1/applicant/notifications/${id}`;
export const API_APPLICANT_RECEIPTS_UPLOAD = BASE_URL + '/api/v1/auth/receipts/upload';

// ============================================================
// APPLICANT — SUBSCRIPTION
// ============================================================
export const API_APPLICANT_SUBSCRIPTION = BASE_URL+'/api/v1/auth/applicant/subscription';

// ============================================================
// BLOG — PUBLIC
// ============================================================
export const API_PUBLIC_BLOG_LIST = BASE_URL + '/api/v1/public/blog/list';
export const API_PUBLIC_BLOG_SHOW = (slug: string) =>BASE_URL + `/api/v1/public/blog/show/${encodeURIComponent(slug)}`;

// ============================================================
// API ENDPOINTS (Public Activity)
// ============================================================
export const API_PUBLIC_ACTIVITY_LIST = BASE_URL + '/api/v1/public/activity/list';
export const API_PUBLIC_ACTIVITY_SHOW = (slug: string) =>BASE_URL + `/api/v1/public/activity/show/${encodeURIComponent(slug)}`;
