// src/apiServices/Users_APIs.ts
import { BASE_URL } from './env';

type ResourceId = string | number;

// ============================================================
// SYSTEM USER — Auth & Profile
// ============================================================
export const API_SYSTEM_USER_REGISTER       = BASE_URL + '/api/v1/public/system-users/register';
export const API_SYSTEM_USER_LOGIN          = BASE_URL + '/api/v1/public/system-users/login';
export const API_SYSTEM_USER_LOGOUT         = BASE_URL + '/api/v1/auth/system-users/logout';
export const API_SYSTEM_USER_PROFILE        = BASE_URL + '/api/v1/auth/system-users/profile';
export const API_SYSTEM_USER_LIST           = BASE_URL + '/api/v1/auth/system-users/list';
export const API_SYSTEM_USER_UPDATE_PROFILE = BASE_URL + '/api/v1/auth/system-users/update-profile';
export const API_SYSTEM_USER_DELETE         = BASE_URL + '/api/v1/auth/system-users/delete';
export const API_SYSTEM_USER_UPDATE_PASSWORD = BASE_URL + '/api/v1/auth/system-users/update-password';
export const API_SYSTEM_USER_RESET_PASSWORD  = BASE_URL + '/api/v1/auth/system-users/reset-password';

// ============================================================
// SYSTEM USER — Activity History
// ============================================================
export const API_ACTIVITY_HISTORY_LIST   = BASE_URL + '/api/v1/auth/system-users/activity/list';
export const API_ACTIVITY_HISTORY_ACTORS = BASE_URL + '/api/v1/auth/system-users/activity/actors';

// ============================================================
// SYSTEM USER — Staff History
// ============================================================
export const API_STAFF_HISTORY_LIST      = BASE_URL + '/api/v1/auth/system-users/staff-history/list';


// ============================================================
// APPLICATIONS — ADMIN
// ============================================================
export const API_ADMIN_APPLICATIONS_LIST   = BASE_URL + "/api/v1/auth/admin/applications/list";
export const API_ADMIN_APPLICATIONS_UPDATE = BASE_URL + "/api/v1/auth/admin/applications/update";
export const API_ADMIN_APPLICATIONS_DELETE = BASE_URL + "/api/v1/auth/admin/applications/delete";
export const API_ADMIN_APPLICATIONS_SHOW   = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/applications/show/${id}`;
export const API_ADMIN_APPLICATIONS_SUMMARY_PDF = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/applications/summary-pdf/${id}`;


export const API_ADMIN_APPLICATIONS_CLARIFICATIONS_LIST = (applicationId: ResourceId) => BASE_URL + `/api/v1/auth/admin/applications/${applicationId}/clarifications`;
export const API_ADMIN_APPLICATIONS_CLARIFICATIONS_RAISE = BASE_URL + "/api/v1/auth/admin/applications/clarifications/raise";
export const API_ADMIN_APPLICATIONS_CLARIFICATIONS_RESPOND = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/applications/clarifications/${id}/respond`;
export const API_ADMIN_APPLICATIONS_CLARIFICATIONS_CLOSE = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/applications/clarifications/${id}/close`;

export const API_ADMIN_APPLICATIONS_REVIEWERS_LIST = (applicationId: ResourceId) => BASE_URL + `/api/v1/auth/admin/applications/${applicationId}/reviewers`;
export const API_ADMIN_APPLICATIONS_REVIEWERS_ASSIGN = BASE_URL + "/api/v1/auth/admin/applications/reviewers/assign";
export const API_ADMIN_APPLICATIONS_REVIEWERS_WITHDRAW = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/applications/reviewers/${id}`;

export const API_ADMIN_APPLICATIONS_VERIFICATIONS_LIST = (applicationId: ResourceId) => BASE_URL + `/api/v1/auth/admin/applications/${applicationId}/verifications`;
export const API_ADMIN_APPLICATIONS_VERIFICATIONS_RECORD = BASE_URL + "/api/v1/auth/admin/applications/verifications/record";


// ============================================================
// TIER (Admin CRUD)
// ============================================================
export const API_ADMIN_TIERS_LIST   = BASE_URL + '/api/v1/auth/admin/tiers/list';
export const API_ADMIN_TIERS_SHOW   = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/tiers/show/${id}`;
export const API_PUBLIC_TIERS_STORE = BASE_URL + '/api/v1/auth/admin/tiers/store';
export const API_ADMIN_TIERS_UPDATE = BASE_URL + '/api/v1/auth/admin/tiers/update';
export const API_ADMIN_TIERS_DELETE = BASE_URL + '/api/v1/auth/admin/tiers/delete';

// ============================================================
// HERO SLIDE Admin CRUD
// ============================================================
export const API_ADMIN_HERO_SLIDES_LIST     = BASE_URL + '/api/v1/auth/admin/hero-slides/list';
export const API_ADMIN_HERO_SLIDES_SHOW     = (id: ResourceId) =>BASE_URL + `/api/v1/auth/admin/hero-slides/show/${id}`;
export const API_ADMIN_HERO_SLIDES_STORE    = BASE_URL + '/api/v1/auth/admin/hero-slides/store';
export const API_ADMIN_HERO_SLIDES_UPDATE   = BASE_URL + '/api/v1/auth/admin/hero-slides/update';
export const API_ADMIN_HERO_SLIDES_DELETE   = BASE_URL + '/api/v1/auth/admin/hero-slides/delete';

// ============================================================
// BANNER (Admin CRUD
// ============================================================
export const API_ADMIN_BANNERS_LIST    = BASE_URL + '/api/v1/auth/admin/banners/list';
export const API_ADMIN_BANNERS_SHOW    = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/banners/show/${id}`;
export const API_ADMIN_BANNERS_STORE   = BASE_URL + '/api/v1/auth/admin/banners/store';
export const API_ADMIN_BANNERS_UPDATE  = BASE_URL + '/api/v1/auth/admin/banners/update';
export const API_ADMIN_BANNERS_DELETE  = BASE_URL + '/api/v1/auth/admin/banners/delete';

// ============================================================
// INVOICES (Admin CRUD)
// ============================================================
export const API_ADMIN_INVOICES_LIST   = BASE_URL + '/api/v1/auth/admin/invoices/list';
export const API_ADMIN_INVOICES_SHOW   = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/invoices/show/${id}`;
export const API_ADMIN_INVOICES_STORE  = BASE_URL + '/api/v1/auth/admin/invoices/store';
export const API_ADMIN_INVOICES_UPDATE = BASE_URL + '/api/v1/auth/admin/invoices/update';
export const API_ADMIN_INVOICES_DELETE = BASE_URL + '/api/v1/auth/admin/invoices/delete';

// ============================================================
// PAYMENTS (Admin CRUD)
// ============================================================
export const API_ADMIN_PAYMENTS_LIST   = BASE_URL + '/api/v1/auth/admin/payments/list';
export const API_ADMIN_PAYMENTS_SHOW   = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/payments/show/${id}`;
export const API_ADMIN_PAYMENTS_STORE  = BASE_URL + '/api/v1/auth/admin/payments/store';
export const API_ADMIN_PAYMENTS_UPDATE = BASE_URL + '/api/v1/auth/admin/payments/update';
export const API_ADMIN_PAYMENTS_DELETE = BASE_URL + '/api/v1/auth/admin/payments/delete';

// ============================================================
// RECEIPTS (Admin CRUD)
// ============================================================
export const API_ADMIN_RECEIPTS_LIST   = BASE_URL + '/api/v1/auth/admin/receipts/list';
export const API_ADMIN_RECEIPTS_SHOW   = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/receipts/show/${id}`;
export const API_ADMIN_RECEIPTS_STORE  = BASE_URL + '/api/v1/auth/admin/receipts/store';
export const API_ADMIN_RECEIPTS_UPDATE = BASE_URL + '/api/v1/auth/admin/receipts/update';
export const API_ADMIN_RECEIPTS_DELETE = BASE_URL + '/api/v1/auth/admin/receipts/delete';

// ============================================================
// ADMIN NOTIFICATIONS
// ============================================================
// ============================================================
// ADMIN NOTIFICATIONS  (super-admin: all notifications, no adminId)
// ============================================================
export const API_ADMIN_NOTIFICATIONS_LIST           = BASE_URL + "/api/v1/admin/notifications";
export const API_ADMIN_NOTIFICATIONS_RECENT         = BASE_URL + "/api/v1/admin/notifications/recent";
export const API_ADMIN_NOTIFICATIONS_STATISTICS     = BASE_URL + "/api/v1/admin/notifications/statistics";
export const API_ADMIN_NOTIFICATIONS_MARK_ALL_READ  = BASE_URL + "/api/v1/admin/notifications/mark-all-read";
export const API_ADMIN_NOTIFICATIONS_STORE          = BASE_URL + "/api/v1/admin/notifications/store";
export const API_ADMIN_NOTIFICATIONS_BULK_DELETE    = BASE_URL + "/api/v1/admin/notifications/bulk-delete";
export const API_ADMIN_NOTIFICATIONS_SHOW           = (id: ResourceId) => BASE_URL + `/api/v1/admin/notifications/${id}`;
export const API_ADMIN_NOTIFICATIONS_MARK_READ      = (id: ResourceId) => BASE_URL + `/api/v1/admin/notifications/${id}/read`;
export const API_ADMIN_NOTIFICATIONS_DELETE         = (id: ResourceId) => BASE_URL + `/api/v1/admin/notifications/${id}`;
// ============================================================
// FINANCE ADMIN NOTIFICATIONS
// ============================================================
// ============================================================
// FINANCE ADMIN NOTIFICATIONS  (no adminId — views all)
// ============================================================
export const API_FINANCE_ADMIN_NOTIFICATIONS_LIST           = BASE_URL + "/api/v1/finance-admin/notifications";
export const API_FINANCE_ADMIN_NOTIFICATIONS_RECENT         = BASE_URL + "/api/v1/finance-admin/notifications/recent";
export const API_FINANCE_ADMIN_NOTIFICATIONS_STATISTICS     = BASE_URL + "/api/v1/finance-admin/notifications/statistics";
export const API_FINANCE_ADMIN_NOTIFICATIONS_MARK_ALL_READ  = BASE_URL + "/api/v1/finance-admin/notifications/mark-all-read";
export const API_FINANCE_ADMIN_NOTIFICATIONS_STORE          = BASE_URL + "/api/v1/finance-admin/notifications/store";
export const API_FINANCE_ADMIN_NOTIFICATIONS_BULK_DELETE    = BASE_URL + "/api/v1/finance-admin/notifications/bulk-delete";
export const API_FINANCE_ADMIN_NOTIFICATIONS_SHOW           = (id: ResourceId) => BASE_URL + `/api/v1/finance-admin/notifications/${id}`;
export const API_FINANCE_ADMIN_NOTIFICATIONS_MARK_READ      = (id: ResourceId) => BASE_URL + `/api/v1/finance-admin/notifications/${id}/read`;
export const API_FINANCE_ADMIN_NOTIFICATIONS_DELETE         = (id: ResourceId) => BASE_URL + `/api/v1/finance-admin/notifications/${id}`;


// ============================================================
// OPERATIONS OFFICER NOTIFICATIONS  (no adminId — views all)
// ============================================================
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_LIST           = BASE_URL + "/api/v1/operations-officer/notifications";
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_RECENT         = BASE_URL + "/api/v1/operations-officer/notifications/recent";
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_STATISTICS     = BASE_URL + "/api/v1/operations-officer/notifications/statistics";
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_MARK_ALL_READ  = BASE_URL + "/api/v1/operations-officer/notifications/mark-all-read";
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_STORE          = BASE_URL + "/api/v1/operations-officer/notifications/store";
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_BULK_DELETE    = BASE_URL + "/api/v1/operations-officer/notifications/bulk-delete";
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_SHOW           = (id: ResourceId) => BASE_URL + `/api/v1/operations-officer/notifications/${id}`;
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_MARK_READ      = (id: ResourceId) => BASE_URL + `/api/v1/operations-officer/notifications/${id}/read`;
export const API_OPERATIONS_OFFICER_NOTIFICATIONS_DELETE         = (id: ResourceId) => BASE_URL + `/api/v1/operations-officer/notifications/${id}`;
// ============================================================
// MEMBERSHIP ADMIN NOTIFICATIONS  (no adminId — views all)
// ============================================================
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_LIST           = BASE_URL + "/api/v1/membership-admin/notifications";
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_RECENT         = BASE_URL + "/api/v1/membership-admin/notifications/recent";
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_STATISTICS     = BASE_URL + "/api/v1/membership-admin/notifications/statistics";
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_MARK_ALL_READ  = BASE_URL + "/api/v1/membership-admin/notifications/mark-all-read";
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_STORE          = BASE_URL + "/api/v1/membership-admin/notifications/store";
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_BULK_DELETE    = BASE_URL + "/api/v1/membership-admin/notifications/bulk-delete";
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_SHOW           = (id: ResourceId) => BASE_URL + `/api/v1/membership-admin/notifications/${id}`;
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_MARK_READ      = (id: ResourceId) => BASE_URL + `/api/v1/membership-admin/notifications/${id}/read`;
export const API_MEMBERSHIP_ADMIN_NOTIFICATIONS_DELETE         = (id: ResourceId) => BASE_URL + `/api/v1/membership-admin/notifications/${id}`;

// ============================================================
// DISPUTES ADMIN DISPUTES
// ============================================================
export const API_ADMIN_DISPUTES_LIST   = BASE_URL + "/api/v1/auth/admin/disputes/list";
export const API_ADMIN_DISPUTES_SHOW   = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/disputes/show/${id}`;
export const API_ADMIN_DISPUTES_UPDATE = BASE_URL + "/api/v1/auth/admin/disputes/update";
export const API_ADMIN_DISPUTES_DELETE = BASE_URL + "/api/v1/auth/admin/disputes/delete";

// ============================================================
// CONTACTS ADMIN DISPUTES
// ============================================================
export const API_ADMIN_CONTACTS_LIST   = BASE_URL + "/api/v1/auth/admin/contacts/list";
export const API_ADMIN_CONTACTS_SHOW   = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/contacts/show/${id}`;
export const API_ADMIN_CONTACTS_UPDATE = BASE_URL + "/api/v1/auth/admin/contacts/update";
export const API_ADMIN_CONTACTS_DELETE = BASE_URL + "/api/v1/auth/admin/contacts/delete";

// ============================================================
// STATISTICS
// ============================================================
export const API_ADMIN_STATISTICS        = BASE_URL + '/api/v1/auth/admin/statistics';
export const API_ADMIN_STATISTICS_BADGES = BASE_URL + '/api/v1/auth/admin/statistics/badges';

// ============================================================
// ADMIN — SUBSCRIPTIONS
// ============================================================

export const API_ADMIN_SUBSCRIPTIONS_LIST = BASE_URL+'/api/v1/auth/admin/subscriptions/list';
export const API_ADMIN_SUBSCRIPTIONS_SHOW = (id: string) => BASE_URL+`/api/v1/auth/admin/subscriptions/show/${id}`;


// ============================================================
// BLOG (Admin)
// ============================================================
export const API_ADMIN_BLOG_LIST   = BASE_URL + '/api/v1/auth/admin/blog/list';
export const API_ADMIN_BLOG_SHOW   = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/blog/show/${id}`;
export const API_ADMIN_BLOG_STORE  = BASE_URL + '/api/v1/auth/admin/blog/store';
export const API_ADMIN_BLOG_UPDATE = BASE_URL + '/api/v1/auth/admin/blog/update';
export const API_ADMIN_BLOG_DELETE = BASE_URL + '/api/v1/auth/admin/blog/delete';

// ============================================================
// ACTIVITY (Admin)
// ============================================================
export const API_ADMIN_ACTIVITY_LIST   = BASE_URL + '/api/v1/auth/admin/activity/list';
export const API_ADMIN_ACTIVITY_SHOW   = (id: string) => BASE_URL + `/api/v1/auth/admin/activity/show/${id}`;
export const API_ADMIN_ACTIVITY_STORE  = BASE_URL + '/api/v1/auth/admin/activity/store';
export const API_ADMIN_ACTIVITY_UPDATE = BASE_URL + '/api/v1/auth/admin/activity/update';
export const API_ADMIN_ACTIVITY_DELETE = BASE_URL + '/api/v1/auth/admin/activity/delete';
