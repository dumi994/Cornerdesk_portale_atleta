import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { buildHostFromSlug, clearSession, loadSession, normalizeCustomHost, saveSession, type StoredSession } from '@/api/client';
import * as portalApi from '@/api/portal';
import type { StudentSummary } from '@/types/portal';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  host: string | null;
  token: string | null;
  student: StudentSummary | null;
  loginWithSlug: (slug: string, email: string, password: string) => Promise<void>;
  loginWithCustomHost: (host: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [host, setHost] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentSummary | null>(null);

  useEffect(() => {
    (async () => {
      const session = await loadSession();
      if (!session) {
        setStatus('signedOut');
        return;
      }
      // Il token Sanctum non ha scadenza automatica (ADR §9.2), ma può essere
      // stato revocato (logout su un altro device, reset password): verificare
      // con /me prima di considerarlo valido.
      try {
        const profile = await portalApi.fetchMe(session.host, session.token);
        setHost(session.host);
        setToken(session.token);
        setStudent(profile);
        setStatus('signedIn');
      } catch {
        await clearSession();
        setStatus('signedOut');
      }
    })();
  }, []);

  const completeLogin = useCallback(async (resolvedHost: string, email: string, password: string) => {
    const response = await portalApi.login(resolvedHost, email, password, 'App mobile');
    const session: StoredSession = { host: resolvedHost, token: response.token, student: response.student };
    await saveSession(session);
    setHost(session.host);
    setToken(session.token);
    setStudent(session.student);
    setStatus('signedIn');
  }, []);

  const loginWithSlug = useCallback(
    (slug: string, email: string, password: string) => completeLogin(buildHostFromSlug(slug), email, password),
    [completeLogin]
  );

  const loginWithCustomHost = useCallback(
    (customHost: string, email: string, password: string) => completeLogin(normalizeCustomHost(customHost), email, password),
    [completeLogin]
  );

  const logout = useCallback(async () => {
    if (host && token) {
      try {
        // Revoca solo il token di questo device (ADR §9.2) — se la richiesta
        // fallisce (rete assente) il device viene comunque disconnesso in locale.
        await portalApi.logout(host, token);
      } catch {
        // ignorato volutamente: vedi commento sopra.
      }
    }
    await clearSession();
    setHost(null);
    setToken(null);
    setStudent(null);
    setStatus('signedOut');
  }, [host, token]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, host, token, student, loginWithSlug, loginWithCustomHost, logout }),
    [status, host, token, student, loginWithSlug, loginWithCustomHost, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
