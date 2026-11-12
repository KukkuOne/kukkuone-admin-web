/**
 * The admin session, kept the way the platform portal keeps a phone session
 * (kukkuone-platform-web src/lib/phoneSession.ts): the token the gateway
 * minted at /admin/auth/verify, who it is for, and when it runs out. No
 * refresh: after 12 hours, sign in again.
 */
const TOKEN = 'kukku_admin_token';
const EMAIL = 'kukku_admin_email';
const NAME = 'kukku_admin_name';
const EXPIRES = 'kukku_admin_expires';

export interface Staff {
  id: string;
  name: string;
  email: string;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** The stored session, or null when there is none or it has run out (and is then dropped). */
export function adminSession(): { token: string; email: string; name: string } | null {
  const token = read(TOKEN);
  const email = read(EMAIL);
  if (!token || !email) return null;
  const exp = read(EXPIRES);
  if (!exp || new Date(exp).getTime() <= Date.now()) {
    forgetAdminSession();
    return null;
  }
  return { token, email, name: read(NAME) ?? email };
}

export function keepAdminSession(token: string, expiresAt: string, staff: Staff) {
  try {
    localStorage.setItem(TOKEN, token);
    localStorage.setItem(EMAIL, staff.email);
    localStorage.setItem(NAME, staff.name);
    localStorage.setItem(EXPIRES, expiresAt);
  } catch {
    // Blocked storage: this sign-in cannot outlive the tab, and nothing else breaks.
  }
}

export function forgetAdminSession() {
  try {
    [TOKEN, EMAIL, NAME, EXPIRES].forEach((k) => localStorage.removeItem(k));
  } catch {
    // Nothing stored to forget.
  }
}
