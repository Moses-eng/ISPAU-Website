// src/apiServices/notificationServiceResolver.ts
import systemUserAuthStore from "@/apiServices/systemUserAuthStore";
import adminNotificationService from "@/apiServices/adminNotificationService";
import membershipAdminNotificationService from "@/apiServices/membershipAdminNotificationService";
import financeAdminNotificationService from "@/apiServices/financeAdminNotificationService";
import operationsOfficerNotificationService from "@/apiServices/operationsOfficerNotificationService";
import type { AdminNotification, AdminNotificationFilters } from "@/apiServices/adminNotificationService";

export function getNotificationServiceForCurrentRole() {
  const user = systemUserAuthStore.getUser();
  const role = user?.role;

  switch (role) {
    case "finance_admin":
      return financeAdminNotificationService;
    case "membership_admin":
      return membershipAdminNotificationService;
    case "operations_officer":
      return operationsOfficerNotificationService;
    case "super_admin":
    default:
      return adminNotificationService;
  }
}

export type { AdminNotification as StaffNotification, AdminNotificationFilters as StaffNotificationFilters };
