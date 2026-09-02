import type { AuthSession } from '@/lib/types';

const SESSION_KEY = 'astracom.session';
const SESSION_EVENT = 'astracom:session';

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
