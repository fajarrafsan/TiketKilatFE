import type { AuthSession } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';

const SESSION_KEY = 'astracom.session';
const SESSION_EVENT = 'astracom:session';

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<AuthSession>;
  return typeof session.accessToken === 'string' && session.accessToken.trim().length > 0
    && typeof session.refreshToken === 'string' && session.refreshToken.trim().length > 0
    && typeof session.email === 'string' && session.email.trim().length > 0
    && (session.role === 'USER' || session.role === 'ADMIN');
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const session: unknown = JSON.parse(value);
    if (!isAuthSession(session)
      || (session as AuthSession & { apiBaseUrl?: string }).apiBaseUrl !== API_BASE_URL) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setSession(session: AuthSession) {
  if (!isAuthSession(session)) {
    throw new Error('Respons login tidak lengkap. Silakan coba masuk kembali.');
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, apiBaseUrl: API_BASE_URL }));
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function subscribeToSession(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(SESSION_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}
