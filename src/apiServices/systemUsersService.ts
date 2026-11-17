// src/apiServices/systemUsersService.ts
import systemUserAuthStore, { StoredSystemUser } from './systemUserAuthStore';
import axiosClient from './axiosClient';
import {
  API_SYSTEM_USER_LOGIN,
  API_SYSTEM_USER_LOGOUT,
  API_SYSTEM_USER_PROFILE,
  API_SYSTEM_USER_REGISTER,
  API_SYSTEM_USER_LIST,
  API_SYSTEM_USER_UPDATE_PASSWORD,
  API_SYSTEM_USER_UPDATE_PROFILE,
  API_SYSTEM_USER_DELETE,
  API_SYSTEM_USER_RESET_PASSWORD,
} from './APIs';

// ============================================================
// Types
// ============================================================

export type SystemUserRole = 'super_admin' | 'finance_admin' | 'membership_admin'| 'operations_officer';

export interface SystemUserUpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface SystemUserLoginPayload {
  email: string;
  password: string;
}
export interface SystemUserResetPasswordPayload {
  updateId: string;
  password: string;
  password_confirmation: string;
}
export interface SystemUserRegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: SystemUserRole;
}

export interface SystemUserUpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: SystemUserRole | string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string | null;
  initials?: string;
}

export interface SystemUserListFilters {
  search?: string;
  role?: SystemUserRole;
  is_active?: 0 | 1;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SystemUserApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  token?: string | null;
  fieldErrors?: Record<string, string> | null;
}

// ============================================================
// Error handler
// ============================================================

const handleError = (
  error: unknown,
  fallback: string,
): {
  success: false;
  message: string;
  data: null;
  fieldErrors: Record<string, string> | null;
} => {
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
    return { success: false, message: 'No internet connection.', data: null, fieldErrors: null };
  }

  return { success: false, message: fallback, data: null, fieldErrors: null };
};


// ============================================================
// Helper — raw SystemUser → StoredSystemUser
// ============================================================

function toStoredSystemUser(raw: any): StoredSystemUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name ?? raw.full_name ?? '');
  return {
    id:        String(raw.id ?? ''),
    name,
    full_name: name,
    email:     String(raw.email ?? ''),
    role:      String(raw.role ?? 'membership_admin'),
    is_active: raw.is_active !== false,
    initials:  raw.initials ?? '',
  };
}

// ============================================================
// systemUsersService
// ============================================================

class SystemUsersService {
  // POST /api/v1/public/system-users/login
  async login(
    payload: SystemUserLoginPayload,
  ): Promise<SystemUserApiResponse<SystemUser>> {
    try {
      const res = await axiosClient.post(API_SYSTEM_USER_LOGIN, {
        email:    payload.email.trim().toLowerCase(),
        password: payload.password,
      });

      const body = res.data ?? {};
      const token: string | null = body?.data?.token ?? body?.token ?? null;
      const rawUser: any =
        body?.data?.user ?? body?.data?.system_user ?? body?.user ?? null;

      const stored = toStoredSystemUser(rawUser);

      if (token && stored) {
        systemUserAuthStore.setSession({ token, user: stored });
      } else if (token) {
        systemUserAuthStore.setToken(token);
      }

      return {
        success: true,
        message: body?.message ?? 'Signed in.',
        data:    rawUser as SystemUser,
        token,
      };
    } catch (error) {
      const e = handleError(error, 'Invalid email or password.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // POST /api/v1/auth/system-users/update-password
  async updatePassword(
    payload: SystemUserUpdatePasswordPayload,
  ): Promise<SystemUserApiResponse<null>> {
    try {
      const res = await axiosClient.post(API_SYSTEM_USER_UPDATE_PASSWORD, {
        current_password:      payload.current_password,
        password:              payload.password,
        password_confirmation: payload.password_confirmation,
      });

      return {
        success: true,
        message: res.data?.message ?? 'Password updated.',
        data:    null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update password.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // POST /api/v1/auth/admin/system-users/reset-password  (admin only)
  async resetPassword(payload: SystemUserResetPasswordPayload,): Promise<SystemUserApiResponse<null>> {
    try {
      const res = await axiosClient.post(API_SYSTEM_USER_RESET_PASSWORD,payload);

      return {
        success: true,
        message: res.data?.message ?? 'Password reset.',
        data:    null,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to reset password.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // POST /api/v1/public/system-users/register
  async register(
    payload: SystemUserRegisterPayload,
  ): Promise<SystemUserApiResponse<SystemUser>> {
    try {
      const res = await axiosClient.post(API_SYSTEM_USER_REGISTER, payload);
      const rawUser = res.data?.data?.user ?? res.data?.data ?? null;
      return {
        success: true,
        message: res.data?.message ?? 'System user created.',
        data:    rawUser as SystemUser,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to register system user.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // GET /api/v1/auth/system-users/profile
  async getProfile(): Promise<SystemUserApiResponse<SystemUser>> {
    try {
      const res = await axiosClient.get(API_SYSTEM_USER_PROFILE);
      const rawUser = res.data?.data?.user ?? res.data?.data ?? null;
      const stored  = toStoredSystemUser(rawUser);
      if (stored) systemUserAuthStore.setUser(stored);
      return {
        success: true,
        message: res.data?.message ?? 'Profile fetched.',
        data:    rawUser as SystemUser,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to load profile.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // POST /api/v1/auth/system-users/logout
  async logout(): Promise<SystemUserApiResponse<null>> {
    try {
      const res = await axiosClient.post(API_SYSTEM_USER_LOGOUT);
      systemUserAuthStore.clear();
      return { success: true, message: res.data?.message ?? 'Logged out.', data: null };
    } catch (error) {
      systemUserAuthStore.clear();
      const e = handleError(error, 'Logged out locally.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // POST /api/v1/auth/system-users/update-profile
  async updateProfile(
    payload: SystemUserUpdateProfilePayload,
  ): Promise<SystemUserApiResponse<SystemUser>> {
    try {
      const res = await axiosClient.post(API_SYSTEM_USER_UPDATE_PROFILE, payload);
      const rawUser = res.data?.data?.user ?? res.data?.data ?? null;
      const stored  = toStoredSystemUser(rawUser);
      if (stored) systemUserAuthStore.setUser(stored);
      return {
        success: true,
        message: res.data?.message ?? 'Profile updated.',
        data:    rawUser as SystemUser,
      };
    } catch (error) {
      const e = handleError(error, 'Failed to update profile.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // DELETE /api/v1/auth/system-users/delete/{id}
  async deleteAccount(id: string): Promise<SystemUserApiResponse<null>> {
    try {
      const res = await axiosClient.delete(`${API_SYSTEM_USER_DELETE}/${id}`);
      return { success: true, message: res.data?.message ?? 'System user deleted.', data: null };
    } catch (error) {
      const e = handleError(error, 'Failed to delete system user.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // GET /api/v1/auth/system-users/list
  async list(
    filters: SystemUserListFilters = {},
  ): Promise<SystemUserApiResponse<{ items: SystemUser[]; total: number }>> {
    try {
      const res = await axiosClient.get(API_SYSTEM_USER_LIST, { params: filters });
      const payload = res.data?.data ?? {};
      return {
        success: true,
        message: res.data?.message ?? 'System users fetched.',
        data: {
          items: Array.isArray(payload.items) ? payload.items : [],
          total: typeof payload.total === 'number' ? payload.total : 0,
        },
      };
    } catch (error) {
      const e = handleError(error, 'Failed to fetch system users.');
      return { success: false, message: e.message, data: null, fieldErrors: e.fieldErrors };
    }
  }

  // ── Convenience helpers ──
  isAuthenticated(): boolean {
    return systemUserAuthStore.isAuthenticated();
  }

  getUser(): StoredSystemUser | null {
    return systemUserAuthStore.getUser();
  }

  getToken(): string | null {
    return systemUserAuthStore.getToken();
  }
}

export const systemUsersService = new SystemUsersService();
export default systemUsersService;
