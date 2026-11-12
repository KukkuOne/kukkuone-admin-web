import { ApiClient, ApiRequestError } from '@kukkuone/api-client';
import { adminSession, type Staff } from './session';

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:4200';

let onUnauthorized: () => void = () => {};
/** Called on any 401 from the admin API: the session ended, so back to sign-in. */
export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn;
}

class AdminApiClient extends ApiClient {
  override async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    try {
      return await super.request<T>(method, path, body);
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 401) onUnauthorized();
      throw e;
    }
  }
}

/** Shared gateway client, carrying the admin session's token. */
export const api = new AdminApiClient({
  baseUrl,
  getToken: () => {
    const s = adminSession();
    // Ran out while the console was open: end it here rather than send a dead token.
    if (!s) onUnauthorized();
    return s?.token ?? null;
  },
});

/** The sign-in routes: no token, and a 401 here is a wrong password, not a lost session. */
const open = new ApiClient({ baseUrl });

export interface LoginResponse {
  challenge_id: string;
  totp_enrolled: boolean;
  totp_enrolment?: { secret: string; otpauth_url: string };
}

export const authApi = {
  login: (email: string, password: string) => open.post<LoginResponse>('/admin/auth/login', { email, password }),
  verify: (challengeId: string, code: string) =>
    open.post<{ token: string; expiresAt: string; staff: Staff }>('/admin/auth/verify', {
      challenge_id: challengeId,
      totp_code: code,
    }),
  passwordLink: (email: string) => open.post<void>('/admin/auth/password/link', { email }),
  passwordToken: (token: string) =>
    open.get<{ email: string; purpose: 'welcome' | 'reset'; expiresAt: string }>(
      `/admin/auth/password/token?token=${encodeURIComponent(token)}`,
    ),
  setPassword: (token: string, password: string) => open.post<void>('/admin/auth/password/set', { token, password }),
};

/** The gateway's error code, for looking up a localised message. */
export const errorCode = (e: unknown) => (e instanceof ApiRequestError ? e.code : undefined);
export const errorStatus = (e: unknown) => (e instanceof ApiRequestError ? e.status : undefined);
