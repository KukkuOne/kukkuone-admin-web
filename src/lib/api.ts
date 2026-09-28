import { ApiClient } from '@kukkuone/api-client';
import { firebaseEnabled, getFirebaseIdToken } from './firebase';

const STORAGE_KEY = 'kukku_admin_email';

export function getAdminEmail(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
export function setAdminEmail(email: string): void {
  localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
}
export function clearAdminEmail(): void {
  localStorage.removeItem(STORAGE_KEY);
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:4200';

/**
 * Shared gateway client. In dev mode the bearer token is `dev:<email>`; in
 * firebase mode it is the current user's Firebase ID token.
 */
export const api = new ApiClient({
  baseUrl,
  getToken: async () => {
    if (firebaseEnabled) return await getFirebaseIdToken();
    const email = getAdminEmail();
    return email ? `dev:${email}` : null;
  },
});
