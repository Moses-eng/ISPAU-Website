// src/apiServices/systemUserAuthStore.ts

export interface StoredSystemUser {
  id: string;
  name: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  initials: string;
}

interface SystemUserSessionState {
  token: string | null;
  user: StoredSystemUser | null;
}

const TOKEN_KEY  = 'ispau.system_user.token';
const USER_KEY   = 'ispau.system_user.user';
const AUTH_EVENT = 'system_user:auth:changed';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function emitAuthChange(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

const systemUserAuthStore = {
  getToken(): string | null {
    if (!isBrowser()) return null;
    return window.sessionStorage.getItem(TOKEN_KEY);
  },

  getUser(): StoredSystemUser | null {
    if (!isBrowser()) return null;
    const raw = window.sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSystemUser;
    } catch {
      return null;
    }
  },
  getUserId(): string | null {
    const user = this.getUser();
    const id = user?.id?.trim();
    return id && id.length > 0 ? id : null;
  },
  isSuperAdmin(): boolean {
    return this.getUser()?.role === 'super_admin';
  },

  isFinanceAdmin(): boolean {
    return this.getUser()?.role === 'finance_admin';
  },

  isMembershipAdmin(): boolean {
    return this.getUser()?.role === 'membership_admin';
  },

  setToken(token: string | null): void {
    if (!isBrowser()) return;
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
    emitAuthChange();
  },

  setUser(user: StoredSystemUser | null): void {
    if (!isBrowser()) return;
    if (user) window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(USER_KEY);
    emitAuthChange();
  },

  setSession(state: SystemUserSessionState): void {
    this.setToken(state.token);
    this.setUser(state.user);
  },

  getSession(): SystemUserSessionState {
    return { token: this.getToken(), user: this.getUser() };
  },

  clear(): void {
    if (!isBrowser()) return;
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    emitAuthChange();
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },

  AUTH_EVENT,
};

export default systemUserAuthStore;
