import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthResponse, LoginInput, PublicUser, RegisterInput } from '@afa/shared';
import { api, refreshSession, setAccessToken, setSessionExpiredHandler } from '../lib/api.ts';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: PublicUser }
  | { status: 'anonymous'; user: null };

type AuthContextValue = AuthState & {
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: PublicUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  const startSession = useCallback(({ user, accessToken }: AuthResponse) => {
    setAccessToken(accessToken);
    setState({ status: 'authenticated', user });
  }, []);

  const endSession = useCallback(() => {
    setAccessToken(null);
    setState({ status: 'anonymous', user: null });
  }, []);

  // On load, swap the refresh cookie for an access token (lost on reload)
  useEffect(() => {
    setSessionExpiredHandler(endSession);
    refreshSession().then((session) => (session ? startSession(session) : endSession()));
  }, [startSession, endSession]);

  const login = useCallback(
    async (input: LoginInput) =>
      startSession(await api<AuthResponse>('/auth/login', { method: 'POST', body: input })),
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) =>
      startSession(await api<AuthResponse>('/auth/register', { method: 'POST', body: input })),
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      endSession();
    }
  }, [endSession]);

  const setUser = useCallback(
    (user: PublicUser) => setState({ status: 'authenticated', user }),
    [],
  );

  const value = useMemo(
    () => ({ ...state, login, register, logout, setUser }),
    [state, login, register, logout, setUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
