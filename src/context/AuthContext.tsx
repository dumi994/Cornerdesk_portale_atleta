import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import {
  buildHostFromSlug,
  clearSession,
  loadLastTenant,
  loadSession,
  normalizeCustomHost,
  saveLastTenant,
  saveSession,
  type StoredSession,
} from '@/api/client';
import * as portalApi from '@/api/portal';
import type { StudentSummary } from '@/types/portal';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  host: string | null;
  token: string | null;
  student: StudentSummary | null;
  /** Nome palestra ricordato dopo il primo login (ADR §9.1) — per l'header della dashboard. */
  tenantName: string | null;
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
  const [tenantName, setTenantName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const tenant = await loadLastTenant();
      if (tenant) setTenantName(tenant.displayName);

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

  const completeLogin = useCallback(
    async (resolvedHost: string, displayName: string, isCustomHost: boolean, email: string, password: string) => {
      const response = await portalApi.login(resolvedHost, email, password, 'App mobile');
      const session: StoredSession = { host: resolvedHost, token: response.token, student: response.student };
      await saveSession(session);
      // Ricordata anche fuori dalla sessione (ADR §9.1): sopravvive al logout,
      // così ai login successivi si chiedono solo email/password.
      await saveLastTenant({ displayName, host: resolvedHost, isCustomHost });
      setHost(session.host);
      setToken(session.token);
      setStudent(session.student);
      setTenantName(displayName);
      setStatus('signedIn');
    },
    []
  );

  const loginWithSlug = useCallback(
    (slug: string, email: string, password: string) =>
      completeLogin(buildHostFromSlug(slug), slug.trim(), false, email, password),
    [completeLogin]
  );

  const loginWithCustomHost = useCallback(
    (customHost: string, email: string, password: string) =>
      completeLogin(normalizeCustomHost(customHost), customHost.trim(), true, email, password),
    [completeLogin]
  );

  const logout = useCallback(async () => {
    if (host && token) {
      try {
        // Best-effort: rimuove anche il token push Expo di questo device,
        // se permessi/token sono ancora ottenibili (non bloccante altrimenti).
        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        await portalApi.unregisterPushToken(host, token, expoPushToken);
      } catch {
        // ignorato volutamente: nessun permesso/token disponibile, o rete assente.
      }
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
    () => ({ status, host, token, student, tenantName, loginWithSlug, loginWithCustomHost, logout }),
    [status, host, token, student, tenantName, loginWithSlug, loginWithCustomHost, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
