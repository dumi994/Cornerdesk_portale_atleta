import * as SecureStore from 'expo-secure-store';

import type { StudentSummary } from '@/types/portal';

const SESSION_KEY = 'portal_session';
const DEFAULT_DOMAIN = 'cornerdesk.it';

export interface StoredSession {
  /** Host completo, es. "https://fightgym.cornerdesk.it" (nessuno slash finale). */
  host: string;
  token: string;
  student: StudentSummary;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function buildHostFromSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  return `https://${trimmed}.${DEFAULT_DOMAIN}`;
}

export function normalizeCustomHost(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function resolveTenantHost(useCustomHost: boolean, slug: string, customHost: string): string {
  return useCustomHost ? normalizeCustomHost(customHost) : buildHostFromSlug(slug);
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  query?: Record<string, string | number | undefined>;
  token?: string | null;
}

/**
 * Ogni palestra (tenant) è un sottodominio: non esiste un host globale per
 * l'API (ADR §9.1), quindi `host` va passato esplicitamente ad ogni chiamata
 * invece di essere una costante di modulo.
 */
export async function apiFetch<T>(host: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${host}/api/portal${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Impossibile raggiungere il server. Controlla la connessione o l'indirizzo della palestra.");
  }

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = (payload as { message?: string } | null)?.message ?? `Errore del server (${response.status}).`;
    throw new ApiError(response.status, message, (payload as { errors?: Record<string, string[]> } | null)?.errors);
  }

  return (payload ?? {}) as T;
}
