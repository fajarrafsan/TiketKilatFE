'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { apiPost } from '@/lib/api';
import {
  clearSession,
  getSession,
  setSession,
  subscribeToSession,
} from '@/lib/session';
import type { AuthResponse, AuthSession } from '@/lib/types';

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, updateSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => updateSession(getSession());
    sync();
    setReady(true);
    return subscribeToSession(sync);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiPost<AuthResponse>(
      '/auth/login',
      { email, password },
      { auth: false },
    );
    const nextSession: AuthSession = {
      accessToken: response.aksesToken,
      refreshToken: response.refreshToken,
      role: response.role,
      email: response.email,
    };
    setSession(nextSession);
    updateSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    const current = getSession();
    try {
      if (current?.refreshToken) {
        await apiPost(
          '/auth/logout',
          { refreshToken: current.refreshToken },
          { auth: false },
        );
      }
    } finally {
      clearSession();
      updateSession(null);
    }
  }, []);

  const value = useMemo(
    () => ({ session, ready, login, logout }),
    [session, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
