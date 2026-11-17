export const staffApiBase = (
  import.meta.env.VITE_ADMIN_API_BASE || "/api/admin"
).replace(/\/$/, "")
export const localStaffAuthentication =
  import.meta.env.DEV && !import.meta.env.VITE_ADMIN_API_BASE
export const staffBasePath = "/"
export const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || ""
