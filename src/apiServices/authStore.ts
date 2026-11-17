// src/apiServices/authStore.ts

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  contact: string;
  notifications?: string[];
  location?: string | null;
  status?: string;
}

interface SessionState {
  token: string | null;
  user: StoredUser | null;
}

const TOKEN_KEY = 'yasiga.token';
const USER_KEY  = 'yasiga.user';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

const authStore = {
  getToken(): string | null {
    if (!isBrowser()) return null;
    return window.sessionStorage.getItem(TOKEN_KEY);
  },

  getUser(): StoredUser | null {
    if (!isBrowser()) return null;
    const raw = window.sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },

  /**
   * Convenience accessor — returns the current user's phone contact,
   * or null if no session / no contact is stored.
   */
  getContact(): string | null {
    const user = this.getUser();
    const contact = user?.contact?.trim();
    return contact && contact.length > 0 ? contact : null;
  },

  /**
   * Convenience accessor — returns the current user's application id,
   * or null if no session / no id is stored.
   * Used as the `{id}` path parameter for applicant profile endpoints.
   */
  getUserId(): string | null {
    const user = this.getUser();
    const id = user?.id?.trim();
    return id && id.length > 0 ? id : null;
  },

  setToken(token: string | null): void {
    if (!isBrowser()) return;
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  },

  setUser(user: StoredUser | null): void {
    if (!isBrowser()) return;
    if (user) window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(USER_KEY);
  },

  /** Persist both at once (typical login flow). */
  setSession(state: SessionState): void {
    this.setToken(state.token);
    this.setUser(state.user);
  },

  getSession(): SessionState {
    return { token: this.getToken(), user: this.getUser() };
  },

  /** Clear everything — used on logout or 401. */
  clear(): void {
    if (!isBrowser()) return;
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};

export default authStore;
